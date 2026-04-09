import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

    const { plan, user_id, success_url, cancel_url } = await req.json();

    if (!plan || !user_id) {
      return new Response(JSON.stringify({ error: "plan and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceMap: Record<string, string | undefined> = {
      basic_weekly: Deno.env.get("STRIPE_PRICE_BASIC_WEEKLY"),
      pro_weekly: Deno.env.get("STRIPE_PRICE_PRO_WEEKLY"),
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Unknown plan: ${plan}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user_id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || "https://spy-secret.com/dashboard?checkout=success",
      cancel_url: cancel_url || "https://spy-secret.com/dashboard?checkout=cancel",
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-checkout] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
