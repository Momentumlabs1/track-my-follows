import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FollowingUser {
  username: string;
  pk: string;
  profile_pic_url?: string;
  full_name?: string;
}

interface ScanResult {
  username: string;
  new_follows: number;
  unfollows: number;
  scan_type: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429 && i < retries) {
      console.log(`Rate limited, waiting ${(i + 1) * 3}s...`);
      await sleep((i + 1) * 3000);
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}

/** Fetch following list with pagination. For quick scan, only fetch first 2 pages. */
async function fetchFollowingList(
  userId: string,
  hikerApiKey: string,
  scanType: "quick" | "full",
): Promise<{ users: FollowingUser[]; complete: boolean }> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  const maxPages = scanType === "quick" ? 2 : 999;

  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const res = await fetchWithRetry(url, { "x-access-key": hikerApiKey });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Following chunk failed (page ${page}): ${res.status} ${text}`);
      if (res.status === 402) throw new Error(`HikerAPI 402: Guthaben aufgebraucht`);
      if (res.status === 429) throw new Error(`HikerAPI Rate Limit erreicht`);
      throw new Error(`Following fetch failed: ${res.status}`);
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
    await sleep(1000); // Rate limit between pages
  }

  return { users: allUsers, complete: !nextMaxId };
}

/** Fetch follower list (same pagination logic) */
async function fetchFollowerList(
  userId: string,
  hikerApiKey: string,
  scanType: "quick" | "full",
): Promise<{ users: FollowingUser[]; complete: boolean }> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  const maxPages = scanType === "quick" ? 2 : 999;

  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/followers/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const res = await fetchWithRetry(url, { "x-access-key": hikerApiKey });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Follower chunk failed (page ${page}): ${res.status} ${text}`);
      if (res.status === 402) throw new Error(`HikerAPI 402: Guthaben aufgebraucht`);
      if (res.status === 429) throw new Error(`HikerAPI Rate Limit erreicht`);
      throw new Error(`Follower fetch failed: ${res.status}`);
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
    await sleep(1000);
  }

  return { users: allUsers, complete: !nextMaxId };
}

/** Diff & sync users against DB snapshot */
async function diffAndSync(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  direction: "following" | "follower",
  lastScannedAt: string | null,
  isFullScan: boolean,
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
  const currentSet = new Set(currentUsers.map((f) => f.pk));

  // Random timestamps spread over scan interval
  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);

  let newCount = 0;
  let removedCount = 0;

  // New entries
  const newEntries: FollowingUser[] = [];
  for (const f of currentUsers) {
    if (!existingMap.has(f.pk)) {
      newEntries.push(f);
    } else {
      // Update last_seen_at
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

  // Only detect unfollows on full scan (we have the complete list)
  if (isFullScan) {
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
          notification_sent: false,
        });
      }
    }
  }

  return { newCount, removedCount };
}

/** Determine scan type for a profile based on user timezone */
function determineScanType(timezone: string): "quick" | "full" {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(now), 10);
    // Full scan between 19:00-20:00 local time
    return hour === 19 ? "full" : "quick";
  } catch {
    // Default to quick if timezone is invalid
    return "quick";
  }
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

    // Load all active profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("tracked_profiles")
      .select("*")
      .eq("is_active", true)
      .limit(30); // Max 30 per run to avoid timeout

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine aktiven Profile", scanned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load user timezones
    const userIds = [...new Set(profiles.map((p) => p.user_id))];
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("user_id, timezone")
      .in("user_id", userIds);

    const tzMap = new Map((userSettings || []).map((s) => [s.user_id, s.timezone]));

    const results: ScanResult[] = [];
    let totalNewFollows = 0;
    let totalUnfollows = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        const timezone = tzMap.get(profile.user_id) || "Europe/Vienna";
        const scanType = determineScanType(timezone);

        console.log(`Scanning ${profile.username} (${scanType}, tz=${timezone})`);

        // 1. Get user info
        await sleep(1000);
        const userInfoRes = await fetchWithRetry(
          `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
          { "x-access-key": hikerApiKey },
        );

        if (!userInfoRes.ok) {
          const errText = await userInfoRes.text();
          console.error(`User info failed for ${profile.username}: ${userInfoRes.status} ${errText}`);
          if (userInfoRes.status === 402) throw new Error("HikerAPI 402: Guthaben aufgebraucht");
          results.push({ username: profile.username, new_follows: 0, unfollows: 0, scan_type: scanType, error: `User info: ${userInfoRes.status}` });
          errors++;
          continue;
        }

        const userInfo = await userInfoRes.json();
        const igUserId = String(userInfo.pk || userInfo.id);

        // Check if private
        if (userInfo.is_private) {
          console.log(`${profile.username} is private, deactivating`);
          await supabase.from("tracked_profiles").update({ is_active: false }).eq("id", profile.id);
          results.push({ username: profile.username, new_follows: 0, unfollows: 0, scan_type: scanType, error: "Profil ist privat" });
          continue;
        }

        // Save previous counts before updating
        await supabase.from("tracked_profiles").update({
          previous_follower_count: profile.follower_count || 0,
          previous_following_count: profile.following_count || 0,
          avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
          display_name: userInfo.full_name || null,
          follower_count: userInfo.follower_count || 0,
          following_count: userInfo.following_count || 0,
          last_scanned_at: new Date().toISOString(),
        }).eq("id", profile.id);

        // 2. Fetch following list
        await sleep(1000);
        const followingResult = await fetchFollowingList(igUserId, hikerApiKey, scanType);
        console.log(`${profile.username}: fetched ${followingResult.users.length} following (complete: ${followingResult.complete})`);

        // 3. Fetch follower list
        await sleep(1000);
        const followerResult = await fetchFollowerList(igUserId, hikerApiKey, scanType);
        console.log(`${profile.username}: fetched ${followerResult.users.length} followers (complete: ${followerResult.complete})`);

        // 4. Diff & sync
        const isFullScan = scanType === "full";
        const followingDiff = await diffAndSync(supabase, profile.id, followingResult.users, "following", profile.last_scanned_at, isFullScan && followingResult.complete);
        const followerDiff = await diffAndSync(supabase, profile.id, followerResult.users, "follower", profile.last_scanned_at, isFullScan && followerResult.complete);

        const profileNewFollows = followingDiff.newCount + followerDiff.newCount;
        const profileUnfollows = followingDiff.removedCount + followerDiff.removedCount;
        totalNewFollows += profileNewFollows;
        totalUnfollows += profileUnfollows;

        results.push({
          username: profile.username,
          new_follows: profileNewFollows,
          unfollows: profileUnfollows,
          scan_type: scanType,
        });

        console.log(`${profile.username}: +${profileNewFollows} follows, -${profileUnfollows} unfollows`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error scanning ${profile.username}:`, errMsg);
        results.push({
          username: profile.username,
          new_follows: 0,
          unfollows: 0,
          scan_type: "error",
          error: errMsg,
        });
        errors++;

        // If 402, stop scanning all profiles
        if (errMsg.includes("402")) {
          console.error("HikerAPI credits exhausted, stopping all scans");
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({
        scanned: results.length,
        new_follows: totalNewFollows,
        unfollows: totalUnfollows,
        errors,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Auto-scan fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
