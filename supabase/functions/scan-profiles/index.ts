import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function uploadAvatar(supabase: ReturnType<typeof createClient>, id: string, imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = "jpg";
    const path = `${id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error("Avatar upload error:", error.message); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Add cache buster to force refresh
    return data.publicUrl + "?t=" + Date.now();
  } catch (e) { console.error("Avatar upload failed:", e); return null; }
}

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
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser(token);
      if (userError) {
        console.error("Auth error:", userError.message);
      }
      userId = user?.id ?? null;
      console.log("Authenticated userId:", userId);
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
        const userInfoUrl = `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`;
        console.log("Fetching user info:", userInfoUrl);
        const userInfoRes = await fetch(userInfoUrl, {
          headers: { "x-access-key": hikerApiKey },
        });

        const userInfoText = await userInfoRes.text();
        console.log("UserInfo response status:", userInfoRes.status, "body length:", userInfoText.length, "preview:", userInfoText.substring(0, 500));

        if (!userInfoRes.ok) {
          results.push({
            username: profile.username,
            newFollows: 0,
            unfollows: 0,
            error: `User info failed: ${userInfoRes.status} - ${userInfoText.substring(0, 200)}`,
          });
          continue;
        }

        const userInfo = JSON.parse(userInfoText);
        const igUserId = userInfo.pk || userInfo.id;
        console.log("Parsed igUserId:", igUserId, "type:", typeof igUserId);

        // Profil-Metadaten updaten
        const igAvatarUrl = userInfo.hd_profile_pic_url_info?.url || userInfo.profile_pic_url || null;
        let permanentAvatarUrl = profile.avatar_url;
        if (igAvatarUrl) {
          const uploaded = await uploadAvatar(supabase, profile.id, igAvatarUrl);
          if (uploaded) permanentAvatarUrl = uploaded;
        }

        await supabase
          .from("tracked_profiles")
          .update({
            avatar_url: permanentAvatarUrl,
            display_name: userInfo.full_name || null,
            follower_count: userInfo.follower_count || 0,
            following_count: userInfo.following_count || 0,
            last_scanned_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        // 2. Following-Liste laden

        // 2. Following-Liste laden (v1 endpoint returns ALL followings in one request)
        console.log("Fetching all followings for user_id:", igUserId);
        const followingRes = await fetch(
          `https://api.hikerapi.com/v1/user/following?user_id=${igUserId}&amount=0`,
          { headers: { "x-access-key": hikerApiKey } }
        );

        if (!followingRes.ok) {
          const errBody = await followingRes.text();
          console.error("Following fetch failed:", followingRes.status, errBody);
          throw new Error(`Following fetch failed: ${followingRes.status} - ${errBody}`);
        }

        const followingUsers = await followingRes.json();
        console.log("Following response type:", Array.isArray(followingUsers) ? "array" : typeof followingUsers, "length/keys:", Array.isArray(followingUsers) ? followingUsers.length : Object.keys(followingUsers).slice(0, 5).join(","));

        // v1/user/following returns an array of user objects directly
        const rawUsers: Array<Record<string, unknown>> = Array.isArray(followingUsers) 
          ? followingUsers 
          : (followingUsers.users || followingUsers.items || followingUsers.response || []);

        const allFollowings = rawUsers.map((u: Record<string, unknown>) => ({
          username: u.username as string,
          pk: String(u.pk || u.id),
          profile_pic_url: (u.profile_pic_url as string) || undefined,
          full_name: (u.full_name as string) || undefined,
        }));
        console.log("Total followings fetched:", allFollowings.length);

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
          // Upload target avatar to permanent storage
          let targetAvatarUrl: string | null = f.profile_pic_url || null;
          if (targetAvatarUrl) {
            const uploaded = await uploadAvatar(supabase, `target-${f.pk}`, targetAvatarUrl);
            if (uploaded) targetAvatarUrl = uploaded;
          }

          if (!existingMap.has(f.pk)) {
            // Neuer Follow
            newFollowCount++;
            await supabase.from("profile_followings").insert({
              tracked_profile_id: profile.id,
              following_username: f.username,
              following_user_id: f.pk,
              following_avatar_url: targetAvatarUrl,
              following_display_name: f.full_name || null,
            });
            await supabase.from("follow_events").insert({
              tracked_profile_id: profile.id,
              event_type: "follow",
              target_username: f.username,
              target_avatar_url: targetAvatarUrl,
              target_display_name: f.full_name || null,
            });
          } else {
            // Bestehend -> last_seen_at updaten
            const existing = existingMap.get(f.pk) as Record<string, unknown>;
            await supabase
              .from("profile_followings")
              .update({
                last_seen_at: new Date().toISOString(),
                following_avatar_url: targetAvatarUrl,
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
