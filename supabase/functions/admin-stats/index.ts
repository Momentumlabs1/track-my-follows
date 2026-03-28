import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@spy-secret.com";
const COST_PER_CALL = 0.00069;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
    } = await admin.auth.admin.getUserById(claimsData.claims.sub as string);
    if (!user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersRes,
      subsRes,
      profilesRes,
      apiTodayRes,
      apiMonthRes,
      apiPerHourRes,
      apiRecentRes,
      followEventsCountRes,
      apiCallsByProfileRes,
      apiMonthlyByProfileRes,
      sevenDayRes,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("subscriptions").select("*"),
      admin.from("tracked_profiles").select("*"),
      admin.from("api_call_log").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      admin.from("api_call_log").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      admin.from("api_call_log").select("function_name, created_at").gte("created_at", last24h).order("created_at", { ascending: true }),
      admin.from("api_call_log").select("function_name, created_at, endpoint, status_code, profile_id").gte("created_at", todayStart).order("created_at", { ascending: false }).limit(50),
      admin.from("follow_events").select("tracked_profile_id, id", { count: "exact" }),
      admin.from("api_call_log").select("profile_id, function_name").gte("created_at", todayStart),
      // Monthly calls by profile for user breakdown
      admin.from("api_call_log").select("profile_id, created_at").gte("created_at", monthStart),
      admin.from("api_call_log").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    ]);

    const allUsers = usersRes.data?.users || [];
    const allSubs = subsRes.data || [];
    const allProfiles = profilesRes.data || [];
    const apiCallsToday = apiTodayRes.count || 0;
    const apiCallsThisMonth = apiMonthRes.count || 0;

    // Profile → User mapping
    const profileUserMap = new Map<string, string>();
    for (const p of allProfiles) {
      profileUserMap.set(p.id, p.user_id);
    }

    // Per-user API calls today
    const userCallCounts: Record<string, number> = {};
    for (const c of (apiCallsByProfileRes.data || [])) {
      const userId = c.profile_id ? profileUserMap.get(c.profile_id) : null;
      const key = userId || "__no_user__";
      userCallCounts[key] = (userCallCounts[key] || 0) + 1;
    }

    // Per-user API calls this month
    const monthlyUserCallCounts: Record<string, number> = {};
    for (const c of (apiMonthlyByProfileRes.data || [])) {
      const userId = c.profile_id ? profileUserMap.get(c.profile_id) : null;
      const key = userId || "__no_user__";
      monthlyUserCallCounts[key] = (monthlyUserCallCounts[key] || 0) + 1;
    }

    // Daily breakdown (last 30 days) from monthly data
    const dailyCounts: Record<string, { count: number; byUser: Record<string, number> }> = {};
    for (const c of (apiMonthlyByProfileRes.data || [])) {
      const day = c.created_at?.substring(0, 10) || "unknown";
      if (!dailyCounts[day]) dailyCounts[day] = { count: 0, byUser: {} };
      dailyCounts[day].count++;
      const userId = c.profile_id ? profileUserMap.get(c.profile_id) : null;
      const key = userId || "__no_user__";
      dailyCounts[day].byUser[key] = (dailyCounts[day].byUser[key] || 0) + 1;
    }
    const dailyBreakdown = Object.entries(dailyCounts)
      .map(([date, d]) => ({
        date,
        count: d.count,
        cost: +(d.count * COST_PER_CALL).toFixed(4),
        byUser: Object.entries(d.byUser).map(([userId, count]) => ({ userId, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Calls by function (today - from 24h data filtered to today)
    const allTodayCallsForFunc = (apiPerHourRes.data || []).filter((c: any) => {
      const d = new Date(c.created_at);
      return d.toDateString() === new Date().toDateString();
    });
    const funcCounts: Record<string, number> = {};
    for (const c of allTodayCallsForFunc) {
      funcCounts[c.function_name] = (funcCounts[c.function_name] || 0) + 1;
    }
    const callsByFunction = Object.entries(funcCounts)
      .map(([function_name, count]) => ({ function_name, count }))
      .sort((a, b) => b.count - a.count);

    // Calls per hour (last 24h)
    const hourCounts: Record<string, number> = {};
    for (const c of (apiPerHourRes.data || [])) {
      const hour = new Date(c.created_at);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      hourCounts[key] = (hourCounts[key] || 0) + 1;
    }
    const callsPerHour = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Pro users — deduplicated by user_id
    const proUserIds = new Set(
      allSubs
        .filter((s: any) => s.status === "active" || s.status === "in_trial")
        .map((s: any) => s.user_id)
    );
    const proUsers = proUserIds.size;

    // Build user list
    const subsMap = new Map(allSubs.map((s: any) => [s.user_id, s]));
    const profilesByUser = new Map<string, any[]>();
    for (const p of allProfiles) {
      const arr = profilesByUser.get(p.user_id) || [];
      arr.push(p);
      profilesByUser.set(p.user_id, arr);
    }

    // Follow events per profile
    const feByProfile = new Map<string, number>();
    if (followEventsCountRes.data) {
      for (const fe of followEventsCountRes.data) {
        feByProfile.set(
          fe.tracked_profile_id,
          (feByProfile.get(fe.tracked_profile_id) || 0) + 1
        );
      }
    }

    const users = allUsers.map((u: any) => {
      const sub = subsMap.get(u.id);
      const userProfiles = profilesByUser.get(u.id) || [];
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        plan: proUserIds.has(u.id) ? "pro" : "free",
        subscription_status: sub?.status || null,
        current_period_end: sub?.current_period_end || null,
        tracked_profiles_count: userProfiles.length,
        spy_profiles_count: userProfiles.filter((p: any) => p.has_spy).length,
        api_calls_today: userCallCounts[u.id] || 0,
        api_calls_month: monthlyUserCallCounts[u.id] || 0,
        total_follow_events: userProfiles.reduce(
          (sum: number, p: any) => sum + (feByProfile.get(p.id) || 0),
          0
        ),
        last_active: userProfiles.reduce((latest: string | null, p: any) => {
          if (!p.last_scanned_at) return latest;
          if (!latest) return p.last_scanned_at;
          return p.last_scanned_at > latest ? p.last_scanned_at : latest;
        }, null),
      };
    });

    // Build profile list
    const userEmailMap = new Map(allUsers.map((u: any) => [u.id, u.email]));
    const profiles = allProfiles.map((p: any) => ({
      id: p.id,
      instagram_username: p.username,
      owner_email: userEmailMap.get(p.user_id) || "unknown",
      has_spy: p.has_spy || false,
      baseline_complete: p.baseline_complete || false,
      following_count: p.following_count || 0,
      follower_count: p.follower_count || 0,
      last_scanned_at: p.last_scanned_at,
      follow_events_count: feByProfile.get(p.id) || 0,
      is_private: p.is_private || false,
    }));

    // Recent calls with profile username
    const profileIdMap = new Map(allProfiles.map((p: any) => [p.id, p.username]));
    const recentCalls = (apiRecentRes.data || []).map((c: any) => ({
      created_at: c.created_at,
      function_name: c.function_name,
      profile_username: c.profile_id ? profileIdMap.get(c.profile_id) || null : null,
      status_code: c.status_code,
    }));

    const dailyBudget = parseInt(Deno.env.get("MAX_DAILY_API_CALLS") || "2000");

    // 7-day average
    const avgDailyCalls = ((sevenDayRes.count || 0) / 7);
    const projectedMonthlyCost = avgDailyCalls * 30 * COST_PER_CALL;

    // Monthly calls by user (top-level for easy access)
    const monthlyCallsByUser = Object.entries(monthlyUserCallCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    const response = {
      totalUsers: allUsers.length,
      proUsers,
      freeUsers: allUsers.length - proUsers,
      totalTrackedProfiles: allProfiles.length,
      totalSpyProfiles: allProfiles.filter((p: any) => p.has_spy).length,
      apiCallsToday,
      apiCostToday: +(apiCallsToday * COST_PER_CALL).toFixed(4),
      apiCallsThisMonth,
      apiCostThisMonth: +(apiCallsThisMonth * COST_PER_CALL).toFixed(4),
      callsByFunction,
      callsPerHour,
      users,
      profiles,
      recentCalls,
      dailyBudget,
      budgetUsed: apiCallsToday,
      budgetRemaining: dailyBudget - apiCallsToday,
      projectedMonthlyCost: +projectedMonthlyCost.toFixed(2),
      avgDailyCalls: Math.round(avgDailyCalls),
      dailyBreakdown,
      monthlyCallsByUser,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-stats error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
