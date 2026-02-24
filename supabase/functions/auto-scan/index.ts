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

interface ScanResult { username: string; new_follows: number; unfollows: number; scan_type: string; error?: string; }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Inline gender detection
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

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429 && i < retries) { await sleep((i + 1) * 3000); continue; }
    return res;
  }
  throw new Error("Max retries exceeded");
}

async function fetchFollowingList(userId: string, hikerApiKey: string, scanType: "quick" | "full"): Promise<{ users: FollowingUser[]; complete: boolean }> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  const maxPages = scanType === "quick" ? 2 : 999;
  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/following/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;
    const res = await fetchWithRetry(url, { "x-access-key": hikerApiKey });
    if (!res.ok) { const text = await res.text(); if (res.status === 402) throw new Error("HikerAPI 402"); throw new Error(`Following fetch failed: ${res.status} ${text}`); }
    const data = await res.json();
    const users: Array<Record<string, unknown>> = data.users || data.items || [];
    for (const u of users) {
      allUsers.push({ username: u.username as string, pk: String(u.pk || u.id), profile_pic_url: (u.profile_pic_url as string) || undefined, full_name: (u.full_name as string) || undefined, follower_count: (u.follower_count as number) || undefined, is_private: (u.is_private as boolean) || undefined });
    }
    nextMaxId = data.next_max_id || null;
    page++;
    if (!nextMaxId || users.length === 0) break;
    await sleep(1000);
  }
  return { users: allUsers, complete: !nextMaxId };
}

async function fetchFollowerList(userId: string, hikerApiKey: string, scanType: "quick" | "full"): Promise<{ users: FollowingUser[]; complete: boolean }> {
  const allUsers: FollowingUser[] = [];
  let nextMaxId: string | null = null;
  let page = 0;
  const maxPages = scanType === "quick" ? 2 : 999;
  while (page < maxPages) {
    let url = `https://api.hikerapi.com/v1/user/followers/chunk?user_id=${userId}`;
    if (nextMaxId) url += `&max_id=${nextMaxId}`;
    const res = await fetchWithRetry(url, { "x-access-key": hikerApiKey });
    if (!res.ok) { const text = await res.text(); if (res.status === 402) throw new Error("HikerAPI 402"); throw new Error(`Follower fetch failed: ${res.status} ${text}`); }
    const data = await res.json();
    const users: Array<Record<string, unknown>> = data.users || data.items || [];
    for (const u of users) {
      allUsers.push({ username: u.username as string, pk: String(u.pk || u.id), profile_pic_url: (u.profile_pic_url as string) || undefined, full_name: (u.full_name as string) || undefined, follower_count: (u.follower_count as number) || undefined, is_private: (u.is_private as boolean) || undefined });
    }
    nextMaxId = data.next_max_id || null;
    page++;
    if (!nextMaxId || users.length === 0) break;
    await sleep(1000);
  }
  return { users: allUsers, complete: !nextMaxId };
}

async function diffAndSync(
  supabase: ReturnType<typeof createClient>, profileId: string, currentUsers: FollowingUser[],
  direction: "following" | "follower", lastScannedAt: string | null, isFullScan: boolean,
  followerSet?: Set<string>,
) {
  const { data: existing } = await supabase.from("profile_followings").select("*").eq("tracked_profile_id", profileId).eq("direction", direction).eq("is_current", true);
  const existingMap = new Map((existing || []).map((f: Record<string, unknown>) => [f.following_user_id as string, f]));
  const currentSet = new Set(currentUsers.map((f) => f.pk));
  const now = Date.now();
  const lastTs = lastScannedAt ? new Date(lastScannedAt).getTime() : now - 60 * 60 * 1000;
  const spanMs = Math.max(now - lastTs, 60_000);
  let newCount = 0;
  let removedCount = 0;

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
    const isMutual = followerSet ? followerSet.has(f.pk) : false;
    await supabase.from("profile_followings").insert({ tracked_profile_id: profileId, following_username: f.username, following_user_id: f.pk, following_avatar_url: f.profile_pic_url || null, following_display_name: f.full_name || null, first_seen_at: ts, direction });
    await supabase.from("follow_events").insert({
      tracked_profile_id: profileId, event_type: "follow", target_username: f.username,
      target_avatar_url: f.profile_pic_url || null, target_display_name: f.full_name || null,
      detected_at: ts, direction, notification_sent: false,
      gender_tag: detectGender(f.full_name),
      is_mutual: isMutual,
      category: categorizeFollow(f.follower_count, f.is_private),
      target_follower_count: f.follower_count || null,
      target_is_private: f.is_private || false,
    });
    newCount++;
  }

  if (isFullScan) {
    for (const [userId, ex] of existingMap) {
      if (!currentSet.has(userId)) {
        removedCount++;
        const e = ex as Record<string, unknown>;
        await supabase.from("profile_followings").update({ is_current: false }).eq("id", e.id as string);
        await supabase.from("follow_events").insert({
          tracked_profile_id: profileId, event_type: "unfollow",
          target_username: e.following_username as string,
          target_avatar_url: (e.following_avatar_url as string) || null,
          target_display_name: (e.following_display_name as string) || null,
          direction, notification_sent: false,
          gender_tag: detectGender(e.following_display_name as string | null),
          category: "normal",
        });
      }
    }
  }
  return { newCount, removedCount };
}

function determineScanType(timezone: string): "quick" | "full" {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
    const hour = parseInt(formatter.format(now), 10);
    return hour === 19 ? "full" : "quick";
  } catch { return "quick"; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hikerApiKey = Deno.env.get("HIKER_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Only load Pro user profiles
    const { data: proSubs } = await supabase.from("subscriptions").select("user_id").eq("plan_type", "pro").in("status", ["active", "in_trial"]);
    const proUserIds = (proSubs || []).map((s) => s.user_id);

    if (proUserIds.length === 0) {
      return new Response(JSON.stringify({ message: "No pro users", scanned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profiles, error: profilesError } = await supabase.from("tracked_profiles").select("*").eq("is_active", true).in("user_id", proUserIds).limit(30);
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No active pro profiles", scanned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userIds = [...new Set(profiles.map((p) => p.user_id))];
    const { data: userSettings } = await supabase.from("user_settings").select("user_id, timezone").in("user_id", userIds);
    const tzMap = new Map((userSettings || []).map((s) => [s.user_id, s.timezone]));

    const results: ScanResult[] = [];
    let totalNewFollows = 0;
    let totalUnfollows = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        const timezone = tzMap.get(profile.user_id) || "Europe/Vienna";
        const scanType = determineScanType(timezone);
        console.log(`Scanning ${profile.username} (${scanType}, tz=${timezone})`);

        await sleep(1000);
        const userInfoRes = await fetchWithRetry(`https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(profile.username)}`, { "x-access-key": hikerApiKey });
        if (!userInfoRes.ok) {
          if (userInfoRes.status === 402) throw new Error("HikerAPI 402");
          results.push({ username: profile.username, new_follows: 0, unfollows: 0, scan_type: scanType, error: `User info: ${userInfoRes.status}` });
          errors++; continue;
        }
        const userInfo = await userInfoRes.json();
        const igUserId = String(userInfo.pk || userInfo.id);
        if (userInfo.is_private) {
          await supabase.from("tracked_profiles").update({ is_active: false }).eq("id", profile.id);
          results.push({ username: profile.username, new_follows: 0, unfollows: 0, scan_type: scanType, error: "Profile is private" });
          continue;
        }

        await supabase.from("tracked_profiles").update({
          previous_follower_count: profile.follower_count || 0, previous_following_count: profile.following_count || 0,
          avatar_url: userInfo.profile_pic_url || userInfo.hd_profile_pic_url_info?.url || null,
          display_name: userInfo.full_name || null, follower_count: userInfo.follower_count || 0,
          following_count: userInfo.following_count || 0, last_scanned_at: new Date().toISOString(),
        }).eq("id", profile.id);

        await sleep(1000);
        const followingResult = await fetchFollowingList(igUserId, hikerApiKey, scanType);
        await sleep(1000);
        const followerResult = await fetchFollowerList(igUserId, hikerApiKey, scanType);

        // Build follower set for mutual detection
        const followerSet = new Set(followerResult.users.map((f) => f.pk));

        const isFullScan = scanType === "full";
        const followingDiff = await diffAndSync(supabase, profile.id, followingResult.users, "following", profile.last_scanned_at, isFullScan && followingResult.complete, followerSet);
        const followerDiff = await diffAndSync(supabase, profile.id, followerResult.users, "follower", profile.last_scanned_at, isFullScan && followerResult.complete);

        totalNewFollows += followingDiff.newCount + followerDiff.newCount;
        totalUnfollows += followingDiff.removedCount + followerDiff.removedCount;
        results.push({ username: profile.username, new_follows: followingDiff.newCount + followerDiff.newCount, unfollows: followingDiff.removedCount + followerDiff.removedCount, scan_type: scanType });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error scanning ${profile.username}:`, errMsg);
        results.push({ username: profile.username, new_follows: 0, unfollows: 0, scan_type: "error", error: errMsg });
        errors++;
        if (errMsg.includes("402")) { console.error("HikerAPI credits exhausted"); break; }
      }
    }

    return new Response(JSON.stringify({ scanned: results.length, new_follows: totalNewFollows, unfollows: totalUnfollows, errors, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Auto-scan fatal error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
