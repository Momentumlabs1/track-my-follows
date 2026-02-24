import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// Inline gender detection for edge function
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

function toRecordArray(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function parseChunkResponse(payload: unknown): { users: Array<Record<string, unknown>>; nextMaxId: string | null } {
  if (Array.isArray(payload)) {
    if (Array.isArray(payload[0])) {
      const nextRaw = payload[1];
      return {
        users: toRecordArray(payload[0]),
        nextMaxId: typeof nextRaw === "string" && nextRaw.length > 0 ? nextRaw : null,
      };
    }

    return { users: toRecordArray(payload), nextMaxId: null };
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const response = obj.response && typeof obj.response === "object"
      ? (obj.response as Record<string, unknown>)
      : null;

    const usersRaw = obj.users ?? obj.items ?? response?.users ?? response?.items ?? [];
    const nextRaw = obj.next_max_id ?? obj.nextMaxId ?? response?.next_max_id ?? response?.nextMaxId ?? null;

    return {
      users: toRecordArray(usersRaw),
      nextMaxId: typeof nextRaw === "string" && nextRaw.length > 0 ? nextRaw : null,
    };
  }

  return { users: [], nextMaxId: null };
}

function mapFollowingUser(raw: Record<string, unknown>): FollowingUser | null {
  const username = typeof raw.username === "string" ? raw.username : null;
  const idRaw = raw.pk ?? raw.id ?? raw.user_id;
  if (!username || idRaw === undefined || idRaw === null) return null;

  const followerRaw = raw.follower_count;
  let followerCount: number | undefined;
  if (typeof followerRaw === "number") followerCount = followerRaw;
  else if (typeof followerRaw === "string" && followerRaw.trim()) {
    const parsed = Number(followerRaw);
    if (!Number.isNaN(parsed)) followerCount = parsed;
  }

  return {
    username,
    pk: String(idRaw),
    profile_pic_url: typeof raw.profile_pic_url === "string" ? raw.profile_pic_url : undefined,
    full_name: typeof raw.full_name === "string" ? raw.full_name : undefined,
    follower_count: followerCount,
    is_private: typeof raw.is_private === "boolean" ? raw.is_private : undefined,
  };
}

async function fetchFollowingChunked(userId: string, hikerApiKey: string, maxPages: number): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;
    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (res.status === 404) { await res.text(); console.log(`No following entries found for user ${userId} (404)`); break; }
    if (!res.ok) { const text = await res.text(); throw new Error(`Following fetch failed: ${res.status} ${text}`); }

    const parsed = parseChunkResponse(await res.json());
    

    for (const rawUser of parsed.users) {
      const user = mapFollowingUser(rawUser);
      if (user) allUsers.push(user);
    }

    nextMaxId = parsed.nextMaxId;
    page++;
    if (!nextMaxId || parsed.users.length === 0) break;
    if (page < maxPages) await sleep(1000);
  }
  return allUsers;
}

async function fetchFollowerChunked(userId: string, hikerApiKey: string, maxPages: number): Promise<FollowingUser[]> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/followers/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;
    const res = await fetch(url, { headers: { "x-access-key": hikerApiKey } });
    if (res.status === 404) { await res.text(); console.log(`No follower entries found for user ${userId} (404)`); break; }
    if (!res.ok) { const text = await res.text(); throw new Error(`Follower fetch failed: ${res.status} ${text}`); }

    const parsed = parseChunkResponse(await res.json());
    

    for (const rawUser of parsed.users) {
      const user = mapFollowingUser(rawUser);
      if (user) allUsers.push(user);
    }

    nextMaxId = parsed.nextMaxId;
    page++;
    if (!nextMaxId || parsed.users.length === 0) break;
    if (page < maxPages) await sleep(1000);
  }
  return allUsers;
}

async function diffAndSync(
  supabase: ReturnType<typeof createClient>, profileId: string, currentUsers: FollowingUser[],
  direction: "following" | "follower", lastScannedAt: string | null,
) {
  const { data: existing } = await supabase.from("profile_followings").select("*").eq("tracked_profile_id", profileId).eq("direction", direction).eq("is_current", true);
  const existingMap = new Map((existing || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]));
  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);
  let newCount = 0;
  const newEntries: FollowingUser[] = [];
  for (const f of currentUsers) {
    if (!existingMap.has(f.pk)) { newEntries.push(f); }
    else {
      const ex = existingMap.get(f.pk) as Record<string, unknown>;
      await supabase.from("profile_followings").update({ last_seen_at: new Date().toISOString(), following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null }).eq("id", ex.id as string);
    }
  }
  const randomTs = newEntries.map(() => new Date(lastTs + Math.random() * spanMs)).sort((a, b) => a.getTime() - b.getTime());
  for (let i = 0; i < newEntries.length; i++) {
    const f = newEntries[i];
    const ts = randomTs[i].toISOString();
    await supabase.from("profile_followings").insert({ tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk, following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null, first_seen_at: ts, direction });
    await supabase.from("follow_events").insert({
      tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
      target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
      detected_at: ts, direction, notification_sent: false,
      gender_tag: detectGender(f.full_name),
      category: categorizeFollow(f.follower_count, f.is_private),
      target_follower_count: f.follower_count || null,
      target_is_private: f.is_private || false,
    });
    newCount++;
  }
  return { newCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Check subscription
    const { data: sub } = await supabase.from("subscriptions").select("plan_type, status").eq("user_id", user.id).maybeSingle();
    const isFree = !sub || sub.plan_type === "free";

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    let query = supabase.from("tracked_profiles").select("*").eq("user_id", user.id).eq("is_active", true);
    if (profileId) query = query.eq("id", profileId);
    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profile found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Free user: block if initial_scan_done
    if (isFree && profiles[0]?.initial_scan_done) {
      return new Response(JSON.stringify({ error: "PAYWALL_REQUIRED", message: "Upgrade to Pro for continuous scanning" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];
    for (const profile of profiles) {
      const userInfoRes = await fetch(`https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`, { headers: { "x-access-key": hikerApiKey } });
      if (!userInfoRes.ok) { const errText = await userInfoRes.text(); results.push({ username: profile.username, error: `${userInfoRes.status}: ${errText}` }); continue; }
      const userInfo = await userInfoRes.json();
      const igUserId = String(userInfo.pk || userInfo.id);

      await supabase.from("tracked_profiles").update({
        previous_follower_count: profile.follower_count || 0, previous_following_count: profile.following_count || 0,
        avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
        display_name: userInfo.full_name || null, follower_count: userInfo.follower_count || 0,
        following_count: userInfo.following_count || 0, last_scanned_at: new Date().toISOString(),
        initial_scan_done: true,
      }).eq("id", profile.id);

      

      await sleep(1000);
      const followingUsers = await fetchFollowingChunked(igUserId, hikerApiKey, 2);
      await sleep(1000);
      const followerUsers = await fetchFollowerChunked(igUserId, hikerApiKey, 2);

      console.log(`${profile.username}: ${followingUsers.length} following, ${followerUsers.length} followers (quick)`);

      const followingDiff = await diffAndSync(supabase, profile.id, followingUsers, "following", profile.last_scanned_at);
      const followerDiff = await diffAndSync(supabase, profile.id, followerUsers, "follower", profile.last_scanned_at);

      results.push({ username: profile.username, new_follows: followingDiff.newCount + followerDiff.newCount });
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Trigger-scan error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
