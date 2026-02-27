import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getBillingPeriod(productId: string): string | null {
  if (productId.includes("weekly")) return "weekly";
  if (productId.includes("monthly")) return "monthly";
  if (productId.includes("yearly")) return "yearly";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ⚠️ Verify webhook auth (Bearer token from RevenueCat Dashboard)
    const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
    const authHeader = req.headers.get("Authorization");
    if (!expectedAuth || !authHeader || authHeader !== `Bearer ${expectedAuth}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body.event;
    if (!event) {
      return new Response(JSON.stringify({ error: "No event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const userId = event.app_user_id;
    const eventType = event.type;
    const productId = event.product_id || "";
    const expirationMs = event.expiration_at_ms;
    const store = event.store === "APP_STORE" ? "apple" : event.store === "PLAY_STORE" ? "google" : event.store;
    const billingPeriod = getBillingPeriod(productId);

    console.log(`RevenueCat webhook: ${eventType} for ${userId}, product: ${productId}`);

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "NON_RENEWING_PURCHASE": {
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan_type: "pro",
            billing_period: billingPeriod,
            status: "active",
            store,
            revenuecat_app_user_id: userId,
            revenuecat_entitlement: "pro",
            current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
            max_tracked_profiles: 5,
          },
          { onConflict: "user_id" }
        );
        break;
      }

      case "RENEWAL": {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
          })
          .eq("user_id", userId);
        break;
      }

      case "PRODUCT_CHANGE": {
        await supabase
          .from("subscriptions")
          .update({
            billing_period: billingPeriod,
            current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
          })
          .eq("user_id", userId);
        break;
      }

      case "CANCELLATION": {
        // User still has access until current_period_end
        // Just log it, status stays active
        console.log(`Subscription canceled for ${userId}, still active until period end`);
        break;
      }

      case "EXPIRATION": {
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            plan_type: "free",
            max_tracked_profiles: 1,
          })
          .eq("user_id", userId);

        // Deactivate extra profiles (keep oldest)
        const { data: profiles } = await supabase
          .from("tracked_profiles")
          .select("id, created_at")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (profiles && profiles.length > 1) {
          const toDeactivate = profiles.slice(1).map((p) => p.id);
          await supabase
            .from("tracked_profiles")
            .update({ is_active: false })
            .in("id", toDeactivate);
        }
        break;
      }

      case "BILLING_ISSUE": {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);
        break;
      }

      default:
        console.log(`Unhandled RevenueCat event: ${eventType}`);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RevenueCat webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
