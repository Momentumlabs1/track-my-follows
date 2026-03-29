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

type FollowingSource = "gql" | "v1";

// ── Full pagination fetch — robust cursor-set + source fallback on stale pages ──
async function fetchAllFollowings(
  supabase: ReturnType<typeof createClient>,
  userId: string, hikerApiKey: string, profileId: string,
  expectedCount: number,
  preferredSource: FollowingSource = "gql",
): Promise<FollowingUser[] | null> {
  const allUsers: FollowingUser[] = [];
  const seenIds = new Set<string>();
  const seenCursorsBySource: Record<FollowingSource, Set<string>> = {
    gql: new Set<string>(),
    v1: new Set<string>(),
  };
  let nextMaxId: string | null = null;
  let page = 0;
  let source: FollowingSource = preferredSource;
  let sourceSwitches = 0;
  let stalePages = 0;

  // Adaptive max pages with safer floor to handle temporary duplicate bursts.
  // Prevents premature stop (e.g. 7 pages for ~287 expected) while still capped.
  const maxPages = expectedCount > 0
    ? Math.min(Math.max(Math.ceil(expectedCount / 200) + 8, 20), 60)
    : 20;

  while (page < maxPages) {
    const basePath = source === "gql"
      ? "https://api.hikerapi.com/gql/user/following/chunk"
      : "https://api.hikerapi.com/v1/user/following/chunk";
    let url = `${basePath}?user_id=${userId}&count=200`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;

    const result = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, url, { "x-access-key": hikerApiKey });
    if (result.skipped) return null;
    if (result.error || !result.response) return null;
    if (result.response.status === 404) { await result.response.text(); break; }
    if (!result.response.ok) { await result.response.text(); return null; }

    const parsed = parseChunkResponse(await result.response.json());

    let newOnThisPage = 0;
    for (const raw of parsed.users) {
      const u = mapFollowingUser(raw);
      if (u && !seenIds.has(u.pk)) { seenIds.add(u.pk); allUsers.push(u); newOnThisPage++; }
    }
    stalePages = newOnThisPage === 0 ? stalePages + 1 : 0;

    page++;
    console.log(
      `[unfollow-check] [${source}] page ${page}: ${parsed.users.length} raw, ${newOnThisPage} new, total=${allUsers.length}/${expectedCount}, cursor=${parsed.nextMaxId ? "yes" : "none"}, stale=${stalePages}`,
    );

    if (!parsed.nextMaxId || parsed.users.length === 0) break;

    // Early-exit: got enough data (110% of expected)
    if (expectedCount > 0 && allUsers.length >= expectedCount * 1.1) {
      console.log(`[unfollow-check] Early-exit: ${allUsers.length} >= ${expectedCount}*1.1 after ${page} pages`);
      break;
    }

    const seenCursors = seenCursorsBySource[source];

    // If gql keeps returning duplicate pages, switch once to v1 endpoint and continue.
    if (source === "gql" && sourceSwitches === 0 && stalePages >= 3) {
      console.log(`[unfollow-check] gql stale stream detected at page ${page}, switching to v1 endpoint`);
      source = "v1";
      sourceSwitches++;
      nextMaxId = parsed.nextMaxId;
      await sleep(300);
      continue;
    }

    // True cursor loop detection per source
    if (seenCursors.has(parsed.nextMaxId)) {
      // Retry once via v1 when gql cursor loops.
      if (source === "gql" && sourceSwitches === 0) {
        console.log(`[unfollow-check] gql cursor loop at page ${page}, switching to v1 endpoint`);
        source = "v1";
        sourceSwitches++;
        nextMaxId = parsed.nextMaxId;
        await sleep(300);
        continue;
      }
      console.log(`[unfollow-check] Cursor loop detected on ${source} at page ${page} (cursor=${parsed.nextMaxId}), stopping`);
      break;
    }
    seenCursors.add(parsed.nextMaxId);
    nextMaxId = parsed.nextMaxId;

    await sleep(300);
  }

  console.log(`[unfollow-check] Fetched ${allUsers.length} unique followings in ${page} pages (source=${source}, maxPages=${maxPages})`);
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
      // ── Fetch fresh following_count — try gql/info/by/id first, fallback to v1/user/by/username ──
      let freshFollowingCount = profile.following_count ?? 0;
      let expectedCountTrusted = false;

      const infoUrl = `https://api.hikerapi.com/gql/user/info/by/id?id=${igUserId}`;
      const infoResult = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, infoUrl, { "x-access-key": hikerApiKey });

      if (infoResult.response?.ok) {
        try {
          const info = await infoResult.response.json();
          const freshCount = info?.following_count ?? info?.response?.following_count;
          if (typeof freshCount === "number") {
            console.log(`[unfollow-check] Fresh following_count (gql): ${freshCount} (DB had ${profile.following_count})`);
            freshFollowingCount = freshCount;
            expectedCountTrusted = true;
            await supabase.from("tracked_profiles").update({ following_count: freshCount }).eq("id", profileId);
          }
        } catch (e) {
          console.warn(`[unfollow-check] Failed to parse gql info:`, e);
        }
      } else {
        // Drain body, then try fallback
        if (infoResult.response) await infoResult.response.text();
        console.log(`[unfollow-check] gql info failed (${infoResult.response?.status}), trying v1 fallback...`);
        const fallbackUrl = `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username as string)}`;
        const fallbackResult = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, fallbackUrl, { "x-access-key": hikerApiKey });
        if (fallbackResult.response?.ok) {
          try {
            const fbInfo = await fallbackResult.response.json();
            if (typeof fbInfo?.following_count === "number") {
              console.log(`[unfollow-check] Fresh following_count (v1 fallback): ${fbInfo.following_count}`);
              freshFollowingCount = fbInfo.following_count;
              expectedCountTrusted = true;
              await supabase.from("tracked_profiles").update({ following_count: fbInfo.following_count }).eq("id", profileId);
            }
          } catch (e) {
            console.warn(`[unfollow-check] Failed to parse v1 fallback:`, e);
          }
        } else if (fallbackResult.response) {
          await fallbackResult.response.text();
        }
      }

      console.log(`[unfollow-check] Fetching all followings for ${profile.username} (expected ~${freshFollowingCount}, trusted=${expectedCountTrusted})...`);
      
      // Retry logic: up to 2 attempts for partial fetches
      let allFollowings: FollowingUser[] | null = null;
      const expectedCount = freshFollowingCount;
      const MAX_ATTEMPTS = 2;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const preferredSource: FollowingSource = attempt === 1 ? "gql" : "v1";
        console.log(`[unfollow-check] Attempt ${attempt}: fetching followings via ${preferredSource}`);
        allFollowings = await fetchAllFollowings(
          supabase,
          igUserId,
          hikerApiKey,
          profileId,
          freshFollowingCount,
          preferredSource,
        );

        if (allFollowings === null) {
          await supabase.from("tracked_profiles").update({ unfollow_scans_today: unfollowRemaining }).eq("id", profile.id);
          return new Response(JSON.stringify({ error: "API_FAILED" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // PARTIAL_FETCH guard: only strict if expectedCount is trusted AND >= 10
        const threshold = expectedCountTrusted ? 0.5 : 0.3;
        if (expectedCount >= 10 && allFollowings.length < expectedCount * threshold) {
          console.warn(`[unfollow-check] Attempt ${attempt}: PARTIAL_FETCH got ${allFollowings.length} but expected ~${expectedCount} (trusted=${expectedCountTrusted}, threshold=${threshold})`);
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

      const dbCurrentCount = (dbFollowings || []).length;

      // ══════════════════════════════════════════════
      // BASELINE COVERAGE CHECK — auto-repair if incomplete
      // ══════════════════════════════════════════════
      const coverageRatio = freshFollowingCount > 0 ? dbCurrentCount / freshFollowingCount : 1;
      console.log(`[unfollow-check] Baseline coverage: ${dbCurrentCount}/${freshFollowingCount} = ${(coverageRatio * 100).toFixed(1)}%`);

      if (coverageRatio < 0.9 && freshFollowingCount >= 10) {
        // Baseline is incomplete — repair it by inserting missing entries
        console.log(`[unfollow-check] Baseline incomplete (${(coverageRatio * 100).toFixed(1)}%), repairing...`);

        const existingPks = new Set((dbFollowings || []).map((f: Record<string, unknown>) => f.following_user_id as string));
        const missingEntries: Record<string, unknown>[] = [];

        for (const u of allFollowings) {
          if (!existingPks.has(u.pk)) {
            const genderTag = detectGender(u.full_name, u.username);
            const category = categorizeFollow(u.follower_count, u.is_private);
            missingEntries.push({
              tracked_profile_id: profile.id,
              following_username: u.username,
              following_user_id: u.pk,
              following_avatar_url: u.profile_pic_url || null,
              following_display_name: u.full_name || null,
              first_seen_at: new Date().toISOString(),
              direction: "following",
              is_current: true,
              gender_tag: genderTag,
              category,
            });
          }
        }

        if (missingEntries.length > 0) {
          await batchUpsert(supabase, "profile_followings", missingEntries, "tracked_profile_id,following_user_id,direction");
          console.log(`[unfollow-check] Repaired baseline: inserted ${missingEntries.length} missing entries`);
        }

        // Refund the scan budget since we used this check for repair, not comparison
        await supabase.from("tracked_profiles").update({
          unfollow_scans_today: unfollowRemaining,
          last_following_count: allFollowings.length,
        }).eq("id", profile.id);

        return new Response(JSON.stringify({
          success: true,
          baseline_repaired: true,
          missing_entries_added: missingEntries.length,
          coverage_before: coverageRatio,
          coverage_after: freshFollowingCount > 0 ? (dbCurrentCount + missingEntries.length) / freshFollowingCount : 1,
          message: "Baseline was incomplete and has been repaired. Please run the check again for accurate results.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

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
