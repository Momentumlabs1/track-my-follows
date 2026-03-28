// unfollow-check v6 — audit-hardened with apiGuard, scan locks, budget checks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";
import { acquireScanLock, releaseScanLock, checkDailyBudget, trackedApiFetch } from "../_shared/apiGuard.ts";

const FUNCTION_NAME = "unfollow-check";

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

// ── Full pagination fetch — uses trackedApiFetch ──
async function fetchAllFollowings(
  supabase: ReturnType<typeof createClient>,
  userId: string, hikerApiKey: string, profileId: string,
  expectedCount: number,
): Promise<FollowingUser[] | null> {
  const allUsers: FollowingUser[] = [];
  const seenIds = new Set<string>();
  let nextMaxId: string | null = null;
  let prevMaxId: string | null = null;
  let page = 0;
  const MAX_PAGES = 60;

  while (page < MAX_PAGES) {
    let url = `https://api.hikerapi.com/gql/user/following/chunk?user_id=${userId}&count=200`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const result = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, url, { "x-access-key": hikerApiKey });
    if (result.skipped) return null; // 429 → skip profile
    if (result.error || !result.response) return null;
    if (result.response.status === 404) { await result.response.text(); break; }
    if (!result.response.ok) { await result.response.text(); return null; }

    const parsed = parseChunkResponse(await result.response.json());

    let newOnThisPage = 0;
    for (const raw of parsed.users) {
      const u = mapFollowingUser(raw);
      if (u && !seenIds.has(u.pk)) { seenIds.add(u.pk); allUsers.push(u); newOnThisPage++; }
    }

    nextMaxId = parsed.nextMaxId;
    page++;

    if (!nextMaxId || parsed.users.length === 0) break;
    // Stop if API keeps returning only duplicates (no new unique users)
    if (newOnThisPage === 0) {
      console.log(`[unfollow-check] No new unique users on page ${page}, stopping (got ${allUsers.length} total)`);
      break;
    }
    if (expectedCount > 0 && allUsers.length >= expectedCount * 1.1) {
      console.log(`[unfollow-check] Early-exit: got ${allUsers.length} users (expected ~${expectedCount}) after ${page} pages`);
      break;
    }
    if (nextMaxId === prevMaxId) { console.log(`[unfollow-check] Cursor stuck at page ${page}, stopping`); break; }
    prevMaxId = nextMaxId;

    await sleep(300);
  }

  console.log(`[unfollow-check] Fetched ${allUsers.length} unique followings in ${page} pages`);
  return allUsers;
}

// ── Batch upsert helper (ON CONFLICT safe) ──
async function batchUpsert(supabase: ReturnType<typeof createClient>, table: string, rows: Record<string, unknown>[], onConflict: string) {
  if (rows.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict, ignoreDuplicates: true });
    if (error) {
      console.error(`[unfollow-check] Upsert error on ${table}:`, error.message);
    }
  }
}

async function batchUpdateLastSeen(supabase: ReturnType<typeof createClient>, ids: string[]) {
  if (ids.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { error } = await supabase.from("profile_followings").update({ last_seen_at: new Date().toISOString() }).in("id", chunk);
    if (error) console.error(`[unfollow-check] last_seen_at update error:`, error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let profileId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;
  let lockAcquired = false;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // ── Pro check ──
    const { data: sub } = await supabase.from("subscriptions").select("plan_type, status").eq("user_id", user.id).maybeSingle();
    if (sub?.plan_type !== "pro" || !["active", "in_trial"].includes(sub?.status || "")) {
      return new Response(JSON.stringify({ error: "PRO_REQUIRED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    profileId = body.profileId;
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Load profile ──
    const { data: profile } = await supabase
      .from("tracked_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Budget check ──
    const resetAt = profile.scans_reset_at ? new Date(profile.scans_reset_at) : new Date(0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    let unfollowRemaining = profile.unfollow_scans_today ?? 2;
    if (resetAt < todayMidnight) {
      unfollowRemaining = 2;
      await supabase.from("tracked_profiles").update({ push_scans_today: 4, unfollow_scans_today: 2, scans_reset_at: new Date().toISOString() }).eq("id", profile.id);
    }
    if (unfollowRemaining <= 0) {
      return new Response(JSON.stringify({ error: "LIMIT_REACHED", remaining: 0 }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Decrement budget
    await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining - 1 }).eq("id", profile.id);

    const igUserId = profile.instagram_user_id as string | null;
    if (!igUserId) {
      return new Response(JSON.stringify({ error: "No instagram_user_id stored. Run a baseline first." }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((profile.following_count ?? 0) > 1500) {
      await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining }).eq("id", profile.id);
      return new Response(JSON.stringify({ error: "FOLLOWING_LIMIT", message: "Unfollow-Check nur bis 1.500 Gefolgten möglich" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ★ FIX 1.2: Acquire scan lock
    const locked = await acquireScanLock(supabase, profileId, FUNCTION_NAME);
    if (!locked) {
      // Refund budget
      await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining }).eq("id", profile.id);
      return new Response(JSON.stringify({ error: "Another scan is running" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    lockAcquired = true;

    try {
      await supabase.from("tracked_profiles").update({
        previous_follower_count: profile.follower_count || 0,
        previous_following_count: profile.following_count || 0,
        last_scanned_at: new Date().toISOString(),
      }).eq("id", profile.id);

      // ══════════════════════════════════════════════
      // STEP 1: Fetch ALL current followings from API
      // ══════════════════════════════════════════════
      // ── Fetch fresh following_count from API to avoid stale DB values ──
      const infoUrl = `https://api.hikerapi.com/gql/user/info/by/id?id=${igUserId}`;
      const infoResult = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, infoUrl, { "x-access-key": hikerApiKey });

      let freshFollowingCount = profile.following_count ?? 0;
      if (infoResult.response?.ok) {
        try {
          const info = await infoResult.response.json();
          const freshCount = info?.following_count ?? info?.response?.following_count;
          if (typeof freshCount === "number") {
            console.log(`[unfollow-check] Fresh following_count for ${profile.username}: ${freshCount} (DB had ${profile.following_count})`);
            freshFollowingCount = freshCount;
            await supabase.from("tracked_profiles").update({ following_count: freshCount }).eq("id", profileId);
          }
        } catch (e) {
          console.warn(`[unfollow-check] Failed to parse info response:`, e);
        }
      } else if (infoResult.response) {
        await infoResult.response.text(); // drain body
      }

      console.log(`[unfollow-check] Fetching all followings for ${profile.username}...`);
      
      // Retry logic: up to 2 attempts for partial fetches
      let allFollowings: FollowingUser[] | null = null;
      const expectedCount = freshFollowingCount;
      const MAX_ATTEMPTS = 2;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        allFollowings = await fetchAllFollowings(supabase, igUserId, hikerApiKey, profileId, freshFollowingCount);

        if (allFollowings === null) {
          await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining }).eq("id", profile.id);
          return new Response(JSON.stringify({ error: "API_FAILED" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // PARTIAL_FETCH guard only for expectedCount >= 10
        if (expectedCount >= 10 && allFollowings.length < expectedCount * 0.5) {
          console.warn(`[unfollow-check] Attempt ${attempt}: PARTIAL_FETCH got ${allFollowings.length} but expected ~${expectedCount}`);
          if (attempt < MAX_ATTEMPTS) {
            await sleep(2000);
            continue;
          }
          await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining }).eq("id", profile.id);
          return new Response(JSON.stringify({ error: "PARTIAL_FETCH", fetched: allFollowings.length, expected: expectedCount }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      // ══════════════════════════════════════════════
      // STEP 2: Load baseline from DB
      // ══════════════════════════════════════════════
      const { data: dbFollowings } = await supabase
        .from("profile_followings")
        .select("*")
        .eq("tracked_profile_id", profile.id)
        .eq("direction", "following")
        .eq("is_current", true)
        .limit(10000);

      const now = Date.now();
      const lastTs = profile.last_scanned_at ? new Date(profile.last_scanned_at).getTime() : now - 60 * 60 * 1000;
      const spanMs = Math.max(now - lastTs, 60_000);

      // ══════════════════════════════════════════════
      // STEP 3: Compare
      // ══════════════════════════════════════════════
      const currentApiIds = new Set(allFollowings.map((u) => u.pk));
      const dbMap = new Map((dbFollowings || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]));
      const existingIds = new Set((dbFollowings || []).map((f: Record<string, unknown>) => f.following_user_id as string));

      const confirmIds: string[] = [];
      for (const [userId, ex] of dbMap) {
        if (currentApiIds.has(userId)) {
          confirmIds.push((ex as Record<string, unknown>).id as string);
        }
      }

      let unfollowsFound = 0;
      const unfollowUpdateIds: string[] = [];
      const unfollowEvents: Record<string, unknown>[] = [];
      const genderDecrements: string[] = [];

      for (const [userId, ex] of dbMap) {
        if (!currentApiIds.has(userId)) {
          const e = ex as Record<string, unknown>;
          unfollowsFound++;
          unfollowUpdateIds.push(e.id as string);
          const unfollowGender = detectGender(e.following_display_name as string | null, e.following_username as string | null);
          unfollowEvents.push({
            tracked_profile_id: profile.id, event_type: "unfollow",
            target_username: e.following_username as string,
            target_avatar_url: (e.following_avatar_url as string) || null,
            target_display_name: (e.following_display_name as string) || null,
            direction: "following", detected_at: new Date().toISOString(),
            notification_sent: false, gender_tag: unfollowGender, category: "normal",
          });
          genderDecrements.push(unfollowGender);
        }
      }

      // ══════════════════════════════════════════════
      // STEP 4: Detect new follows
      // ══════════════════════════════════════════════
      const actualFollowingCount = (profile.following_count as number) ?? allFollowings.length;
      const lastFollowingCount = profile.last_following_count as number | null;
      const maxNewFollows = lastFollowingCount !== null && lastFollowingCount !== undefined
        ? Math.max(actualFollowingCount - lastFollowingCount, 0)
        : 200;

      let newFollowsFound = 0;
      const newFollowingRows: Record<string, unknown>[] = [];
      const newFollowEvents: Record<string, unknown>[] = [];

      const newCandidates = allFollowings.filter(f => !existingIds.has(f.pk));
      for (let i = 0; i < newCandidates.length; i++) {
        const f = newCandidates[i];
        const isBackfill = i >= maxNewFollows;
        const ts = new Date(lastTs + Math.random() * spanMs).toISOString();
        const newGenderTag = detectGender(f.full_name, f.username);
        const newCategory = categorizeFollow(f.follower_count, f.is_private);
        newFollowingRows.push({
          tracked_profile_id: profile.id, following_username: f.username, following_user_id: f.pk,
          following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null,
          first_seen_at: ts, direction: "following",
          gender_tag: newGenderTag, category: newCategory,
        });
        newFollowEvents.push({
          tracked_profile_id: profile.id, event_type: "follow", target_username: f.username,
          target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
          detected_at: ts, direction: "following", notification_sent: false,
          gender_tag: newGenderTag, category: newCategory,
          target_follower_count: f.follower_count || null,
          target_is_private: f.is_private || false,
          is_initial: isBackfill,
        });
        if (!isBackfill) newFollowsFound++;
      }

      // ══════════════════════════════════════════════
      // STEP 5: Write to DB
      // ══════════════════════════════════════════════
      console.log(`[unfollow-check] ${profile.username}: ${unfollowsFound} unfollows, ${newFollowsFound} new follows`);

      if (unfollowUpdateIds.length > 0) {
        const CHUNK = 500;
        for (let i = 0; i < unfollowUpdateIds.length; i += CHUNK) {
          await supabase.from("profile_followings").update({ is_current: false }).in("id", unfollowUpdateIds.slice(i, i + CHUNK));
        }
      }

      await batchUpdateLastSeen(supabase, confirmIds);

      if (unfollowEvents.length > 0) await batchUpsert(supabase, "follow_events", unfollowEvents, "tracked_profile_id,target_username,event_type,direction,is_initial");
      if (newFollowEvents.length > 0) await batchUpsert(supabase, "follow_events", newFollowEvents, "tracked_profile_id,target_username,event_type,direction,is_initial");
      if (newFollowingRows.length > 0) await batchUpsert(supabase, "profile_followings", newFollowingRows, "tracked_profile_id,following_user_id,direction");

      for (const g of genderDecrements) {
        await supabase.rpc("decrement_gender_count", { p_profile_id: profile.id, p_gender: g });
      }

      await supabase.from("tracked_profiles").update({
        pending_unfollow_hint: 0,
        last_following_count: allFollowings.length,
        total_follows_detected: (profile.total_follows_detected ?? 0) + newFollowsFound,
        total_unfollows_detected: (profile.total_unfollows_detected ?? 0) + unfollowsFound,
        total_scans_executed: (profile.total_scans_executed ?? 0) + 1,
      }).eq("id", profile.id);

      await supabase.from("unfollow_checks").insert({
        tracked_profile_id: profileId, user_id: user.id,
        unfollows_found: unfollowsFound, new_follows_found: newFollowsFound,
      });

      const remaining = unfollowRemaining - 1;
      console.log(`[unfollow-check] Done: ${unfollowsFound} unfollows, ${newFollowsFound} new follows, ${remaining} remaining`);

      return new Response(JSON.stringify({
        success: true, unfollows_found: unfollowsFound, new_follows_found: newFollowsFound, checks_remaining: remaining,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } finally {
      // ★ FIX 1.2: ALWAYS release lock
      if (supabase && profileId && lockAcquired) await releaseScanLock(supabase, profileId);
    }

  } catch (err) {
    console.error("[unfollow-check] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
