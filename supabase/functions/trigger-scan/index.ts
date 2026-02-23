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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchFollowingChunked(
  userId: string,
  hikerApiKey: string,
  maxPages: number,
): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;

  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Following fetch failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const users: Array<Record<string, unknown>> = data.users || data.items || [];
    for (const u of users) {
      allUsers.push({
        username: u.username as string,
        pk: String(u.pk || u.id),
        profile_pic_url: (u.profile_pic_url as string) || undefined,
        full_name: (u.full_name as string) || undefined,
      });
    }

    nextMaxId = data.next_max_id || null;
    page++;
    if (!nextMaxId || users.length === 0) break;
    if (page < maxPages) await sleep(1000);
  }

  return allUsers;
}

async function fetchFollowerChunked(
  userId: string,
  hikerApiKey: string,
  maxPages: number,
): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;

  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/followers/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Follower fetch failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const users: Array<Record<string, unknown>> = data.users || data.items || [];
    for (const u of users) {
      allUsers.push({
        username: u.username as string,
        pk: String(u.pk || u.id),
        profile_pic_url: (u.profile_pic_url as string) || undefined,
        full_name: (u.full_name as string) || undefined,
      });
    }

    nextMaxId = data.next_max_id || null;
    page++;
    if (!nextMaxId || users.length === 0) break;
    if (page < maxPages) await sleep(1000);
  }

  return allUsers;
}

/** Diff & sync */
async function diffAndSync(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  direction: "following" | "follower",
  lastScannedAt: string | null,
) {
  const { data: existing } = await supabase
    .from("profile_followings")
    .select("*")
    .eq("tracked_profile_id", profileId)
    .eq("direction", direction)
    .eq("is_current", true);

  const existingMap = new Map(
    (existing || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]),
  );

  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);

  let newCount = 0;
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
      notification_sent: false,
    });
    newCount++;
  }

  return { newCount };
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile ID from body
    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    let query = supabase.from("tracked_profiles").select("*").eq("user_id", user.id).eq("is_active", true);
    if (profileId) query = query.eq("id", profileId);
    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "Kein Profil gefunden" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = [];

    for (const profile of profiles) {
      // 1. User info
      const userInfoRes = await fetch(
        `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
        { headers: { "x-access-key": hikerApiKey } },
      );

      if (!userInfoRes.ok) {
        const errText = await userInfoRes.text();
        results.push({ username: profile.username, error: `${userInfoRes.status}: ${errText}` });
        continue;
      }

      const userInfo = await userInfoRes.json();
      const igUserId = String(userInfo.pk || userInfo.id);

      // Update profile
      await supabase.from("tracked_profiles").update({
        previous_follower_count: profile.follower_count || 0,
        previous_following_count: profile.following_count || 0,
        avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
        display_name: userInfo.full_name || null,
        follower_count: userInfo.follower_count || 0,
        following_count: userInfo.following_count || 0,
        last_scanned_at: new Date().toISOString(),
      }).eq("id", profile.id);

      // 2. Quick scan: 2 pages only
      await sleep(1000);
      const followingUsers = await fetchFollowingChunked(igUserId, hikerApiKey, 2);
      await sleep(1000);
      const followerUsers = await fetchFollowerChunked(igUserId, hikerApiKey, 2);

      console.log(`${profile.username}: ${followingUsers.length} following, ${followerUsers.length} followers (quick)`);

      // 3. Diff
      const followingDiff = await diffAndSync(supabase, profile.id, followingUsers, "following", profile.last_scanned_at);
      const followerDiff = await diffAndSync(supabase, profile.id, followerUsers, "follower", profile.last_scanned_at);

      results.push({
        username: profile.username,
        new_follows: followingDiff.newCount + followerDiff.newCount,
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Trigger-scan error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
