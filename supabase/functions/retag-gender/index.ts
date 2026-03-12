// retag-gender — one-time function to re-evaluate all "unknown" gender_tags
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { detectGender } from "../_shared/genderDetection.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Optional: restrict to a specific profile
    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    // Load all unknown-tagged followings that have a display name
    let query = supabase
      .from("profile_followings")
      .select("id, tracked_profile_id, following_display_name, following_username, gender_tag")
      .eq("gender_tag", "unknown")
      .eq("is_current", true)
      .limit(5000);

    if (profileId) {
      query = query.eq("tracked_profile_id", profileId);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ message: "No unknown entries to retag", retagged: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[retag-gender] Processing ${rows.length} unknown entries...`);

    // Track per-profile gender count changes
    const profileDeltas: Record<string, { female: number; male: number; unknown: number }> = {};
    let retagged = 0;

    for (const row of rows) {
      const newGender = detectGender(row.following_display_name);
      if (newGender === "unknown") continue;

      // Update the row
      await supabase
        .from("profile_followings")
        .update({ gender_tag: newGender })
        .eq("id", row.id);

      retagged++;
      const pid = row.tracked_profile_id;
      if (!profileDeltas[pid]) profileDeltas[pid] = { female: 0, male: 0, unknown: 0 };
      profileDeltas[pid][newGender as "female" | "male"]++;
      profileDeltas[pid].unknown--;
    }

    // Update aggregated counts on tracked_profiles
    for (const [pid, delta] of Object.entries(profileDeltas)) {
      const { data: profile } = await supabase
        .from("tracked_profiles")
        .select("gender_female_count, gender_male_count, gender_unknown_count")
        .eq("id", pid)
        .single();

      if (profile) {
        await supabase.from("tracked_profiles").update({
          gender_female_count: Math.max(0, (profile.gender_female_count ?? 0) + delta.female),
          gender_male_count: Math.max(0, (profile.gender_male_count ?? 0) + delta.male),
          gender_unknown_count: Math.max(0, (profile.gender_unknown_count ?? 0) + delta.unknown),
        }).eq("id", pid);
      }
    }

    console.log(`[retag-gender] Done! Retagged ${retagged}/${rows.length} entries across ${Object.keys(profileDeltas).length} profiles`);

    return new Response(JSON.stringify({
      success: true,
      total_processed: rows.length,
      retagged,
      profiles_updated: Object.keys(profileDeltas).length,
      deltas: profileDeltas,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[retag-gender] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
