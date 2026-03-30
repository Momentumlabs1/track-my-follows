// trigger-scan v6 — re-added avatar refresh for existing rows
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";
import { acquireScanLock, releaseScanLock, checkDailyBudget, trackedApiFetch } from "../_shared/apiGuard.ts";

const FUNCTION_NAME = "trigger-scan";

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

      await supabase
        .from("follow_events")
        .update({ target_avatar_url: u.profile_pic_url })
        .eq("tracked_profile_id", profileId)
        .eq("direction", "following")
        .eq("target_username", u.username)
        .neq("target_avatar_url", u.profile_pic_url);

      updated++;
    }
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

      await supabase
        .from("follower_events")
        .update({ profile_pic_url: u.profile_pic_url })
        .eq("profile_id", profileId)
        .eq("username", u.username)
        .neq("profile_pic_url", u.profile_pic_url);

      updated++;
    }
  }
  if (updated > 0) console.log(`[AVATAR-REFRESH] followers+events: updated ${updated} avatars for ${profileId}`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// ★ Dead code fetchAllFollowerPages REMOVED

async function syncNewFollows(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  lastScannedAt: string | null,
  isInitialScan: boolean,
  maxAllowed: number,
) {
  const { data: existing } = await supabase
    .from("profile_followings")
    .select("following_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("direction", "following")
    .eq("is_current", true)
    .limit(10000);

  const existingIds = new Set((existing || []).map((f: Record<string, unknown>) => f.following_user_id as string));
  const newEntries = currentUsers.filter((f) => !existingIds.has(f.pk));
  if (newEntries.length === 0) return 0;

  const nowMs = Date.now();
  let realEventCount = 0;

  for (let i = 0; i < newEntries.length; i++) {
    const f = newEntries[i];
    const ts = new Date(nowMs - i * 1000).toISOString();
    const genderTag = detectGender(f.full_name, f.username);
    const category = categorizeFollow(f.follower_count, f.is_private);
    const isBackfill = !isInitialScan && i >= maxAllowed;

    await supabase.from("profile_followings").upsert({
      tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk,
      following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null,
      first_seen_at: ts, direction: "following",
      gender_tag: genderTag, category: category,
    }, { onConflict: "tracked_profile_id,following_user_id,direction", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[trigger-scan] upsert profile_followings error:`, error.message);
    });

    await supabase.from("follow_events").upsert({
      tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
      target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
      detected_at: ts, direction: "following", notification_sent: false,
      gender_tag: genderTag,
      category: categorizeFollow(f.follower_count, f.is_private),
      target_follower_count: f.follower_count || null,
      target_is_private: f.is_private || false,
      is_initial: isInitialScan || isBackfill,
    }, { onConflict: "tracked_profile_id,target_username,event_type,direction,is_initial", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[trigger-scan] upsert follow_events error:`, error.message);
    });

    // ★ Bug 2 Fix: Update gender counter for new follows
    if (!isInitialScan && !isBackfill) {
      await supabase.rpc("increment_gender_count", { p_profile_id: profileId, p_gender: genderTag });
    }

    if (!isInitialScan && !isBackfill) realEventCount++;
  }

  if (!isInitialScan && newEntries.length > maxAllowed) {
    console.log(`[DELTA-GATE] followings: ${newEntries.length} new found, capped to ${realEventCount} real events`);
  }

  return isInitialScan ? newEntries.length : realEventCount;
}

async function syncNewFollowers(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentFollowers: FollowingUser[],
  lastScannedAt: string | null,
  isInitialScan: boolean,
  maxAllowed: number,
) {
  const { count: baselineCount } = await supabase
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("tracked_profile_id", profileId);

  if (baselineCount === 0) {
    console.log(`[FOLLOWER-BASELINE] No existing followers for ${profileId}, saving ${currentFollowers.length} as initial baseline`);
    const nowMs = Date.now();

    for (let i = 0; i < currentFollowers.length; i++) {
      const f = currentFollowers[i];
      const ts = new Date(nowMs - i * 1000).toISOString();

      await supabase.from("profile_followers").upsert({
        tracked_profile_id: profileId,
        follower_user_id: f.pk, follower_username: f.username,
        follower_avatar_url: f.profile_pic_url || null, follower_display_name: f.full_name || null,
        follower_follower_count: f.follower_count || null,
        follower_is_verified: f.is_verified || false, follower_is_private: f.is_private || false,
        first_seen_at: ts,
      }, { onConflict: "tracked_profile_id,follower_user_id", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[trigger-scan] upsert profile_followers error:`, error.message);
      });

      await supabase.from("follower_events").upsert({
        profile_id: profileId, instagram_user_id: f.pk, username: f.username,
        full_name: f.full_name || null, profile_pic_url: f.profile_pic_url || null,
        is_verified: f.is_verified || false, follower_count: f.follower_count || null,
        event_type: "gained", detected_at: ts,
        gender_tag: detectGender(f.full_name, f.username),
        category: categorizeFollow(f.follower_count, f.is_private),
        is_initial: true,
      }, { onConflict: "profile_id,username,event_type,is_initial", ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.warn(`[trigger-scan] upsert follower_events (baseline) error:`, error.message);
      });
    }
    return currentFollowers.length;
  }

  if (maxAllowed <= 0) return 0;

  const { data: existing } = await supabase
    .from("profile_followers")
    .select("follower_user_id")
    .eq("tracked_profile_id", profileId)
    .eq("is_current", true)
    .limit(10000);

  const existingIds = new Set((existing || []).map((f: Record<string, unknown>) => f.follower_user_id as string));
  const newEntries = currentFollowers.filter((f) => !existingIds.has(f.pk));
  if (newEntries.length === 0) return 0;

  const toProcess = newEntries.slice(0, maxAllowed);
  const nowMs = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const f = toProcess[i];
    const ts = new Date(nowMs - i * 1000).toISOString();

    await supabase.from("profile_followers").upsert({
      tracked_profile_id: profileId,
      follower_user_id: f.pk, follower_username: f.username,
      follower_avatar_url: f.profile_pic_url || null, follower_display_name: f.full_name || null,
      follower_follower_count: f.follower_count || null,
      follower_is_verified: f.is_verified || false, follower_is_private: f.is_private || false,
      first_seen_at: ts,
    }, { onConflict: "tracked_profile_id,follower_user_id", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[trigger-scan] upsert profile_followers error:`, error.message);
    });

    await supabase.from("follower_events").upsert({
      profile_id: profileId, instagram_user_id: f.pk, username: f.username,
      full_name: f.full_name || null, profile_pic_url: f.profile_pic_url || null,
      is_verified: f.is_verified || false, follower_count: f.follower_count || null,
      event_type: "gained", detected_at: ts,
      gender_tag: detectGender(f.full_name, f.username),
      category: categorizeFollow(f.follower_count, f.is_private),
      is_initial: false,
    }, { onConflict: "profile_id,username,event_type,is_initial", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn(`[trigger-scan] upsert follower_events error:`, error.message);
    });

    // ★ Bug 2 Fix: Update gender counter for new followers
    const followerGender = detectGender(f.full_name, f.username);
    await supabase.rpc("increment_gender_count", { p_profile_id: profileId, p_gender: followerGender });
  }

  if (newEntries.length > maxAllowed) {
    console.log(`[DELTA-GATE] followers: ${newEntries.length} new found, capped to ${toProcess.length} real events`);
  }
  return toProcess.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ★ FIX 1.3: Check daily API budget once
    const budget = await checkDailyBudget(supabase);
    if (!budget.allowed) {
      return new Response(JSON.stringify({ error: "API_BUDGET_EXHAUSTED" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: sub } = await supabase.from("subscriptions").select("plan_type, status, max_tracked_profiles").eq("user_id", user.id).maybeSingle();
    const isPro = sub?.plan_type === "pro" && ["active", "in_trial"].includes(sub?.status || "");
    const isProMax = isPro && (sub?.max_tracked_profiles ?? 0) >= 9999;

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;
    const scanType = body.scanType;

    let query = supabase.from("tracked_profiles").select("*").eq("user_id", user.id).eq("is_active", true);
    if (profileId) query = query.eq("id", profileId);
    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profile found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!isPro && profiles[0]?.initial_scan_done) {
      return new Response(JSON.stringify({ error: "PAYWALL_REQUIRED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Budget check for manual push scans ──
    if (isPro && !isProMax && scanType === "push" && profileId) {
      const profile = profiles[0];
      const resetAt = profile.scans_reset_at ? new Date(profile.scans_reset_at) : new Date(0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      let pushRemaining = profile.push_scans_today ?? 4;
      if (resetAt < todayMidnight) {
        pushRemaining = 4;
        await supabase.from("tracked_profiles").update({ push_scans_today: 4, unfollow_scans_today: 1, scans_reset_at: new Date().toISOString() }).eq("id", profile.id);
      }
      if (pushRemaining <= 0) {
        return new Response(JSON.stringify({ error: "Keine Push-Scans mehr übrig heute", remaining: 0 }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("tracked_profiles").update({ push_scans_today: pushRemaining - 1, total_scans_executed: (profile.total_scans_executed ?? 0) + 1 }).eq("id", profile.id);
    }

    const results = [];
    for (const profile of profiles) {
      const pId = profile.id as string;

      // ★ FIX 1.2: Acquire scan lock
      const locked = await acquireScanLock(supabase, pId, FUNCTION_NAME);
      if (!locked) {
        console.log(`[trigger-scan] ${profile.username}: locked, skipping`);
        results.push({ username: profile.username, error: "locked" });
        continue;
      }

      try {
        let igUserId = profile.instagram_user_id as string | null;
        if (!igUserId) {
          console.log(`[trigger-scan] ${profile.username}: no instagram_user_id, fetching once...`);
          const result = await trackedApiFetch(
            supabase, FUNCTION_NAME, pId,
            `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
            { "x-access-key": hikerApiKey },
          );
          if (result.skipped || result.error || !result.response || !result.response.ok) {
            results.push({ username: profile.username, error: "api_failed" });
            continue;
          }
          const userInfo = await result.response.json();
          igUserId = String(userInfo.pk || userInfo.id);
          await supabase.from("tracked_profiles").update({
            instagram_user_id: igUserId,
            avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
            display_name: userInfo.full_name || null,
            follower_count: userInfo.follower_count ?? 0,
            following_count: userInfo.following_count ?? 0,
          }).eq("id", pId);
        }

        const actualFollowingCount = (profile.following_count as number) ?? 0;
        const actualFollowerCount = (profile.follower_count as number) ?? 0;

        // ★ Daily avatar refresh for tracked_profiles via user-info call
        const lastScanned = profile.last_scanned_at ? new Date(profile.last_scanned_at as string).getTime() : 0;
        const hoursSinceLastScan = (Date.now() - lastScanned) / (1000 * 60 * 60);
        if (hoursSinceLastScan >= 24) {
          console.log(`[trigger-scan] ${profile.username}: refreshing user info (${hoursSinceLastScan.toFixed(1)}h since last scan)`);
          const infoResult = await trackedApiFetch(
            supabase, FUNCTION_NAME, pId,
            `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
            { "x-access-key": hikerApiKey },
          );
          if (infoResult.response?.ok) {
            try {
              const userInfo = await infoResult.response.json();
              const freshAvatar = userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null;
              const updatePayload: Record<string, unknown> = {
                follower_count: userInfo.follower_count ?? actualFollowerCount,
                following_count: userInfo.following_count ?? actualFollowingCount,
              };
              if (freshAvatar) {
                updatePayload.avatar_url = freshAvatar;
                console.log(`[trigger-scan] ${profile.username}: avatar_url refreshed`);
              }
              await supabase.from("tracked_profiles").update(updatePayload).eq("id", pId);
            } catch (e) {
              console.warn(`[trigger-scan] ${profile.username}: failed to parse user info:`, e);
            }
          } else if (infoResult.response) {
            await infoResult.response.text();
          }
        }
        const followingUsers = await fetchPage1(supabase, "following", igUserId, hikerApiKey, pId);
        if (followingUsers === null) {
          results.push({ username: profile.username, error: "api_failed" });
          continue;
        }

        // ── Private detection ──
        if (followingUsers.length === 0 && actualFollowingCount > 0) {
          await supabase.from("tracked_profiles").update({ is_private: true, last_scanned_at: new Date().toISOString() }).eq("id", pId);
          if (!profile.initial_scan_done) {
            results.push({ username: profile.username, error: "profile_private" });
          } else {
            results.push({ username: profile.username, new_follows: 0, new_followers: 0, frozen: true });
          }
          continue;
        }

        if (profile.is_private) {
          await supabase.from("tracked_profiles").update({ is_private: false }).eq("id", pId);
        }

        await supabase.from("tracked_profiles").update({
          previous_follower_count: profile.follower_count || 0,
          previous_following_count: profile.following_count || 0,
          last_scanned_at: new Date().toISOString(),
          initial_scan_done: true,
        }).eq("id", pId);

        const isInitialScan = !profile.initial_scan_done;
        const maxNewFollows = 200;
        const maxNewFollowers = 200;
        const newFollowCount = await syncNewFollows(supabase, pId, followingUsers, profile.last_scanned_at, isInitialScan, maxNewFollows);

        // Call 2: Followers page 1
        await sleep(500);
        const followerUsers = await fetchPage1(supabase, "followers", igUserId, hikerApiKey, pId);
        let newFollowerCount = 0;
        if (followerUsers !== null) {
          console.log(`[trigger-scan] ${profile.username}: fetched ${followerUsers.length} followers`);
          newFollowerCount = await syncNewFollowers(supabase, pId, followerUsers, profile.last_scanned_at, isInitialScan, maxNewFollowers);
        }

        // ★ Avatar refresh for existing rows
        await refreshFollowingAvatars(supabase, pId, followingUsers);
        if (followerUsers !== null) {
          await refreshFollowerAvatars(supabase, pId, followerUsers);
        }

        // Update counts
        await supabase.from("tracked_profiles").update({
          last_following_count: actualFollowingCount,
          last_follower_count: actualFollowerCount,
          ...(newFollowCount + newFollowerCount > 0 && !isInitialScan ? {
            total_follows_detected: (profile.total_follows_detected ?? 0) + newFollowCount + newFollowerCount,
          } : {}),
        }).eq("id", pId);

        console.log(`[trigger-scan] ${profile.username}: ${newFollowCount} new follows, ${newFollowerCount} new followers`);
        results.push({ username: profile.username, new_follows: newFollowCount, new_followers: newFollowerCount });
      } finally {
        // ★ FIX 1.2: ALWAYS release lock
        await releaseScanLock(supabase, pId);
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[trigger-scan] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
