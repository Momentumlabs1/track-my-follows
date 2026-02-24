import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Gender detection ──
const FEMALE_NAMES = new Set(["anna","maria","laura","lisa","sarah","sophie","julia","lena","hannah","emma","lea","mia","nina","jana","alina","lara","clara","elena","melanie","nadine","stefanie","christina","katharina","alexandra","bianca","daniela","jessica","sandra","sabrina","tamara","vanessa","jennifer","michaela","verena","denise","jasmin","carina","manuela","martina","petra","silvia","claudia","monika","amelie","charlotte","luisa","emily","ashley","samantha","brittany","taylor","olivia","madison","chloe","grace","natalie","victoria","amber","nicole","rachel","megan","kate","rebecca","amanda","stephanie","heather","lauren","bella","sophia","ava","isabella","harper","ella","scarlett","aria","lily","zoe","riley","michelle","tiffany","ayse","fatma","emine","hatice","zeynep","elif","merve","busra","esra","tugba","selin","dilara","nur","buse","ceren","irem","gamze","gizem","pinar","derya","defne","carmen","lucia","paula","sofia","valentina","camila","gabriela","andrea","ana","rosa","adriana","diana","carolina","alejandra","fatima","aisha","maryam","layla","sara","nour","hana","amira","dina","rania","yasmin","lina","maya","nadia","salma","sana","zahra","khadija","reem","zara","dana","natasha","katya","olga","tatiana","irina","svetlana","marina","daria","polina","anastasia","kristina","milena","ivana","jelena","vera"]);
const MALE_NAMES = new Set(["max","lukas","leon","paul","jonas","felix","david","moritz","julian","niklas","tobias","daniel","stefan","michael","thomas","alexander","christian","florian","markus","patrick","dominik","sebastian","bernhard","wolfgang","franz","josef","andreas","martin","peter","hans","karl","helmut","gerhard","manfred","manuel","ben","tim","james","john","robert","william","richard","joseph","charles","christopher","matthew","anthony","mark","donald","steven","andrew","brian","joshua","kevin","jason","ryan","jacob","ethan","noah","liam","mason","logan","alex","tyler","brandon","dylan","connor","luke","jack","owen","chris","mehmet","mustafa","ahmet","ali","hasan","ibrahim","murat","ismail","osman","yusuf","emre","burak","serkan","volkan","cem","baris","arda","kerem","kaan","can","hakan","mohammed","muhammad","ahmed","omar","khalid","hassan","hussein","saif","amir","tariq","youssef","karim","nabil","bilal","hamza","abdullah","nasser","samir","walid","faisal","rami","ivan","vladimir","sergei","dmitri","alexei","nikola","milan","dragan","boris","andrej","marko","pavel","oleg","nikolai"]);

function detectGender(fullName: string | null | undefined): string {
  if (!fullName) return "unknown";
  const cleaned = fullName.replace(/[\u{1F600}-\u{1F9FF}]/gu, "").trim();
  const parts = cleaned.split(/\s+/);
  if (!parts[0]) return "unknown";
  const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, "");
  if (!firstName || firstName.length < 2) return "unknown";
  if (FEMALE_NAMES.has(firstName)) return "female";
  if (MALE_NAMES.has(firstName)) return "male";
  if (firstName.endsWith("a") && firstName.length > 3) return "female";
  return "unknown";
}

function categorizeFollow(followerCount: number | null | undefined, isPrivate: boolean | undefined): string {
  if (isPrivate) return "private";
  if (followerCount && followerCount > 100000) return "celebrity";
  if (followerCount && followerCount > 10000) return "influencer";
  return "normal";
}

// ── API response parsing (handles multiple HikerAPI formats) ──
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
  };
}

// ── Fetch page 1 only (Smart-Scan = 1 API call) ──
async function fetchFollowingPage1(userId: string, hikerApiKey: string): Promise<FollowingUser[]> {
  const url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${userId}`;
  const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
  if (res.status === 404) { await res.text(); return []; }
  if (!res.ok) { const text = await res.text(); throw new Error(`Following fetch failed: ${res.status} ${text}`); }
  const parsed = parseChunkResponse(await res.json());
  const users: FollowingUser[] = [];
  for (const raw of parsed.users) { const u = mapFollowingUser(raw); if (u) users.push(u); }
  return users;
}

// ── Diff: only detect NEW follows (no unfollow detection in smart-scan) ──
async function syncNewFollows(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentUsers: FollowingUser[],
  lastScannedAt: string | null,
) {
  const { data: existing } = await supabase
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

  for (let i = 0; i < newEntries.length; i++) {
    const f = newEntries[i];
    const ts = randomTs[i].toISOString();
    await supabase.from("profile_followings").insert({
      tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk,
      following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null,
      first_seen_at: ts, direction: "following",
    });
    await supabase.from("follow_events").insert({
      tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
      target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
      detected_at: ts, direction: "following", notification_sent: false,
      gender_tag: detectGender(f.full_name),
      category: categorizeFollow(f.follower_count, f.is_private),
      target_follower_count: f.follower_count || null,
      target_is_private: f.is_private || false,
    });
  }
  return newEntries.length;
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Load ALL active profiles with subscription info
    const { data: profiles, error: profilesError } = await supabase
      .from("tracked_profiles")
      .select("*")
      .eq("is_active", true)
      .limit(50);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No active profiles", scanned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get subscription status for each user
    const userIds = [...new Set(profiles.map((p) => p.user_id))];
    const { data: subs } = await supabase.from("subscriptions").select("user_id, plan_type, status").in("user_id", userIds);
    const subMap = new Map((subs || []).map((s) => [s.user_id, s]));

    const results: Array<{ username: string; new_follows: number; skipped?: boolean; error?: string }> = [];

    for (const profile of profiles) {
      try {
        const sub = subMap.get(profile.user_id);
        const isPro = sub?.plan_type === "pro" && ["active", "in_trial"].includes(sub?.status || "");

        // FREE: skip if already scanned today
        if (!isPro) {
          const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at) : null;
          if (lastScan) {
            const today = new Date().toISOString().split("T")[0];
            const lastScanDate = lastScan.toISOString().split("T")[0];
            if (lastScanDate === today) {
              results.push({ username: profile.username, new_follows: 0, skipped: true });
              continue;
            }
          }
        }

        // PRO: scan every hour (cron runs hourly, no extra check needed)

        // Fetch user info
        await sleep(500);
        const userInfoRes = await fetch(
          `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`,
          { headers: { "x-access-key": hikerApiKey } },
        );
        if (!userInfoRes.ok) {
          results.push({ username: profile.username, new_follows: 0, error: `User info: ${userInfoRes.status}` });
          continue;
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
          initial_scan_done: true,
        }).eq("id", profile.id);

        // Smart-Scan: only page 1
        await sleep(500);
        const followingUsers = await fetchFollowingPage1(igUserId, hikerApiKey);
        const newCount = await syncNewFollows(supabase, profile.id, followingUsers, profile.last_scanned_at);

        console.log(`[smart-scan] ${profile.username}: ${followingUsers.length} on page 1, ${newCount} new follows`);
        results.push({ username: profile.username, new_follows: newCount });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[smart-scan] Error for ${profile.username}:`, msg);
        results.push({ username: profile.username, new_follows: 0, error: msg });
        if (msg.includes("402")) break; // API credits exhausted
      }

      await sleep(1000);
    }

    return new Response(JSON.stringify({ scanned: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[smart-scan] Fatal error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
