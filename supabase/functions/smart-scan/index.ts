// smart-scan v6 — re-added avatar refresh for existing rows
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";
import { acquireScanLock, releaseScanLock, checkDailyBudget, trackedApiFetch } from "../_shared/apiGuard.ts";

const FUNCTION_NAME = "smart-scan";

// ── Batch-refresh avatar URLs for existing followings/followers ──
async function refreshFollowingAvatars(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  users: FollowingUser[],
) {
  let updated = 0;
  for (const u of users) {
    if (!u.profile_pic_url) continue;
    const { data } = await supabase
      .from("profile_followings")
      .select("following_avatar_url")
      .eq("tracked_profile_id", profileId)
      .eq("following_user_id", u.pk)
      .eq("direction", "following")
      .maybeSingle();
    if (data && data.following_avatar_url !== u.profile_pic_url) {
      await supabase.from("profile_followings").update({
        following_avatar_url: u.profile_pic_url,
      }).eq("tracked_profile_id", profileId).eq("following_user_id", u.pk).eq("direction", "following");
      updated++;
    }

    await supabase
      .from("follow_events")
      .update({ target_avatar_url: u.profile_pic_url })
      .eq("tracked_profile_id", profileId)
      .eq("direction", "following")
      .eq("target_username", u.username)
      .neq("target_avatar_url", u.profile_pic_url);
  }
  if (updated > 0) console.log(`[AVATAR-REFRESH] followings+events: updated ${updated} avatars for ${profileId}`);
}

async function refreshFollowerAvatars(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  users: FollowingUser[],
) {
  let updated = 0;
  for (const u of users) {
    if (!u.profile_pic_url) continue;
    const { data } = await supabase
      .from("profile_followers")
      .select("follower_avatar_url")
      .eq("tracked_profile_id", profileId)
      .eq("follower_user_id", u.pk)
      .maybeSingle();
    if (data && data.follower_avatar_url !== u.profile_pic_url) {
      await supabase.from("profile_followers").update({
        follower_avatar_url: u.profile_pic_url,
      }).eq("tracked_profile_id", profileId).eq("follower_user_id", u.pk);
      updated++;
    }

    await supabase
      .from("follower_events")
      .update({ profile_pic_url: u.profile_pic_url })
      .eq("profile_id", profileId)
      .eq("username", u.username)
      .neq("profile_pic_url", u.profile_pic_url);
  }
  if (updated > 0) console.log(`[AVATAR-REFRESH] followers+events: updated ${updated} avatars for ${profileId}`);
}

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

// ── Fetch page 1 only (count=200 explicit) — uses trackedApiFetch ──
async function fetchPage1(
  supabase: ReturnType<typeof createClient>,
  endpoint: string, userId: string, hikerApiKey: string, profileId: string,
): Promise<FollowingUser[] | null> {
  const url = `https://api.hikerapi.com/gql/user/${endpoint}/chunk?user_id=${userId}&count=200`;
  const result = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, url, { "x-access-key": hikerApiKey });
  if (result.skipped || result.error || !result.response) return null;
  if (result.response.status === 404) { await result.response.text(); return []; }
  if (!result.response.ok) { await result.response.text(); return null; }
  const parsed = parseChunkResponse(await result.response.json());
  const users: FollowingUser[] = [];
  for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) users.push(u); }
  return users;
}

// ── Fetch pages with maxPages limit — uses trackedApiFetch ──
async function fetchPages(
  supabase: ReturnType<typeof createClient>,
  endpoint: string, userId: string, hikerApiKey: string, profileId: string,
  maxPages: number,
): Promise<FollowingUser[] | null> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;

  do {
    const url = nextMaxId
      ? `https://api.hikerapi.com/gql/user/${endpoint}/chunk?user_id=${userId}&count=200&max_id=${nextMaxId}`
      : `https://api.hikerapi.com/gql/user/${endpoint}/chunk?user_id=${userId}&count=200`;
    const result = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, url, { "x-access-key": hikerApiKey });
    if (result.skipped || result.error || !result.response) return null;
    if (result.response.status === 404) { await result.response.text(); break; }
    if (!result.response.ok) { await result.response.text(); return null; }
    const parsed = parseChunkResponse(await result.response.json());
    for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) allUsers.push(u); }
    nextMaxId = parsed.nextMaxId;
    page++;
    if (nextMaxId) await sleep(500);
  } while (nextMaxId && page < maxPages);

  return allUsers;
}

// ── Sync new follows (page 1 diff) with DELTA-GATE ──
async function syncNewFollows(
  supabaseClient: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  lastScannedAt: string | null,
  maxAllowed: number,
) {
  const { data: existing } = await supabaseClient
    .from("profile_followings")
    .select("following_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("direction", "following")
    .eq("is_current", true)
    .limit(10000);

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
    const isBackfill = i >= maxAllowed;

    await supabaseClient.from("profile_followings").upsert({
      tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk,
      following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null,
      first_seen_at: ts, direction: "following",
      gender_tag: genderTag, category: category,
    }, { onConflict: "tracked_profile_id,following_user_id,direction", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[smart-scan] upsert profile_followings error:`, error.message);
    });

    if (!isBackfill) {
      await supabaseClient.from("follow_events").upsert({
        tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
        target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
        detected_at: ts, direction: "following", notification_sent: false,
        gender_tag: genderTag,
        category: categorizeFollow(f.follower_count, f.is_private),
        target_follower_count: f.follower_count || null,
        target_is_private: f.is_private || false,
        is_initial: false,
      }, { onConflict: "tracked_profile_id,target_username,event_type,direction,is_initial", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[smart-scan] upsert follow_events error:`, error.message);
      });
      await supabaseClient.rpc("increment_gender_count", { p_profile_id: profileId, p_gender: genderTag });
      realEventCount++;
    } else {
      await supabaseClient.from("follow_events").upsert({
        tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
        target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
        detected_at: ts, direction: "following", notification_sent: false,
        gender_tag: genderTag,
        category: categorizeFollow(f.follower_count, f.is_private),
        target_follower_count: f.follower_count || null,
        target_is_private: f.is_private || false,
        is_initial: true,
      }, { onConflict: "tracked_profile_id,target_username,event_type,direction,is_initial", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[smart-scan] upsert follow_events (backfill) error:`, error.message);
      });
      await supabaseClient.rpc("increment_gender_count", { p_profile_id: profileId, p_gender: genderTag });
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
  maxAllowed: number,
) {
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

      await supabaseClient.from("profile_followers").upsert({
        tracked_profile_id: profileId,
        follower_user_id: f.pk, follower_username: f.username,
        follower_avatar_url: f.profile_pic_url || null, follower_display_name: f.full_name || null,
        follower_follower_count: f.follower_count || null,
        follower_is_verified: f.is_verified || false, follower_is_private: f.is_private || false,
        first_seen_at: ts,
      }, { onConflict: "tracked_profile_id,follower_user_id", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[smart-scan] upsert profile_followers error:`, error.message);
      });

      await supabaseClient.from("follower_events").upsert({
        profile_id: profileId, instagram_user_id: f.pk, username: f.username,
        full_name: f.full_name || null, profile_pic_url: f.profile_pic_url || null,
        is_verified: f.is_verified || false, follower_count: f.follower_count || null,
        event_type: "gained", detected_at: ts,
        gender_tag: detectGender(f.full_name, f.username),
        category: categorizeFollow(f.follower_count, f.is_private),
        is_initial: true,
      }, { onConflict: "profile_id,username,event_type,is_initial", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[smart-scan] upsert follower_events (baseline) error:`, error.message);
      });
    }
    return currentFollowers.length;
  }

  if (maxAllowed <= 0) {
    console.log(`[DELTA-GATE][smart-scan] followers: maxAllowed=${maxAllowed}, skipping entirely`);
    return 0;
  }

  const { data: existing } = await supabaseClient
    .from("profile_followers")
    .select("follower_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("is_current", true)
    .limit(10000);

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

    await supabaseClient.from("profile_followers").upsert({
      tracked_profile_id: profileId,
      follower_user_id: f.pk, follower_username: f.username,
      follower_avatar_url: f.profile_pic_url || null, follower_display_name: f.full_name || null,
      follower_follower_count: f.follower_count || null,
      follower_is_verified: f.is_verified || false, follower_is_private: f.is_private || false,
      first_seen_at: ts,
    }, { onConflict: "tracked_profile_id,follower_user_id", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[smart-scan] upsert profile_followers error:`, error.message);
    });

    await supabaseClient.from("follower_events").upsert({
      profile_id: profileId, instagram_user_id: f.pk, username: f.username,
      full_name: f.full_name || null, profile_pic_url: f.profile_pic_url || null,
      is_verified: f.is_verified || false, follower_count: f.follower_count || null,
      event_type: "gained", detected_at: ts,
      gender_tag: detectGender(f.full_name, f.username),
      category: categorizeFollow(f.follower_count, f.is_private),
      is_initial: false,
    }, { onConflict: "profile_id,username,event_type,is_initial", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[smart-scan] upsert follower_events error:`, error.message);
    });
  }

  if (newEntries.length > maxAllowed) {
    console.log(`[DELTA-GATE][smart-scan] followers: ${newEntries.length} new found, processed ${toProcess.length} real events, ignored ${newEntries.length - toProcess.length}`);
  }
  return toProcess.length;
}

// ═══════════════════════════════════════════════════════
// SPY SCAN
// ═══════════════════════════════════════════════════════
async function performSpyScan(
  supabaseClient: ReturnType<typeof createClient>,
  profile: Record<string, unknown>,
  hikerApiKey: string,
) {
  const profileId = profile.id as string;
  const username = profile.username as string;

  // ★ FIX 1.1: Declare lastFollowingCount and lastFollowerCount
  const lastFollowingCount = profile.last_following_count as number | null;
  const lastFollowerCount = profile.last_follower_count as number | null;

  let igUserId = profile.instagram_user_id as string | null;
  if (!igUserId) {
    console.log(`[SPY-SCAN] ${username}: no instagram_user_id, fetching once...`);
    const result = await trackedApiFetch(
      supabaseClient, FUNCTION_NAME, profileId,
      `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`,
      { "x-access-key": hikerApiKey },
    );
    if (result.skipped || result.error || !result.response) return { new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped_api: true };
    if (!result.response.ok) return { new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped_api: true };
    const userInfo = await result.response.json();
    igUserId = String(userInfo.pk || userInfo.id);
    await supabaseClient.from("tracked_profiles").update({
      instagram_user_id: igUserId,
      avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
      display_name: userInfo.full_name || null,
      follower_count: userInfo.follower_count ?? 0,
      following_count: userInfo.following_count ?? 0,
    }).eq("id", profileId);
  }

  // ★ Bug 3 Fix: Fetch fresh counts from API instead of stale DB values
  let actualFollowingCount = (profile.following_count as number) ?? 0;
  let actualFollowerCount = (profile.follower_count as number) ?? 0;

  const infoUrl = `https://api.hikerapi.com/gql/user/info/by/id?id=${igUserId}`;
  const infoResult = await trackedApiFetch(supabaseClient, FUNCTION_NAME, profileId, infoUrl, { "x-access-key": hikerApiKey });
  if (infoResult.response?.ok) {
    try {
      const info = await infoResult.response.json();
      const freshFollowing = info?.following_count ?? info?.response?.following_count;
      const freshFollower = info?.follower_count ?? info?.response?.follower_count;
      if (typeof freshFollowing === "number") {
        console.log(`[SPY-SCAN] ${username}: fresh following_count=${freshFollowing} (DB had ${actualFollowingCount})`);
        actualFollowingCount = freshFollowing;
      }
      if (typeof freshFollower === "number") {
        console.log(`[SPY-SCAN] ${username}: fresh follower_count=${freshFollower} (DB had ${actualFollowerCount})`);
        actualFollowerCount = freshFollower;
      }
      // Update DB with fresh counts + avatar
      const freshAvatar = info?.profile_pic_url || info?.response?.profile_pic_url ||
        info?.hd_profile_pic_url_info?.url || info?.response?.hd_profile_pic_url_info?.url || null;
      const updatePayload: Record<string, unknown> = {
        following_count: actualFollowingCount,
        follower_count: actualFollowerCount,
      };
      if (freshAvatar) updatePayload.avatar_url = freshAvatar;
      await supabaseClient.from("tracked_profiles").update(updatePayload).eq("id", profileId);
    } catch (e) {
      console.warn(`[SPY-SCAN] ${username}: Failed to parse info response:`, e);
    }
  } else if (infoResult.response) {
    await infoResult.response.text(); // drain body
  }

  const maxNewFollows = 200;
  const maxNewFollowers = 200;

  console.log(`[SPY-SCAN] ${username}: following=${actualFollowingCount}, followers=${actualFollowerCount}, maxNew=200`);

  // ── CALL 1: Following page 1 ──
  const followingUsers = await fetchPage1(supabaseClient, "following", igUserId, hikerApiKey, profileId);
  if (followingUsers === null) return { new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped_api: true };

  // ── Private detection ──
  if (followingUsers.length === 0 && actualFollowingCount > 0) {
    await supabaseClient.from("tracked_profiles").update({ is_private: true, last_scanned_at: new Date().toISOString() }).eq("id", profileId);
    console.log(`[SPY-SCAN] ${username}: likely private, tracking frozen`);
    return { new_follows: 0, new_followers: 0, unfollows_detected: 0, frozen: true };
  }
  if (profile.is_private) {
    await supabaseClient.from("tracked_profiles").update({ is_private: false }).eq("id", profileId);
  }

  const newFollowCount = await syncNewFollows(supabaseClient, profileId, followingUsers, profile.last_scanned_at as string | null, maxNewFollows);

  // ── SMART UNFOLLOW DETECTION (guarded by baseline coverage) ──
  let unfollowsDetected = 0;
  if (profile.baseline_complete && lastFollowingCount !== null && lastFollowingCount !== undefined) {
    // Check baseline coverage before incrementing hint
    const { count: dbCurrentCount } = await supabaseClient
      .from("profile_followings")
      .select("*", { count: "exact", head: true })
      .eq("tracked_profile_id", profileId)
      .eq("direction", "following")
      .eq("is_current", true);

    const baselineCoverage = lastFollowingCount > 0 ? (dbCurrentCount ?? 0) / lastFollowingCount : 1;

    if (baselineCoverage < 0.85) {
      console.log(`[SPY HINT] ${username}: baseline coverage too low (${((dbCurrentCount ?? 0))}/${lastFollowingCount} = ${(baselineCoverage * 100).toFixed(1)}%), suppressing hint`);
    } else {
      const expectedCount = lastFollowingCount + newFollowCount;
      const missingCount = expectedCount - actualFollowingCount;
      if (missingCount > 0) {
        console.log(`[SPY HINT] ${username}: +${missingCount} unfollows detected (hint, coverage=${(baselineCoverage * 100).toFixed(1)}%)`);
        unfollowsDetected = missingCount;
        const currentHint = (profile.pending_unfollow_hint as number) || 0;
        await supabaseClient.from("tracked_profiles").update({ pending_unfollow_hint: currentHint + missingCount }).eq("id", profileId);
      }
    }
  }

  // ── CALL 2: Followers — max 5 pages for baseline, page 1 for delta ──
  await sleep(500);
  const { count: followerBaselineCount } = await supabaseClient
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("tracked_profile_id", profileId);
  const needsFollowerBaseline = followerBaselineCount === 0;
  // ★ FIX 1.8: Cap follower baseline in cron to 5 pages (max ~1000 followers)
  const followerUsers = needsFollowerBaseline
    ? await fetchPages(supabaseClient, "followers", igUserId, hikerApiKey, profileId, 5)
    : await fetchPage1(supabaseClient, "followers", igUserId, hikerApiKey, profileId);
  if (followerUsers === null) {
    // API issue on followers, still save following results
    console.warn(`[SPY-SCAN] ${username}: follower fetch failed, saving following results only`);
    await supabaseClient.from("tracked_profiles").update({
      previous_follower_count: profile.follower_count || 0,
      previous_following_count: profile.following_count || 0,
      last_following_count: actualFollowingCount,
      last_follower_count: actualFollowerCount,
      last_scanned_at: new Date().toISOString(),
      initial_scan_done: true,
    }).eq("id", profileId);
    return { new_follows: newFollowCount, new_followers: 0, unfollows_detected: unfollowsDetected };
  }
  console.log(`[SPY-SCAN] ${username}: fetched ${followerUsers.length} followers (baseline=${needsFollowerBaseline})`);
  const newFollowerCount = await syncNewFollowers(supabaseClient, profileId, followerUsers, profile.last_scanned_at as string | null, maxNewFollowers);

  // ── SMART FOLLOWER LOSS DETECTION ──
  if (lastFollowerCount !== null && lastFollowerCount !== undefined) {
    const expectedFollowerCount = lastFollowerCount + newFollowerCount;
    const lostCount = expectedFollowerCount - actualFollowerCount;
    if (lostCount > 0) {
      console.log(`[SPY FOLLOWER-HINT] ${username}: ~${lostCount} followers lost (hint only)`);
    }
  }

  // ★ Avatar refresh for existing rows
  await refreshFollowingAvatars(supabaseClient, profileId, followingUsers);
  await refreshFollowerAvatars(supabaseClient, profileId, followerUsers);

  // ── Update profile ──
  await supabaseClient.from("tracked_profiles").update({
    previous_follower_count: profile.follower_count || 0,
    previous_following_count: profile.following_count || 0,
    last_following_count: actualFollowingCount,
    last_follower_count: actualFollowerCount,
    last_scanned_at: new Date().toISOString(),
    initial_scan_done: true,
  }).eq("id", profileId);

  console.log(`[SPY-SCAN] ${username}: ${newFollowCount} new follows, ${newFollowerCount} new followers, ${unfollowsDetected} unfollows`);
  return { new_follows: newFollowCount, new_followers: newFollowerCount, unfollows_detected: unfollowsDetected };
}

// ═══════════════════════════════════════════════════════
// BASIC SCAN: Only Following page 1 (for non-spy profiles)
// ═══════════════════════════════════════════════════════
async function performBasicScan(
  supabaseClient: ReturnType<typeof createClient>,
  profile: Record<string, unknown>,
  hikerApiKey: string,
) {
  const profileId = profile.id as string;
  const username = profile.username as string;

  let igUserId = profile.instagram_user_id as string | null;
  if (!igUserId) {
    console.log(`[BASIC-SCAN] ${username}: no instagram_user_id, fetching once...`);
    const result = await trackedApiFetch(
      supabaseClient, FUNCTION_NAME, profileId,
      `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`,
      { "x-access-key": hikerApiKey },
    );
    if (result.skipped || result.error || !result.response || !result.response.ok) return { new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped_api: true };
    const userInfo = await result.response.json();
    igUserId = String(userInfo.pk || userInfo.id);
    await supabaseClient.from("tracked_profiles").update({
      instagram_user_id: igUserId,
      avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
      display_name: userInfo.full_name || null,
      follower_count: userInfo.follower_count ?? 0,
      following_count: userInfo.following_count ?? 0,
    }).eq("id", profileId);
  }

  // Refresh avatar + counts from user info API
  let actualFollowingCount = (profile.following_count as number) ?? 0;
  let actualFollowerCount = (profile.follower_count as number) ?? 0;

  const infoUrl = `https://api.hikerapi.com/gql/user/info/by/id?id=${igUserId}`;
  const infoResult = await trackedApiFetch(supabaseClient, FUNCTION_NAME, profileId, infoUrl, { "x-access-key": hikerApiKey });
  if (infoResult.response?.ok) {
    try {
      const info = await infoResult.response.json();
      const freshFollowing = info?.following_count ?? info?.response?.following_count;
      const freshFollower = info?.follower_count ?? info?.response?.follower_count;
      if (typeof freshFollowing === "number") actualFollowingCount = freshFollowing;
      if (typeof freshFollower === "number") actualFollowerCount = freshFollower;
      const freshAvatar = info?.profile_pic_url || info?.response?.profile_pic_url ||
        info?.hd_profile_pic_url_info?.url || info?.response?.hd_profile_pic_url_info?.url || null;
      const updatePayload: Record<string, unknown> = {
        following_count: actualFollowingCount,
        follower_count: actualFollowerCount,
      };
      if (freshAvatar) updatePayload.avatar_url = freshAvatar;
      await supabaseClient.from("tracked_profiles").update(updatePayload).eq("id", profileId);
    } catch (e) {
      console.warn(`[BASIC-SCAN] Failed to parse info:`, e);
    }
  } else if (infoResult.response) {
    await infoResult.response.text();
  }

  const maxNewFollows = 200;
  const followingUsers = await fetchPage1(supabaseClient, "following", igUserId, hikerApiKey, profileId);
  if (followingUsers === null) return { new_follows: 0, new_followers: 0, unfollows_detected: 0, skipped_api: true };

  // ── Private detection ──
  if (followingUsers.length === 0 && actualFollowingCount > 0) {
    await supabaseClient.from("tracked_profiles").update({ is_private: true, last_scanned_at: new Date().toISOString() }).eq("id", profileId);
    console.log(`[BASIC-SCAN] ${username}: likely private, tracking frozen`);
    return { new_follows: 0, new_followers: 0, unfollows_detected: 0, frozen: true };
  }
  if (profile.is_private) {
    await supabaseClient.from("tracked_profiles").update({ is_private: false }).eq("id", profileId);
  }

  const newFollowCount = await syncNewFollows(supabaseClient, profileId, followingUsers, profile.last_scanned_at as string | null, maxNewFollows);

  // ★ Avatar refresh for existing followings
  await refreshFollowingAvatars(supabaseClient, profileId, followingUsers);

  await supabaseClient.from("tracked_profiles").update({
    previous_follower_count: profile.follower_count || 0,
    previous_following_count: profile.following_count || 0,
    last_following_count: actualFollowingCount,
    last_follower_count: actualFollowerCount,
    last_scanned_at: new Date().toISOString(),
    initial_scan_done: true,
  }).eq("id", profileId);

  console.log(`[BASIC-SCAN] ${username}: ${newFollowCount} new follows`);
  return { new_follows: newFollowCount, new_followers: 0, unfollows_detected: 0 };
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || cronSecret !== expectedSecret) {
    console.error("[smart-scan] Unauthorized: Invalid or missing cron secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // ★ FIX 1.3: Check daily API budget once at start
    const budget = await checkDailyBudget(supabaseClient);
    if (!budget.allowed) {
      console.warn(`[smart-scan] Daily API budget exhausted (${budget.used}/${budget.limit}), skipping`);
      return new Response(JSON.stringify({ message: "Budget exhausted", used: budget.used, limit: budget.limit }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ★ FIX 1.7: Gesamtlaufzeit-Check
    const functionStartTime = Date.now();

    // ★ FIX 1.7: Order by last_scanned_at ASC NULLS FIRST for fairness
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("tracked_profiles")
      .select("*")
      .eq("is_active", true)
      .order("last_scanned_at", { ascending: true, nullsFirst: true })
      .limit(50);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No active profiles", scanned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userIds = [...new Set(profiles.map((p: Record<string, unknown>) => p.user_id))];
    const { data: subs } = await supabaseClient.from("subscriptions").select("user_id, plan_type, status").in("user_id", userIds);
    const subMap = new Map((subs || []).map((s: Record<string, unknown>) => [s.user_id, s]));

    const results: Array<Record<string, unknown>> = [];

    for (const profile of profiles) {
      // ★ FIX 1.7: Stop processing if runtime > 45s
      if (Date.now() - functionStartTime > 45_000) {
        console.warn(`[smart-scan] Runtime > 45s, stopping. Processed ${results.length}/${profiles.length}`);
        break;
      }

      const profileId = profile.id as string;

      // ★ FIX 1.2: Acquire scan lock
      const locked = await acquireScanLock(supabaseClient, profileId, FUNCTION_NAME);
      if (!locked) {
        console.log(`[smart-scan] ${profile.username}: locked by another scan, skipping`);
        results.push({ username: profile.username, scan_type: "skipped", skipped: true, reason: "locked" });
        continue;
      }

      try {
        const sub = subMap.get(profile.user_id) as Record<string, unknown> | undefined;
        const isPro = sub?.plan_type === "pro" && ["active", "in_trial"].includes(sub?.status as string || "");
        const hasSpy = profile.has_spy === true && isPro;

        if (hasSpy) {
          const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at as string) : null;
          const fiftyFiveMinAgo = new Date(Date.now() - 55 * 60 * 1000);
          if (lastScan && lastScan > fiftyFiveMinAgo) {
            results.push({ username: profile.username, scan_type: "spy", skipped: true });
            continue;
          }
          const res = await performSpyScan(supabaseClient, profile, hikerApiKey);
          results.push({ username: profile.username, scan_type: "spy", ...res });
        } else {
          const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at as string) : null;
          if (lastScan) {
            const today = new Date().toISOString().split("T")[0];
            const lastScanDate = lastScan.toISOString().split("T")[0];
            if (lastScanDate === today) {
              results.push({ username: profile.username, scan_type: "basic", skipped: true });
              continue;
            }
          }
          const res = await performBasicScan(supabaseClient, profile, hikerApiKey);
          results.push({ username: profile.username, scan_type: "basic", ...res });
        }

        // ★ FIX 1.4: Baseline Recovery using last_baseline_attempt_at
        if (profile.initial_scan_done === true && profile.baseline_complete === false && !profile.is_private) {
          const lastAttempt = profile.last_baseline_attempt_at ? new Date(profile.last_baseline_attempt_at as string).getTime() : 0;
          const hoursSinceAttempt = (Date.now() - lastAttempt) / (1000 * 60 * 60);

          if (hoursSinceAttempt >= 24) {
            // Set last_baseline_attempt_at FIRST to prevent loops
            await supabaseClient.from("tracked_profiles").update({
              last_baseline_attempt_at: new Date().toISOString(),
            }).eq("id", profileId);

            console.log(`[BASELINE-RECOVERY] ${profile.username}: triggering (last attempt ${hoursSinceAttempt.toFixed(1)}h ago)`);
            try {
              const baselineRes = await fetch(`${supabaseUrl}/functions/v1/create-baseline`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRoleKey}` },
                body: JSON.stringify({ profileId: profile.id }),
              });
              const baselineText = await baselineRes.text();
              if (baselineRes.ok) {
                console.log(`[BASELINE-RECOVERY] ${profile.username}: success — ${baselineText}`);
              } else {
                console.error(`[BASELINE-RECOVERY] ${profile.username}: failed ${baselineRes.status} — ${baselineText}`);
              }
            } catch (err) {
              console.error(`[BASELINE-RECOVERY] ${profile.username}: fetch error:`, err);
            }
          } else {
            console.log(`[BASELINE-RECOVERY] ${profile.username}: skipped (last attempt ${hoursSinceAttempt.toFixed(1)}h ago, need 24h)`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[smart-scan] Error for ${profile.username}:`, msg);
        results.push({ username: profile.username, scan_type: "unknown", error: msg });
        if (msg.includes("402")) break;
      } finally {
        // ★ FIX 1.2: ALWAYS release lock
        await releaseScanLock(supabaseClient, profileId);
      }

      await sleep(1000);
    }

    return new Response(JSON.stringify({ scanned: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[smart-scan] Fatal error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
