import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RevenueCatEvent = {
  app_user_id?: string;
  original_app_user_id?: string;
  type?: string;
  product_id?: string;
  new_product_id?: string;
  expiration_at_ms?: number;
  store?: string;
  transferred_to?: string[];
};

function getBillingPeriod(productId: string): string | null {
  if (productId.includes("weekly")) return "weekly";
  if (productId.includes("monthly")) return "monthly";
  if (productId.includes("yearly")) return "yearly";
  return null;
}

function resolveUserId(event: RevenueCatEvent): string | null {
  if (event.app_user_id) return event.app_user_id;
  if (event.original_app_user_id) return event.original_app_user_id;
  if (Array.isArray(event.transferred_to) && event.transferred_to.length > 0) {
    return event.transferred_to[0];
  }
  return null;
}

async function upsertProSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  billingPeriod: string | null,
  store: string | null,
  expirationMs?: number,
) {
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
    const event = body.event as RevenueCatEvent;
    if (!event) {
      return new Response(JSON.stringify({ error: "No event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const userId = resolveUserId(event);
    const eventType = event.type;
    const productId = event.product_id || event.new_product_id || "";
    const expirationMs = event.expiration_at_ms;
    const store = event.store === "APP_STORE" ? "apple" : event.store === "PLAY_STORE" ? "google" : event.store;
    const billingPeriod = getBillingPeriod(productId);

    console.log(`RevenueCat webhook: ${eventType} for ${userId}, product: ${productId}`);

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "NON_RENEWING_PURCHASE": {
        if (!userId) break;
        await upsertProSubscription(supabase, userId, billingPeriod, store, expirationMs);
        break;
      }

      case "RENEWAL": {
        if (!userId) break;
        await upsertProSubscription(supabase, userId, billingPeriod, store, expirationMs);
        break;
      }

      case "PRODUCT_CHANGE": {
        if (!userId) break;
        await upsertProSubscription(supabase, userId, billingPeriod, store, expirationMs);
        break;
      }

      case "UNCANCELLATION": {
        if (!userId) break;
        await upsertProSubscription(supabase, userId, billingPeriod, store, expirationMs);
        break;
      }

      case "TRANSFER": {
        const transferredToUserId = Array.isArray(event.transferred_to) ? event.transferred_to[0] : null;
        if (!transferredToUserId) break;
        await upsertProSubscription(supabase, transferredToUserId, billingPeriod, store, expirationMs);
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
