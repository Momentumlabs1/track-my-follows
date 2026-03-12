// unfollow-check v3 — shared gender detection
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";

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

// ── Full pagination fetch – reduced sleep from 800ms to 300ms ──
async function fetchAll(endpoint: string, userId: string, hikerApiKey: string): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  while (page < 10) {
    let url = `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;
    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (res.status === 404) { await res.text(); break; }
    if (!res.ok) { const text = await res.text(); throw new Error(`${endpoint} fetch failed: ${res.status} ${text}`); }
    const parsed = parseChunkResponse(await res.json());
    for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) allUsers.push(u); }
    nextMaxId = parsed.nextMaxId;
    page++;
    if (!nextMaxId || parsed.users.length === 0) break;
    await sleep(300); // reduced from 800ms
  }
  return allUsers;
}

// ── Batch insert helper (chunks of 500) ──
async function batchInsert(supabase: ReturnType<typeof createClient>, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) console.error(`[unfollow-check] Batch insert error on ${table}:`, error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    const profileId = body.profileId;
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Load profile first for budget check ──
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

    // ── Budget check using column-based system ──
    const resetAt = profile.scans_reset_at ? new Date(profile.scans_reset_at) : new Date(0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    let unfollowRemaining = profile.unfollow_scans_today ?? 2;

    if (resetAt < todayMidnight) {
      unfollowRemaining = 2;
      await supabase.from("tracked_profiles").update({
        push_scans_today: 4,
        unfollow_scans_today: 2,
        scans_reset_at: new Date().toISOString(),
      }).eq("id", profile.id);
    }

    if (unfollowRemaining <= 0) {
      return new Response(JSON.stringify({ error: "LIMIT_REACHED", remaining: 0 }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Decrement unfollow budget
    await supabase.from("tracked_profiles").update({
      unfollow_scans_today: unfollowRemaining - 1,
    }).eq("id", profile.id);

    // ── Get IG user ID ──
    const userInfoRes = await fetch(
      `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
      { headers: { "x-access-key": hikerApiKey } },
    );
    if (!userInfoRes.ok) {
      return new Response(JSON.stringify({ error: `User info failed: ${userInfoRes.status}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userInfo = await userInfoRes.json();
    const igUserId = String(userInfo.pk || userInfo.id);

    // Update profile metadata
    await supabase.from("tracked_profiles").update({
      previous_follower_count: profile.follower_count || 0,
      previous_following_count: profile.following_count || 0,
      avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
      display_name: userInfo.full_name || null,
      follower_count: userInfo.follower_count || 0,
      following_count: userInfo.following_count || 0,
      last_scanned_at: new Date().toISOString(),
    }).eq("id", profile.id);

    // ══════════════════════════════════════════════
    // PARALLEL SCAN: Following + Followers simultaneously
    // ══════════════════════════════════════════════
    console.log(`[unfollow-check] Starting PARALLEL scan for ${profile.username}...`);
    
    const [allFollowings, allFollowers] = await Promise.all([
      fetchAll("following", igUserId, hikerApiKey),
      fetchAll("followers", igUserId, hikerApiKey),
    ]);
    
    console.log(`[unfollow-check] ${profile.username}: ${allFollowings.length} followings, ${allFollowers.length} followers fetched`);

    // ── Load DB state for both in parallel ──
    const [{ data: dbFollowings }, { data: dbFollowers }] = await Promise.all([
      supabase.from("profile_followings").select("*").eq("tracked_profile_id", profile.id).eq("direction", "following").eq("is_current", true),
      supabase.from("profile_followers").select("*").eq("tracked_profile_id", profile.id).eq("is_current", true),
    ]);

    const now = Date.now();
    const lastTs = profile.last_scanned_at ? new Date(profile.last_scanned_at).getTime() : now - 60 * 60 * 1000;
    const spanMs = Math.max(now - lastTs, 60_000);

    // ══════════════════════════════════════════════
    // PART 1: FOLLOWING – detect unfollows + new follows (batched)
    // ══════════════════════════════════════════════
    const currentFollowingApiIds = new Set(allFollowings.map((u) => u.pk));
    const dbFollowingMap = new Map((dbFollowings || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]));
    const existingFollowingIds = new Set((dbFollowings || []).map((f: Record<string, unknown>) => f.following_user_id as string));

    // Detect unfollows (in DB but not in API)
    let unfollowsFound = 0;
    const unfollowUpdateIds: string[] = [];
    const unfollowEvents: Record<string, unknown>[] = [];
    const genderDecrements: string[] = [];

    for (const [userId, ex] of dbFollowingMap) {
      if (!currentFollowingApiIds.has(userId)) {
        unfollowsFound++;
        const e = ex as Record<string, unknown>;
        unfollowUpdateIds.push(e.id as string);
        const unfollowGender = detectGender(e.following_display_name as string | null, e.following_username as string | null);
        unfollowEvents.push({
          tracked_profile_id: profile.id,
          event_type: "unfollow",
          target_username: e.following_username as string,
          target_avatar_url: (e.following_avatar_url as string) || null,
          target_display_name: (e.following_display_name as string) || null,
          direction: "following",
          notification_sent: false,
          gender_tag: unfollowGender,
          category: "normal",
        });
        genderDecrements.push(unfollowGender);
      }
    }

    // Detect new follows
    let newFollowsFound = 0;
    const newFollowingRows: Record<string, unknown>[] = [];
    const newFollowEvents: Record<string, unknown>[] = [];

    for (const f of allFollowings) {
      if (!existingFollowingIds.has(f.pk)) {
        newFollowsFound++;
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
        });
      }
    }

    // ══════════════════════════════════════════════
    // PART 2: FOLLOWERS – detect lost + new (batched)
    // ══════════════════════════════════════════════
    const currentFollowerApiIds = new Set(allFollowers.map((u) => u.pk));
    const existingFollowerIds = new Set((dbFollowers || []).map((f: Record<string, unknown>) => f.follower_user_id as string));

    let lostFollowers = 0;
    const lostFollowerUpdateIds: string[] = [];
    const lostFollowerEvents: Record<string, unknown>[] = [];

    for (const dbF of (dbFollowers || [])) {
      const f = dbF as Record<string, unknown>;
      const fUserId = f.follower_user_id as string;
      if (!currentFollowerApiIds.has(fUserId)) {
        lostFollowers++;
        lostFollowerUpdateIds.push(f.id as string);
        lostFollowerEvents.push({
          profile_id: profile.id,
          instagram_user_id: fUserId,
          username: f.follower_username as string,
          full_name: (f.follower_display_name as string) || null,
          profile_pic_url: (f.follower_avatar_url as string) || null,
          event_type: "lost",
          detected_at: new Date().toISOString(),
          gender_tag: detectGender(f.follower_display_name as string | null),
        });
      }
    }

    let newFollowersFound = 0;
    const newFollowerRows: Record<string, unknown>[] = [];
    const newFollowerEvents: Record<string, unknown>[] = [];

    for (const f of allFollowers) {
      if (!existingFollowerIds.has(f.pk)) {
        newFollowersFound++;
        const ts = new Date(lastTs + Math.random() * spanMs).toISOString();
        newFollowerRows.push({
          tracked_profile_id: profile.id,
          follower_user_id: f.pk, follower_username: f.username,
          follower_avatar_url: f.profile_pic_url || null,
          follower_display_name: f.full_name || null,
          follower_follower_count: f.follower_count || null,
          follower_is_verified: f.is_verified || false,
          follower_is_private: f.is_private || false,
          first_seen_at: ts,
        });
        newFollowerEvents.push({
          profile_id: profile.id,
          instagram_user_id: f.pk, username: f.username,
          full_name: f.full_name || null,
          profile_pic_url: f.profile_pic_url || null,
          is_verified: f.is_verified || false,
          follower_count: f.follower_count || null,
          event_type: "gained", detected_at: ts,
          gender_tag: detectGender(f.full_name),
          category: categorizeFollow(f.follower_count, f.is_private),
        });
      }
    }

    // ══════════════════════════════════════════════
    // BATCH DB OPERATIONS – all at once
    // ══════════════════════════════════════════════
    console.log(`[unfollow-check] Batching DB ops: ${unfollowsFound} unfollows, ${newFollowsFound} new follows, ${lostFollowers} lost, ${newFollowersFound} new followers`);

    // Mark unfollowed followings as not current (batch update by IDs)
    if (unfollowUpdateIds.length > 0) {
      await supabase.from("profile_followings").update({ is_current: false }).in("id", unfollowUpdateIds);
    }

    // Mark lost followers as not current
    if (lostFollowerUpdateIds.length > 0) {
      await supabase.from("profile_followers").update({ is_current: false }).in("id", lostFollowerUpdateIds);
    }

    // Batch inserts in parallel
    await Promise.all([
      batchInsert(supabase, "follow_events", [...unfollowEvents, ...newFollowEvents]),
      batchInsert(supabase, "profile_followings", newFollowingRows),
      batchInsert(supabase, "follower_events", [...lostFollowerEvents, ...newFollowerEvents]),
      batchInsert(supabase, "profile_followers", newFollowerRows),
    ]);

    // Gender count decrements (must be sequential RPCs)
    for (const g of genderDecrements) {
      await supabase.rpc("decrement_gender_count", { p_profile_id: profile.id, p_gender: g });
    }

    // ── Reset pending hint + update counts ──
    await supabase.from("tracked_profiles").update({
      pending_unfollow_hint: 0,
      last_following_count: allFollowings.length,
      total_follows_detected: (profile.total_follows_detected ?? 0) + newFollowsFound + newFollowersFound,
      total_unfollows_detected: (profile.total_unfollows_detected ?? 0) + unfollowsFound + lostFollowers,
      total_scans_executed: (profile.total_scans_executed ?? 0) + 1,
    }).eq("id", profile.id);

    // ── Log the check ──
    await supabase.from("unfollow_checks").insert({
      tracked_profile_id: profileId,
      user_id: user.id,
      unfollows_found: unfollowsFound + lostFollowers,
      new_follows_found: newFollowsFound + newFollowersFound,
    });

    const remaining = unfollowRemaining - 1;
    console.log(`[unfollow-check] ${profile.username}: ${unfollowsFound} unfollows, ${lostFollowers} lost followers, ${newFollowsFound} new follows, ${newFollowersFound} new followers, ${remaining} checks remaining`);

    return new Response(JSON.stringify({
      success: true,
      unfollows_found: unfollowsFound,
      lost_followers: lostFollowers,
      new_follows_found: newFollowsFound,
      new_followers_found: newFollowersFound,
      checks_remaining: remaining,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[unfollow-check] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
