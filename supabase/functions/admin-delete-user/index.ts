import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@spy-secret.com";

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

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Don't allow deleting the admin
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete admin account" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get all tracked profiles for this user
    const { data: profiles } = await admin
      .from("tracked_profiles")
      .select("id")
      .eq("user_id", userId);

    const profileIds = (profiles || []).map((p: any) => p.id);

    if (profileIds.length > 0) {
      // Delete related data for all profiles
      await admin
        .from("follow_events")
        .delete()
        .in("tracked_profile_id", profileIds);
      await admin
        .from("follower_events")
        .delete()
        .in("profile_id", profileIds);
      await admin
        .from("profile_followings")
        .delete()
        .in("tracked_profile_id", profileIds);
      await admin
        .from("profile_followers")
        .delete()
        .in("tracked_profile_id", profileIds);
      await admin
        .from("unfollow_checks")
        .delete()
        .in("tracked_profile_id", profileIds);
    }

    // Delete user-level data
    await admin.from("tracked_profiles").delete().eq("user_id", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);
    await admin.from("user_settings").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("user_id", userId);

    // Delete from auth
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete auth user: " + deleteError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, deletedUserId: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-delete-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
