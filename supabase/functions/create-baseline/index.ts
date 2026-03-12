// create-baseline v3 — shared gender detection
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

// ── API response parsing (copied from smart-scan) ──
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ⚠️ Auth: Verify user owns the profile
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load profile with ownership check
    const { data: profile, error: profileError } = await supabase
      .from("tracked_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already has baseline? Skip.
    if (profile.baseline_complete) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: "Baseline already exists",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const username = profile.username as string;

    // ── Get profile info (for following count + user ID) ──
    const userInfoRes = await fetch(
      `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`,
      { headers: { "x-access-key": hikerApiKey } },
    );
    if (!userInfoRes.ok) {
      return new Response(JSON.stringify({ error: `User info failed: ${userInfoRes.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userInfo = await userInfoRes.json();
    const igUserId = String(userInfo.pk || userInfo.id);
    const followingCount = userInfo.following_count ?? 0;

    // ── Private account check ──
    if (userInfo.is_private === true) {
      await supabase.from("tracked_profiles").update({ is_private: true }).eq("id", profileId);
      console.log(`[create-baseline] ${username}: private, skipping baseline`);
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: "Profile is private",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ══════════════════════════════════════════
    // LOAD FOLLOWING LIST
    // Up to 10K: ALL pages (full baseline)
    // Over 10K: Page 1 only (sample)
    // ══════════════════════════════════════════

    const allFollowings: FollowingUser[] = [];
    let isFullBaseline = true;

    if (followingCount > 10000) {
      console.log(`[create-baseline] ${username}: ${followingCount} followings > 10K, sampling page 1 only`);
      const url = `https://api.hikerapi.com/gql/user/following/chunk?user_id=${igUserId}`;
      const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
      if (!res.ok) throw new Error(`Following fetch failed: ${res.status}`);
      const parsed = parseChunkResponse(await res.json());
      for (const raw of parsed.users) {
        const u = mapFollowingUser(raw);
        if (u) allFollowings.push(u);
      }
      isFullBaseline = false;
    } else {
      console.log(`[create-baseline] ${username}: Loading all ${followingCount} followings...`);
      let nextMaxId: string | null = null;
      let page = 0;

      let apiLimitHit = false;
      do {
        const url = nextMaxId
          ? `https://api.hikerapi.com/gql/user/following/chunk?user_id=${igUserId}&max_id=${nextMaxId}`
          : `https://api.hikerapi.com/gql/user/following/chunk?user_id=${igUserId}`;

        const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
        if (res.status === 404) { await res.text(); break; }
        if (res.status === 402) {
          console.warn(`[create-baseline] ${username}: HikerAPI 402 at page ${page}, partial save with ${allFollowings.length} users`);
          apiLimitHit = true;
          await res.text();
          break;
        }
        if (res.status === 429) {
          console.warn(`[create-baseline] ${username}: HikerAPI 429 rate limit at page ${page}, partial save`);
          apiLimitHit = true;
          await res.text();
          break;
        }
        if (!res.ok) throw new Error(`Following page ${page} failed: ${res.status}`);

        const parsed = parseChunkResponse(await res.json());
        for (const raw of parsed.users) {
          const u = mapFollowingUser(raw);
          if (u) allFollowings.push(u);
        }
        nextMaxId = parsed.nextMaxId;
        page++;
        if (nextMaxId) await sleep(500);
      } while (nextMaxId && page < 5);
      if (apiLimitHit) isFullBaseline = false;
    }

    console.log(`[create-baseline] ${username}: ${allFollowings.length} followings loaded`);

    // ══════════════════════════════════════════
    // SAVE TO DB + COUNT GENDER
    // ══════════════════════════════════════════

    let femaleCount = 0;
    let maleCount = 0;
    let unknownCount = 0;

    // Get existing following IDs from DB (from trigger-scan page 1)
    const { data: existingFollowings } = await supabase
      .from("profile_followings")
      .select("following_user_id")
      .eq("tracked_profile_id", profileId)
      .eq("direction", "following")
      .eq("is_current", true);

    const existingIds = new Set(
      (existingFollowings || []).map((f: Record<string, unknown>) => f.following_user_id as string)
    );

    for (const user of allFollowings) {
      const genderTag = detectGender(user.full_name);
      const category = categorizeFollow(user.follower_count, user.is_private);

      if (genderTag === "female") femaleCount++;
      else if (genderTag === "male") maleCount++;
      else unknownCount++;

      if (existingIds.has(user.pk)) {
        // Already in DB (from trigger-scan) → only update gender_tag + category
        await supabase
          .from("profile_followings")
          .update({ gender_tag: genderTag, category })
          .eq("tracked_profile_id", profileId)
          .eq("following_user_id", user.pk)
          .eq("direction", "following");
      } else {
        // New → Insert
        await supabase.from("profile_followings").insert({
          tracked_profile_id: profileId,
          following_username: user.username,
          following_user_id: user.pk,
          following_avatar_url: user.profile_pic_url || null,
          following_display_name: user.full_name || null,
          first_seen_at: new Date().toISOString(),
          direction: "following",
          is_current: true,
          gender_tag: genderTag,
          category,
        });
      }
    }

    // ══════════════════════════════════════════
    // CALCULATE CONFIDENCE
    // ══════════════════════════════════════════

    let confidenceLevel: string;
    if (followingCount <= 5000) {
      confidenceLevel = "high";
    } else if (followingCount <= 10000) {
      confidenceLevel = "medium";
    } else {
      confidenceLevel = "low";
    }

    // ══════════════════════════════════════════
    // UPDATE PROFILE
    // ══════════════════════════════════════════

    await supabase.from("tracked_profiles").update({
      baseline_complete: isFullBaseline,
      last_following_count: followingCount,
      last_follower_count: userInfo.follower_count || 0,
      gender_female_count: femaleCount,
      gender_male_count: maleCount,
      gender_unknown_count: unknownCount,
      gender_confidence: confidenceLevel,
      gender_sample_size: allFollowings.length,
    }).eq("id", profileId);

    console.log(`[create-baseline] ${username}: Done! ${allFollowings.length} scanned, gender: F${femaleCount}/M${maleCount}/U${unknownCount}, confidence: ${confidenceLevel}`);

    return new Response(JSON.stringify({
      success: true,
      followings_scanned: allFollowings.length,
      total_followings: followingCount,
      is_full_baseline: isFullBaseline,
      confidence: confidenceLevel,
      gender: { female: femaleCount, male: maleCount, unknown: unknownCount },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[create-baseline] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
