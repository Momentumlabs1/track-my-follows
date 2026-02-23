import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FollowingUser {
  username: string;
  pk: string;
  profile_pic_url?: string;
  full_name?: string;
}

/** Diff a list of users against what's stored in profile_followings, insert new / mark removed */
async function diffAndSync(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  direction: "following" | "follower",
  lastScannedAt: string | null,
) {
  // Load previous snapshot
  const { data: existing } = await supabase
    .from("profile_followings")
    .select("*")
    .eq("tracked_profile_id", profileId)
    .eq("direction", direction)
    .eq("is_current", true);

  const existingMap = new Map(
    (existing || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]),
  );
  const currentSet = new Set(currentUsers.map((f) => f.pk));

  // Random timestamps spread over scan interval
  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 24 * 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);

  // New entries
  const newEntries: FollowingUser[] = [];
  for (const f of currentUsers) {
    if (!existingMap.has(f.pk)) {
      newEntries.push(f);
    } else {
      const ex = existingMap.get(f.pk) as Record<string, unknown>;
      await supabase
        .from("profile_followings")
        .update({
          last_seen_at: new Date().toISOString(),
          following_avatar_url: f.profile_pic_url || null,
          following_display_name: f.full_name || null,
        })
        .eq("id", ex.id as string);
    }
  }

  const randomTs = newEntries
    .map(() => new Date(lastTs + Math.random() * spanMs))
    .sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < newEntries.length; i++) {
    const f = newEntries[i];
    const ts = randomTs[i].toISOString();
    await supabase.from("profile_followings").insert({
      tracked_profile_id: profileId,
      following_username: f.username,
      following_user_id: f.pk,
      following_avatar_url: f.profile_pic_url || null,
      following_display_name: f.full_name || null,
      first_seen_at: ts,
      direction,
    });
    await supabase.from("follow_events").insert({
      tracked_profile_id: profileId,
      event_type: "follow",
      target_username: f.username,
      target_avatar_url: f.profile_pic_url || null,
      target_display_name: f.full_name || null,
      detected_at: ts,
      direction,
    });
  }

  // Removed entries
  let removedCount = 0;
  for (const [userId, ex] of existingMap) {
    if (!currentSet.has(userId)) {
      removedCount++;
      const e = ex as Record<string, unknown>;
      await supabase
        .from("profile_followings")
        .update({ is_current: false })
        .eq("id", e.id as string);
      await supabase.from("follow_events").insert({
        tracked_profile_id: profileId,
        event_type: "unfollow",
        target_username: e.following_username as string,
        target_avatar_url: (e.following_avatar_url as string) || null,
        target_display_name: (e.following_display_name as string) || null,
        direction,
      });
    }
  }

  return { newCount: newEntries.length, removedCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser(token);
      if (userError) console.error("Auth error:", userError.message);
      userId = user?.id ?? null;
    }

    let query = supabase.from("tracked_profiles").select("*").eq("is_active", true);
    if (userId) query = query.eq("user_id", userId);
    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine aktiven Profile gefunden", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Array<{
      username: string;
      newFollows: number;
      unfollows: number;
      newFollowers: number;
      lostFollowers: number;
      error?: string;
    }> = [];

    for (const profile of profiles) {
      try {
        // 1. Get user info from HikerAPI
        const userInfoRes = await fetch(
          `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
          { headers: { "x-access-key": hikerApiKey } },
        );
        const userInfoText = await userInfoRes.text();
        if (!userInfoRes.ok) {
          results.push({ username: profile.username, newFollows: 0, unfollows: 0, newFollowers: 0, lostFollowers: 0, error: `User info failed: ${userInfoRes.status}` });
          continue;
        }

        const userInfo = JSON.parse(userInfoText);
        const igUserId = userInfo.pk || userInfo.id;

        // Update profile metadata
        await supabase.from("tracked_profiles").update({
          avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
          display_name: userInfo.full_name || null,
          follower_count: userInfo.follower_count || 0,
          following_count: userInfo.following_count || 0,
          last_scanned_at: new Date().toISOString(),
        }).eq("id", profile.id);

        // 2. Fetch following list
        const followingRes = await fetch(
          `https://api.hikerapi.com/v1/user/following?user_id=${igUserId}&amount=0`,
          { headers: { "x-access-key": hikerApiKey } },
        );
        if (!followingRes.ok) throw new Error(`Following fetch failed: ${followingRes.status}`);
        const followingRaw = await followingRes.json();
        const followingArr: Array<Record<string, unknown>> = Array.isArray(followingRaw)
          ? followingRaw
          : (followingRaw.users || followingRaw.items || followingRaw.response || []);
        const followingUsers: FollowingUser[] = followingArr.map((u) => ({
          username: u.username as string,
          pk: String(u.pk || u.id),
          profile_pic_url: (u.profile_pic_url as string) || undefined,
          full_name: (u.full_name as string) || undefined,
        }));

        // 3. Fetch follower list
        const followerRes = await fetch(
          `https://api.hikerapi.com/v1/user/followers?user_id=${igUserId}&amount=0`,
          { headers: { "x-access-key": hikerApiKey } },
        );
        let followerUsers: FollowingUser[] = [];
        if (followerRes.ok) {
          const followerRaw = await followerRes.json();
          const followerArr: Array<Record<string, unknown>> = Array.isArray(followerRaw)
            ? followerRaw
            : (followerRaw.users || followerRaw.items || followerRaw.response || []);
          followerUsers = followerArr.map((u) => ({
            username: u.username as string,
            pk: String(u.pk || u.id),
            profile_pic_url: (u.profile_pic_url as string) || undefined,
            full_name: (u.full_name as string) || undefined,
          }));
        } else {
          console.error("Follower fetch failed:", followerRes.status, await followerRes.text());
        }

        console.log(`${profile.username}: ${followingUsers.length} following, ${followerUsers.length} followers`);

        // 4. Diff & sync both lists
        const followingResult = await diffAndSync(supabase, profile.id, followingUsers, "following", profile.last_scanned_at);
        const followerResult = await diffAndSync(supabase, profile.id, followerUsers, "follower", profile.last_scanned_at);

        results.push({
          username: profile.username,
          newFollows: followingResult.newCount,
          unfollows: followingResult.removedCount,
          newFollowers: followerResult.newCount,
          lostFollowers: followerResult.removedCount,
        });
      } catch (err) {
        results.push({
          username: profile.username,
          newFollows: 0,
          unfollows: 0,
          newFollowers: 0,
          lostFollowers: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
