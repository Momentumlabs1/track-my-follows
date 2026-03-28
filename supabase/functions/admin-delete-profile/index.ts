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

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Delete all related data
    await admin
      .from("follow_events")
      .delete()
      .eq("tracked_profile_id", profileId);
    await admin
      .from("follower_events")
      .delete()
      .eq("profile_id", profileId);
    await admin
      .from("profile_followings")
      .delete()
      .eq("tracked_profile_id", profileId);
    await admin
      .from("profile_followers")
      .delete()
      .eq("tracked_profile_id", profileId);
    await admin
      .from("unfollow_checks")
      .delete()
      .eq("tracked_profile_id", profileId);
    await admin
      .from("tracked_profiles")
      .delete()
      .eq("id", profileId);

    return new Response(
      JSON.stringify({ success: true, deletedProfileId: profileId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-delete-profile error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
