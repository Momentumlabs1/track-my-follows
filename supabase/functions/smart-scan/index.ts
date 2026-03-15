// smart-scan v4 — delta-gate for accurate event counts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FollowingUser {
  username: string;
  pk: string;
  profile_pic_url?: string;
  full_name?: string;
  follower_count?: number;
  is_private?: boolean;
  is_verified?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function categorizeFollow(followerCount: number | null | undefined, isPrivate: boolean | undefined): string {
  if (isPrivate) return "private";
  if (followerCount && followerCount > 100000) return "celebrity";
  if (followerCount && followerCount > 10000) return "influencer";
  return "normal";
}

// ── API response parsing ──
function toRecordArray(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function parseChunkResponse(payload: unknown): { users: Array<Record<string, unknown>>; nextMaxId: string | null } {
  if (Array.isArray(payload)) {
    if (Array.isArray(payload[0])) {
      return { users: toRecordArray(payload[0]), nextMaxId: typeof payload[1] === "string" && payload[1].length > 0 ? payload[1] : null };
    }
    return { users: toRecordArray(payload), nextMaxId: null };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const response = obj.response && typeof obj.response === "object" ? (obj.response as Record<string, unknown>) : null;
    const usersRaw = obj.users ?? obj.items ?? response?.users ?? response?.items ?? [];
    const nextRaw = obj.next_max_id ?? obj.nextMaxId ?? response?.next_max_id ?? response?.nextMaxId ?? null;
    return { users: toRecordArray(usersRaw), nextMaxId: typeof nextRaw === "string" && nextRaw.length > 0 ? nextRaw : null };
  }
  return { users: [], nextMaxId: null };
}

function mapFollowingUser(raw: Record<string, unknown>): FollowingUser | null {
  const username = typeof raw.username === "string" ? raw.username : null;
  const idRaw = raw.pk ?? raw.id ?? raw.user_id;
  if (!username || idRaw === undefined || idRaw === null) return null;
  let followerCount: number | undefined;
  if (typeof raw.follower_count === "number") followerCount = raw.follower_count;
  else if (typeof raw.follower_count === "string" && raw.follower_count.trim()) {
    const parsed = Number(raw.follower_count);
    if (!Number.isNaN(parsed)) followerCount = parsed;
  }
  return {
    username, pk: String(idRaw),
    profile_pic_url: typeof raw.profile_pic_url === "string" ? raw.profile_pic_url : undefined,
    full_name: typeof raw.full_name === "string" ? raw.full_name : undefined,
    follower_count: followerCount,
    is_private: typeof raw.is_private === "boolean" ? raw.is_private : undefined,
    is_verified: typeof raw.is_verified === "boolean" ? raw.is_verified : undefined,
  };
}

// ── Fetch page 1 only ──
async function fetchPage1(endpoint: string, userId: string, hikerApiKey: string): Promise<FollowingUser[]> {
  const baseUrl = endpoint === "following"
    ? `https://api.hikerapi.com/gql/user/following/chunk?user_id=${userId}`
    : `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}&count=200`;
  const res = await fetch(baseUrl, { headers: { "x-access-key": hikerApiKey } });
  if (res.status === 404) { await res.text(); return []; }
  if (!res.ok) { const text = await res.text(); throw new Error(`${endpoint} fetch failed: ${res.status} ${text}`); }
  const parsed = parseChunkResponse(await res.json());
  const users: FollowingUser[] = [];
  for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) users.push(u); }
  return users;
}

// ── Fetch ALL pages (full scan) ──
async function fetchAllPages(endpoint: string, userId: string, hikerApiKey: string): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;

  do {
    const url = endpoint === "following"
      ? (nextMaxId
          ? `https://api.hikerapi.com/gql/user/following/chunk?user_id=${userId}&max_id=${nextMaxId}`
          : `https://api.hikerapi.com/gql/user/following/chunk?user_id=${userId}`)
      : (nextMaxId
          ? `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}&count=200&max_id=${nextMaxId}`
          : `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}&count=200`);
    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (res.status === 404) { await res.text(); break; }
    if (!res.ok) { const text = await res.text(); throw new Error(`${endpoint} full-scan page ${page} failed: ${res.status} ${text}`); }
    const parsed = parseChunkResponse(await res.json());
    for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) allUsers.push(u); }
    nextMaxId = parsed.nextMaxId;
    page++;
    if (nextMaxId) await sleep(500);
  } while (nextMaxId && page < 200);

  return allUsers;
}

// ── Sync new follows (page 1 diff) with DELTA-GATE ──
async function syncNewFollows(
  supabaseClient: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  lastScannedAt: string | null,
  maxAllowed: number, // delta-gate: max events to create as real (rest = baseline backfill)
) {
  const { data: existing } = await supabaseClient
    .from("profile_followings")
    .select("following_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("direction", "following")
    .eq("is_current", true);

  const existingIds = new Set((existing || []).map((f: Record<string, unknown>) => f.following_user_id as string));
  const newEntries = currentUsers.filter((f) => !existingIds.has(f.pk));

  if (newEntries.length === 0) return 0;

  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);
  const randomTs = newEntries.map(() => new Date(lastTs + Math.random() * spanMs)).sort((a, b) => a.getTime() - b.getTime());

  let realEventCount = 0;
  for (let i = 0; i < newEntries.length; i++) {
    const f = newEntries[i];
    const ts = randomTs[i].toISOString();
    const genderTag = detectGender(f.full_name, f.username);
    const category = categorizeFollow(f.follower_count, f.is_private);
    const isBackfill = i >= maxAllowed; // delta-gate: beyond allowed count = backfill

    await supabaseClient.from("profile_followings").insert({
      tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk,
      following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null,
      first_seen_at: ts, direction: "following",
      gender_tag: genderTag,
      category: category,
    });

    if (!isBackfill) {
      await supabaseClient.from("follow_events").insert({
        tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
        target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
        detected_at: ts, direction: "following", notification_sent: false,
        gender_tag: genderTag,
        category: categorizeFollow(f.follower_count, f.is_private),
        target_follower_count: f.follower_count || null,
        target_is_private: f.is_private || false,
        is_initial: false,
      });
      // Gender-Count live updaten
      await supabaseClient.rpc("increment_gender_count", {
        p_profile_id: profileId,
        p_gender: genderTag,
      });
      realEventCount++;
    } else {
      // Backfill: still create event but mark as initial (won't show in weekly/insights)
      await supabaseClient.from("follow_events").insert({
        tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
        target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
        detected_at: ts, direction: "following", notification_sent: false,
        gender_tag: genderTag,
        category: categorizeFollow(f.follower_count, f.is_private),
        target_follower_count: f.follower_count || null,
        target_is_private: f.is_private || false,
        is_initial: true, // marked as backfill
      });
      await supabaseClient.rpc("increment_gender_count", {
        p_profile_id: profileId,
        p_gender: genderTag,
      });
    }
  }

  if (newEntries.length > maxAllowed) {
    console.log(`[DELTA-GATE] followings: ${newEntries.length} new found, capped to ${realEventCount} real events (${newEntries.length - realEventCount} backfilled)`);
  }

  return realEventCount;
}

// ── Sync new followers (page 1 diff) with BASELINE + DELTA-GATE ──
async function syncNewFollowers(
  supabaseClient: ReturnType<typeof createClient>,
  profileId: string,
  currentFollowers: FollowingUser[],
  lastScannedAt: string | null,
  maxAllowed: number, // delta-gate
) {
  // ── BASELINE CHECK: if profile_followers is empty, save ALL as initial ──
  const { count: baselineCount } = await supabaseClient
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("tracked_profile_id", profileId);

  if (baselineCount === 0) {
    console.log(`[FOLLOWER-BASELINE][smart-scan] No existing followers for ${profileId}, saving ${currentFollowers.length} as initial baseline`);
    const nowMs = Date.now();

    for (let i = 0; i < currentFollowers.length; i++) {
      const f = currentFollowers[i];
      const ts = new Date(nowMs - i * 1000).toISOString();

      await supabaseClient.from("profile_followers").insert({
        tracked_profile_id: profileId,
        follower_user_id: f.pk,
        follower_username: f.username,
        follower_avatar_url: f.profile_pic_url || null,
        follower_display_name: f.full_name || null,
        follower_follower_count: f.follower_count || null,
        follower_is_verified: f.is_verified || false,
        follower_is_private: f.is_private || false,
        first_seen_at: ts,
      });

      await supabaseClient.from("follower_events").insert({
        profile_id: profileId,
        instagram_user_id: f.pk,
        username: f.username,
        full_name: f.full_name || null,
        profile_pic_url: f.profile_pic_url || null,
        is_verified: f.is_verified || false,
        follower_count: f.follower_count || null,
        event_type: "gained",
        detected_at: ts,
        gender_tag: detectGender(f.full_name, f.username),
        category: categorizeFollow(f.follower_count, f.is_private),
        is_initial: true, // baseline data
      });
    }

    return currentFollowers.length;
  }

  // ── DELTA-GATE: only process if follower count actually increased ──
  if (maxAllowed <= 0) {
    console.log(`[DELTA-GATE][smart-scan] followers: maxAllowed=${maxAllowed}, skipping entirely`);
    return 0;
  }

  const { data: existing } = await supabaseClient
    .from("profile_followers")
    .select("follower_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("is_current", true);

  const existingIds = new Set((existing || []).map((f: Record<string, unknown>) => f.follower_user_id as string));
  const newEntries = currentFollowers.filter((f) => !existingIds.has(f.pk));

  if (newEntries.length === 0) return 0;

  const toProcess = newEntries.slice(0, maxAllowed);

  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);
  const randomTs = toProcess.map(() => new Date(lastTs + Math.random() * spanMs)).sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < toProcess.length; i++) {
    const f = toProcess[i];
    const ts = randomTs[i].toISOString();

    await supabaseClient.from("profile_followers").insert({
      tracked_profile_id: profileId,
      follower_user_id: f.pk,
      follower_username: f.username,
      follower_avatar_url: f.profile_pic_url || null,
      follower_display_name: f.full_name || null,
      follower_follower_count: f.follower_count || null,
      follower_is_verified: f.is_verified || false,
      follower_is_private: f.is_private || false,
      first_seen_at: ts,
    });

    await supabaseClient.from("follower_events").insert({
      profile_id: profileId,
      instagram_user_id: f.pk,
      username: f.username,
      full_name: f.full_name || null,
      profile_pic_url: f.profile_pic_url || null,
      is_verified: f.is_verified || false,
      follower_count: f.follower_count || null,
      event_type: "gained",
      detected_at: ts,
      gender_tag: detectGender(f.full_name, f.username),
      category: categorizeFollow(f.follower_count, f.is_private),
      is_initial: false, // real event
    });
  }

  if (newEntries.length > maxAllowed) {
    console.log(`[DELTA-GATE][smart-scan] followers: ${newEntries.length} new found, processed ${toProcess.length} real events, ignored ${newEntries.length - toProcess.length}`);
  }

  return toProcess.length;
}

// ── FOLLOWING FULL-SCAN ──
async function performFollowingFullScan(
  supabaseClient: ReturnType<typeof createClient>,
  profileId: string,
  igUserId: string,
  hikerApiKey: string,
) {
  const allFollowings = await fetchAllPages("following", igUserId, hikerApiKey);
  const currentApiIds = new Set(allFollowings.map((u) => u.pk));

  const { data: dbFollowings } = await supabaseClient
    .from("profile_followings")
    .select("following_user_id, following_username, following_avatar_url, following_display_name")
    .eq("tracked_profile_id", profileId)
    .eq("direction", "following")
    .eq("is_current", true);

  const unfollowed = (dbFollowings || []).filter((f: Record<string, unknown>) => !currentApiIds.has(f.following_user_id as string));
  const now = new Date().toISOString();

  for (const lost of unfollowed) {
    await supabaseClient
      .from("profile_followings")
      .update({ is_current: false })
      .eq("tracked_profile_id", profileId)
      .eq("following_user_id", (lost as Record<string, unknown>).following_user_id);

    await supabaseClient.from("follow_events").insert({
      tracked_profile_id: profileId,
      event_type: "unfollow",
      target_username: (lost as Record<string, unknown>).following_username as string,
      target_avatar_url: (lost as Record<string, unknown>).following_avatar_url || null,
      target_display_name: (lost as Record<string, unknown>).following_display_name || null,
      detected_at: now,
      direction: "following",
      notification_sent: false,
    });
  }

  console.log(`[FULL-SCAN] ${profileId}: ${unfollowed.length} unfollows confirmed`);
  return unfollowed.length;
}

// ── FOLLOWER FULL-SCAN ──
async function performFollowerFullScan(
  supabaseClient: ReturnType<typeof createClient>,
  profileId: string,
  igUserId: string,
  hikerApiKey: string,
) {
  const allFollowers = await fetchAllPages("followers", igUserId, hikerApiKey);
  const currentApiIds = new Set(allFollowers.map((u) => u.pk));

  const { data: dbFollowers } = await supabaseClient
    .from("profile_followers")
    .select("follower_user_id, follower_username")
    .eq("tracked_profile_id", profileId)
    .eq("is_current", true);

  const lostFollowers = (dbFollowers || []).filter((f: Record<string, unknown>) => !currentApiIds.has(f.follower_user_id as string));
  const now = new Date().toISOString();

  for (const lost of lostFollowers) {
    await supabaseClient
      .from("profile_followers")
      .update({ is_current: false })
      .eq("tracked_profile_id", profileId)
      .eq("follower_user_id", (lost as Record<string, unknown>).follower_user_id);

    await supabaseClient.from("follower_events").insert({
      profile_id: profileId,
      instagram_user_id: (lost as Record<string, unknown>).follower_user_id as string,
      username: (lost as Record<string, unknown>).follower_username as string,
      event_type: "lost",
      detected_at: now,
    });
  }

  console.log(`[FOLLOWER-SCAN] ${profileId}: ${lostFollowers.length} followers lost confirmed`);
  return lostFollowers.length;
}

// ═══════════════════════════════════════════════════════
// SPY SCAN: Full program (Following + Follower + Unfollow Detection)
// Only for profiles with has_spy = true
// ═══════════════════════════════════════════════════════
async function performSpyScan(
  supabaseClient: ReturnType<typeof createClient>,
  profile: Record<string, unknown>,
  hikerApiKey: string,
) {
  const profileId = profile.id as string;
  const username = profile.username as string;

  // Get user info (for actual counts + avatar)
  const userInfoRes = await fetch(
    `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`,
    { headers: { "x-access-key": hikerApiKey } },
  );
  if (!userInfoRes.ok) throw new Error(`User info: ${userInfoRes.status}`);
  const userInfo = await userInfoRes.json();
  const igUserId = String(userInfo.pk || userInfo.id);
  const actualFollowingCount = userInfo.following_count ?? 0;
  const actualFollowerCount = userInfo.follower_count ?? 0;

  // ── Private account check ──
  if (userInfo.is_private === true) {
    await supabaseClient.from("tracked_profiles").update({
      is_private: true,
      avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
      display_name: userInfo.full_name || null,
      follower_count: actualFollowerCount,
      following_count: actualFollowingCount,
      last_scanned_at: new Date().toISOString(),
    }).eq("id", profileId);
    console.log(`[SPY-SCAN] ${username}: private, tracking frozen`);
    return { new_follows: 0, new_followers: 0, unfollows_detected: 0, frozen: true };
  }
  if (profile.is_private) {
    await supabaseClient.from("tracked_profiles").update({ is_private: false }).eq("id", profileId);
    console.log(`[SPY-SCAN] ${username}: back to public!`);
  }

  // ── DELTA-GATE: compute max allowed new events based on actual count changes ──
  const lastFollowingCount = profile.last_following_count as number | null;
  const lastFollowerCount = profile.last_follower_count as number | null;
  
  const maxNewFollows = lastFollowingCount !== null && lastFollowingCount !== undefined
    ? Math.max(actualFollowingCount - lastFollowingCount, 0)
    : 200; // first scan: allow all from page 1
  const maxNewFollowers = lastFollowerCount !== null && lastFollowerCount !== undefined
    ? Math.max(actualFollowerCount - lastFollowerCount, 0)
    : 200; // first scan: allow all from page 1

  console.log(`[DELTA-GATE] ${username}: following ${lastFollowingCount}→${actualFollowingCount} (max ${maxNewFollows}), followers ${lastFollowerCount}→${actualFollowerCount} (max ${maxNewFollowers})`);

  // ── CALL 1: Following page 1 ──
  await sleep(500);
  const followingUsers = await fetchPage1("following", igUserId, hikerApiKey);
  const newFollowCount = await syncNewFollows(supabaseClient, profileId, followingUsers, profile.last_scanned_at as string | null, maxNewFollows);

  // ── SMART UNFOLLOW DETECTION (sammelt Hints, KEIN Full-Scan!) ──
  let unfollowsDetected = 0;
  if (profile.baseline_complete && lastFollowingCount !== null && lastFollowingCount !== undefined) {
    const expectedCount = lastFollowingCount + newFollowCount;
    const missingCount = expectedCount - actualFollowingCount;
    if (missingCount > 0) {
      console.log(`[SPY HINT] ${username}: +${missingCount} unfollows detected (hint, no full-scan)`);
      unfollowsDetected = missingCount;
      const currentHint = (profile.pending_unfollow_hint as number) || 0;
      await supabaseClient.from("tracked_profiles").update({
        pending_unfollow_hint: currentHint + missingCount,
      }).eq("id", profileId);
    }
  }

  // ── CALL 2: Follower page 1 ──
  await sleep(1000);
  const followerUsers = await fetchPage1("followers", igUserId, hikerApiKey);
  const newFollowerCount = await syncNewFollowers(supabaseClient, profileId, followerUsers, profile.last_scanned_at as string | null, maxNewFollowers);

  // ── SMART FOLLOWER LOSS DETECTION (Hint only, no full-scan) ──
  if (lastFollowerCount !== null && lastFollowerCount !== undefined) {
    const expectedFollowerCount = lastFollowerCount + newFollowerCount;
    const lostCount = expectedFollowerCount - actualFollowerCount;
    if (lostCount > 0) {
      console.log(`[SPY FOLLOWER-HINT] ${username}: ~${lostCount} followers lost (hint only)`);
    }
  }

  // ── Update profile ──
  await supabaseClient.from("tracked_profiles").update({
    previous_follower_count: profile.follower_count || 0,
    previous_following_count: profile.following_count || 0,
    last_following_count: actualFollowingCount,
    last_follower_count: actualFollowerCount,
    avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
    display_name: userInfo.full_name || null,
    follower_count: actualFollowerCount,
    following_count: actualFollowingCount,
    last_scanned_at: new Date().toISOString(),
    initial_scan_done: true,
  }).eq("id", profileId);

  console.log(`[SPY-SCAN] ${username}: ${newFollowCount} new follows, ${newFollowerCount} new followers, ${unfollowsDetected} unfollows`);
  return { new_follows: newFollowCount, new_followers: newFollowerCount, unfollows_detected: unfollowsDetected };
}

// ═══════════════════════════════════════════════════════
// BASIC SCAN: Only Following page 1 (for non-spy profiles)
// 1 API call, no unfollow detection
// ═══════════════════════════════════════════════════════
async function performBasicScan(
  supabaseClient: ReturnType<typeof createClient>,
  profile: Record<string, unknown>,
  hikerApiKey: string,
) {
  const profileId = profile.id as string;
  const username = profile.username as string;

  const userInfoRes = await fetch(
    `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`,
    { headers: { "x-access-key": hikerApiKey } },
  );
  if (!userInfoRes.ok) throw new Error(`User info: ${userInfoRes.status}`);
  const userInfo = await userInfoRes.json();
  const igUserId = String(userInfo.pk || userInfo.id);
  const actualFollowingCount = userInfo.following_count ?? 0;
  const actualFollowerCount = userInfo.follower_count ?? 0;

  // ── Private account check ──
  if (userInfo.is_private === true) {
    await supabaseClient.from("tracked_profiles").update({
      is_private: true,
      avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
      display_name: userInfo.full_name || null,
      follower_count: actualFollowerCount,
      following_count: actualFollowingCount,
      last_scanned_at: new Date().toISOString(),
    }).eq("id", profileId);
    console.log(`[BASIC-SCAN] ${username}: private, tracking frozen`);
    return { new_follows: 0, new_followers: 0, unfollows_detected: 0, frozen: true };
  }
  if (profile.is_private) {
    await supabaseClient.from("tracked_profiles").update({ is_private: false }).eq("id", profileId);
    console.log(`[BASIC-SCAN] ${username}: back to public!`);
  }

  // ── DELTA-GATE for basic scan ──
  const lastFollowingCount = profile.last_following_count as number | null;
  const maxNewFollows = lastFollowingCount !== null && lastFollowingCount !== undefined
    ? Math.max(actualFollowingCount - lastFollowingCount, 0)
    : 200;

  await sleep(500);
  const followingUsers = await fetchPage1("following", igUserId, hikerApiKey);
  const newFollowCount = await syncNewFollows(supabaseClient, profileId, followingUsers, profile.last_scanned_at as string | null, maxNewFollows);

  await supabaseClient.from("tracked_profiles").update({
    previous_follower_count: profile.follower_count || 0,
    previous_following_count: profile.following_count || 0,
    last_following_count: actualFollowingCount,
    last_follower_count: actualFollowerCount,
    avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
    display_name: userInfo.full_name || null,
    follower_count: actualFollowerCount,
    following_count: actualFollowingCount,
    last_scanned_at: new Date().toISOString(),
    initial_scan_done: true,
  }).eq("id", profileId);

  console.log(`[BASIC-SCAN] ${username}: ${newFollowCount} new follows`);
  return { new_follows: newFollowCount, new_followers: 0, unfollows_detected: 0 };
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ⚠️ Auth: Verify cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || cronSecret !== expectedSecret) {
    console.error("[smart-scan] Unauthorized: Invalid or missing cron secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Load ALL active profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("tracked_profiles")
      .select("*")
      .eq("is_active", true)
      .limit(50);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No active profiles", scanned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get subscription status for each user
    const userIds = [...new Set(profiles.map((p: Record<string, unknown>) => p.user_id))];
    const { data: subs } = await supabaseClient.from("subscriptions").select("user_id, plan_type, status").in("user_id", userIds);
    const subMap = new Map((subs || []).map((s: Record<string, unknown>) => [s.user_id, s]));

    const results: Array<{ username: string; scan_type: string; new_follows: number; new_followers: number; unfollows_detected: number; skipped?: boolean; error?: string }> = [];

    for (const profile of profiles) {
      try {
        const sub = subMap.get(profile.user_id) as Record<string, unknown> | undefined;
        const isPro = sub?.plan_type === "pro" && ["active", "in_trial"].includes(sub?.status as string || "");
        const hasSpy = profile.has_spy === true && isPro;

        if (hasSpy) {
          // ═══ SPY PROFILE: Scan every hour ═══
          const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at as string) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (lastScan && lastScan > oneHourAgo) {
            results.push({ username: profile.username as string, scan_type: "spy", new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped: true });
            continue;
          }

          const res = await performSpyScan(supabaseClient, profile, hikerApiKey);
          results.push({ username: profile.username as string, scan_type: "spy", ...res });

        } else {
          // ═══ NON-SPY: Basic scan 1x/day ═══
          const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at as string) : null;
          if (lastScan) {
            const today = new Date().toISOString().split("T")[0];
            const lastScanDate = lastScan.toISOString().split("T")[0];
            if (lastScanDate === today) {
              results.push({ username: profile.username as string, scan_type: "basic", new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped: true });
              continue;
            }
          }

          const res = await performBasicScan(supabaseClient, profile, hikerApiKey);
          results.push({ username: profile.username as string, scan_type: "basic", ...res });
        }

        // ── Baseline Recovery: If initial scan done but baseline incomplete, trigger it server-side ──
        if (profile.initial_scan_done === true && profile.baseline_complete === false && !profile.is_private) {
          console.log(`[BASELINE-RECOVERY] ${profile.username}: baseline_complete=false, triggering create-baseline...`);
          fetch(`${supabaseUrl}/functions/v1/create-baseline`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ profileId: profile.id }),
          }).then(async (res) => {
            if (res.ok) {
              console.log(`[BASELINE-RECOVERY] ${profile.username}: create-baseline triggered successfully`);
            } else {
              const text = await res.text();
              console.error(`[BASELINE-RECOVERY] ${profile.username}: create-baseline failed: ${res.status} ${text}`);
            }
          }).catch((err) => {
            console.error(`[BASELINE-RECOVERY] ${profile.username}: fetch error:`, err);
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[smart-scan] Error for ${profile.username}:`, msg);
        results.push({ username: profile.username as string, scan_type: "unknown", new_follows: 0, new_followers: 0, unfollows_detected: 0, error: msg });
        if (msg.includes("402")) break;
      }

      await sleep(1000);
    }

    return new Response(JSON.stringify({ scanned: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[smart-scan] Fatal error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
