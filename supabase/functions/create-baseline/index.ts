// create-baseline v4 — robust v1 pagination + dedup + shared gender detection
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

// ── Batch upsert helper (chunks of 500) ──
async function batchInsert(supabase: ReturnType<typeof createClient>, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) console.error(`[create-baseline] Batch insert error on ${table}:`, error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ⚠️ Auth: Accept service-role key (server-to-server) OR user token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;
    let userId: string | null = null;

    if (!isServiceRole) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load profile
    const query = supabase.from("tracked_profiles").select("*").eq("id", profileId);
    if (!isServiceRole && userId) query.eq("user_id", userId);
    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.baseline_complete) {
      return new Response(JSON.stringify({
        success: true, skipped: true, message: "Baseline already exists",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const username = profile.username as string;

    // ── Get profile info ──
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
        success: true, skipped: true, message: "Profile is private",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ══════════════════════════════════════════
    // LOAD FOLLOWING LIST — v1 endpoint (stable, like unfollow-check)
    // With deduplication + cursor protection
    // ══════════════════════════════════════════

    const seenIds = new Set<string>();
    const allFollowings: FollowingUser[] = [];
    let isFullBaseline = true;
    let rawLoaded = 0;

    if (followingCount > 10000) {
      // Over 10K: sample page 1 only
      console.log(`[create-baseline] ${username}: ${followingCount} followings > 10K, sampling page 1 only`);
      const url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${igUserId}`;
      const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
      if (!res.ok) throw new Error(`Following fetch failed: ${res.status}`);
      const parsed = parseChunkResponse(await res.json());
      for (const raw of parsed.users) {
        rawLoaded++;
        const u = mapFollowingUser(raw);
        if (u && !seenIds.has(u.pk)) {
          seenIds.add(u.pk);
          allFollowings.push(u);
        }
      }
      isFullBaseline = false;
    } else {
      // Up to 10K: paginate ALL pages using v1 endpoint
      console.log(`[create-baseline] ${username}: Loading all ${followingCount} followings via v1...`);
      let nextMaxId: string | null = null;
      let prevMaxId: string | null = null;
      let page = 0;
      const maxPages = 60; // 60 pages × ~200/page = 12K max

      let apiLimitHit = false;
      do {
        let url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${igUserId}`;
        if (nextMaxId) url += `&max_id=${nextMaxId}`;

        const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
        if (res.status === 404) { await res.text(); break; }
        if (res.status === 402) {
          console.warn(`[create-baseline] ${username}: HikerAPI 402 at page ${page}, partial save`);
          apiLimitHit = true;
          await res.text();
          break;
        }
        if (res.status === 429) {
          console.warn(`[create-baseline] ${username}: HikerAPI 429 at page ${page}, partial save`);
          apiLimitHit = true;
          await res.text();
          break;
        }
        if (!res.ok) throw new Error(`Following page ${page} failed: ${res.status}`);

        const parsed = parseChunkResponse(await res.json());
        let pageNewCount = 0;
        for (const raw of parsed.users) {
          rawLoaded++;
          const u = mapFollowingUser(raw);
          if (u && !seenIds.has(u.pk)) {
            seenIds.add(u.pk);
            allFollowings.push(u);
            pageNewCount++;
          }
        }

        console.log(`[create-baseline] ${username}: page ${page}: ${parsed.users.length} raw, ${pageNewCount} new unique, cursor=${parsed.nextMaxId ? 'yes' : 'none'}`);

        // Cursor protection: abort if cursor unchanged or page empty
        if (parsed.users.length === 0) break;
        if (parsed.nextMaxId && parsed.nextMaxId === prevMaxId) {
          console.warn(`[create-baseline] ${username}: cursor stuck at page ${page}, aborting`);
          break;
        }

        prevMaxId = nextMaxId;
        nextMaxId = parsed.nextMaxId;
        page++;
        if (nextMaxId) await sleep(400);
      } while (nextMaxId && page < maxPages);

      if (apiLimitHit) isFullBaseline = false;
    }

    console.log(`[create-baseline] ${username}: ${rawLoaded} raw loaded, ${allFollowings.length} unique after dedup`);

    // ══════════════════════════════════════════
    // SAVE TO DB — batch approach
    // ══════════════════════════════════════════

    // Get existing following IDs from DB
    const { data: existingFollowings } = await supabase
      .from("profile_followings")
      .select("following_user_id")
      .eq("tracked_profile_id", profileId)
      .eq("direction", "following")
      .eq("is_current", true);

    const existingIds = new Set(
      (existingFollowings || []).map((f: Record<string, unknown>) => f.following_user_id as string)
    );

    // Prepare batches
    const newRows: Record<string, unknown>[] = [];
    const updateUsers: { pk: string; genderTag: string; category: string }[] = [];

    for (const user of allFollowings) {
      const genderTag = detectGender(user.full_name, user.username);
      const category = categorizeFollow(user.follower_count, user.is_private);

      if (existingIds.has(user.pk)) {
        updateUsers.push({ pk: user.pk, genderTag, category });
      } else {
        newRows.push({
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

    // Batch insert new rows
    await batchInsert(supabase, "profile_followings", newRows);

    // Update existing rows (gender_tag + category) — batch by gender/category combo
    let updatedCount = 0;
    for (const u of updateUsers) {
      const { error: updateErr } = await supabase
        .from("profile_followings")
        .update({ gender_tag: u.genderTag, category: u.category })
        .eq("tracked_profile_id", profileId)
        .eq("following_user_id", u.pk)
        .eq("direction", "following");
      if (updateErr) console.warn(`[create-baseline] Update failed for ${u.pk}:`, updateErr.message);
      else updatedCount++;
    }

    console.log(`[create-baseline] ${username}: DB ops: ${newRows.length} inserted, ${updatedCount} updated, ${existingIds.size} existed before`);

    // ══════════════════════════════════════════
    // RE-COUNT GENDER FROM DB
    // ══════════════════════════════════════════

    const { data: dbCounts } = await supabase
      .from("profile_followings")
      .select("gender_tag")
      .eq("tracked_profile_id", profileId)
      .eq("direction", "following")
      .eq("is_current", true);

    let dbFemale = 0, dbMale = 0, dbUnknown = 0;
    for (const row of (dbCounts || [])) {
      if (row.gender_tag === "female") dbFemale++;
      else if (row.gender_tag === "male") dbMale++;
      else dbUnknown++;
    }
    const dbTotal = dbFemale + dbMale + dbUnknown;

    console.log(`[create-baseline] ${username}: DB gender: F${dbFemale}/M${dbMale}/U${dbUnknown} (total ${dbTotal})`);

    // ══════════════════════════════════════════
    // CONFIDENCE
    // ══════════════════════════════════════════

    let confidenceLevel: string;
    if (followingCount <= 5000) confidenceLevel = "high";
    else if (followingCount <= 10000) confidenceLevel = "medium";
    else confidenceLevel = "low";

    // ══════════════════════════════════════════
    // UPDATE PROFILE
    // ══════════════════════════════════════════

    await supabase.from("tracked_profiles").update({
      baseline_complete: isFullBaseline,
      last_following_count: followingCount,
      last_follower_count: userInfo.follower_count || 0,
      gender_female_count: dbFemale,
      gender_male_count: dbMale,
      gender_unknown_count: dbUnknown,
      gender_confidence: confidenceLevel,
      gender_sample_size: dbTotal,
    }).eq("id", profileId);

    console.log(`[create-baseline] ${username}: DONE! unique=${allFollowings.length}, dbTotal=${dbTotal}, gender=F${dbFemale}/M${dbMale}/U${dbUnknown}, confidence=${confidenceLevel}, full=${isFullBaseline}`);

    return new Response(JSON.stringify({
      success: true,
      followings_loaded_raw: rawLoaded,
      followings_unique: allFollowings.length,
      followings_inserted: newRows.length,
      followings_updated: updatedCount,
      followings_in_db: dbTotal,
      total_followings: followingCount,
      is_full_baseline: isFullBaseline,
      confidence: confidenceLevel,
      gender: { female: dbFemale, male: dbMale, unknown: dbUnknown },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[create-baseline] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
