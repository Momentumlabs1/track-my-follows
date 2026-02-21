import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Optional: Auth prüfen wenn vom Frontend aufgerufen
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      userId = data?.claims?.sub as string | null;
    }

    // Alle aktiven Profile laden
    let query = supabase
      .from("tracked_profiles")
      .select("*")
      .eq("is_active", true);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine aktiven Profile gefunden", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      username: string;
      newFollows: number;
      unfollows: number;
      error?: string;
    }> = [];

    for (const profile of profiles) {
      try {
        // 1. Profil-Info von HikerAPI holen
        const userInfoRes = await fetch(
          `https://api.hikerapi.com/v2/user/by/username?username=${encodeURIComponent(profile.username)}`,
          { headers: { "x-access-key": hikerApiKey } }
        );

        if (!userInfoRes.ok) {
          results.push({
            username: profile.username,
            newFollows: 0,
            unfollows: 0,
            error: `User info failed: ${userInfoRes.status}`,
          });
          continue;
        }

        const userInfo = await userInfoRes.json();
        const igUserId = userInfo.pk || userInfo.id;

        // Profil-Metadaten updaten
        await supabase
          .from("tracked_profiles")
          .update({
            avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
            display_name: userInfo.full_name || null,
            follower_count: userInfo.follower_count || 0,
            following_count: userInfo.following_count || 0,
            last_scanned_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        // 2. Following-Liste komplett laden (paginiert)
        const allFollowings: Array<{
          username: string;
          pk: string;
          profile_pic_url?: string;
          full_name?: string;
        }> = [];

        let nextMaxId: string | null = null;
        let hasMore = true;

        while (hasMore) {
          const params = new URLSearchParams({ user_id: String(igUserId) });
          if (nextMaxId) params.set("max_id", nextMaxId);

          const followingRes = await fetch(
            `https://api.hikerapi.com/v2/user/following?${params.toString()}`,
            { headers: { "x-access-key": hikerApiKey } }
          );

          if (!followingRes.ok) {
            throw new Error(`Following fetch failed: ${followingRes.status}`);
          }

          const followingData = await followingRes.json();
          const users = followingData.users || followingData.items || [];
          allFollowings.push(
            ...users.map((u: Record<string, unknown>) => ({
              username: u.username as string,
              pk: String(u.pk || u.id),
              profile_pic_url: (u.profile_pic_url as string) || undefined,
              full_name: (u.full_name as string) || undefined,
            }))
          );

          nextMaxId = followingData.next_max_id || null;
          hasMore = !!nextMaxId && users.length > 0;
        }

        // 3. Vorherige Following-Liste aus DB laden
        const { data: existingFollowings } = await supabase
          .from("profile_followings")
          .select("*")
          .eq("tracked_profile_id", profile.id)
          .eq("is_current", true);

        const existingMap = new Map(
          (existingFollowings || []).map((f: Record<string, unknown>) => [
            f.following_user_id as string,
            f,
          ])
        );
        const currentSet = new Set(allFollowings.map((f) => f.pk));

        // 4. Neue Follows erkennen
        let newFollowCount = 0;
        for (const f of allFollowings) {
          if (!existingMap.has(f.pk)) {
            // Neuer Follow
            newFollowCount++;
            await supabase.from("profile_followings").insert({
              tracked_profile_id: profile.id,
              following_username: f.username,
              following_user_id: f.pk,
              following_avatar_url: f.profile_pic_url || null,
              following_display_name: f.full_name || null,
            });
            await supabase.from("follow_events").insert({
              tracked_profile_id: profile.id,
              event_type: "follow",
              target_username: f.username,
              target_avatar_url: f.profile_pic_url || null,
              target_display_name: f.full_name || null,
            });
          } else {
            // Bestehend -> last_seen_at updaten
            const existing = existingMap.get(f.pk) as Record<string, unknown>;
            await supabase
              .from("profile_followings")
              .update({
                last_seen_at: new Date().toISOString(),
                following_avatar_url: f.profile_pic_url || null,
                following_display_name: f.full_name || null,
              })
              .eq("id", existing.id as string);
          }
        }

        // 5. Unfollows erkennen
        let unfollowCount = 0;
        for (const [userId, existing] of existingMap) {
          if (!currentSet.has(userId)) {
            unfollowCount++;
            const ex = existing as Record<string, unknown>;
            await supabase
              .from("profile_followings")
              .update({ is_current: false })
              .eq("id", ex.id as string);
            await supabase.from("follow_events").insert({
              tracked_profile_id: profile.id,
              event_type: "unfollow",
              target_username: ex.following_username as string,
              target_avatar_url: (ex.following_avatar_url as string) || null,
              target_display_name: (ex.following_display_name as string) || null,
            });
          }
        }

        results.push({
          username: profile.username,
          newFollows: newFollowCount,
          unfollows: unfollowCount,
        });
      } catch (err) {
        results.push({
          username: profile.username,
          newFollows: 0,
          unfollows: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
