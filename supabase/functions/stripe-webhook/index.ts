import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe secrets not configured");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const BASIC_PRICE = Deno.env.get("STRIPE_PRICE_BASIC_WEEKLY");
    const PRO_PRICE = Deno.env.get("STRIPE_PRICE_PRO_WEEKLY");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId) {
          console.warn("[stripe-webhook] No client_reference_id in session");
          break;
        }

        // Get subscription details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        const planType = priceId === BASIC_PRICE ? "basic" : "pro";
        const maxProfiles = 4;

        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const periodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null;

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan_type: planType,
          status: "active",
          max_tracked_profiles: maxProfiles,
          store: "stripe",
          billing_period: "weekly",
          current_period_start: periodStart,
          current_period_end: periodEnd,
        }, { onConflict: "user_id" });

        console.log(`[stripe-webhook] User ${userId} upgraded to ${planType}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        
        // Find user by checking subscriptions table for stripe customer
        // For now, use metadata or client_reference_id approach
        const priceId = sub.items.data[0]?.price?.id;
        const planType = priceId === BASIC_PRICE ? "basic" : "pro";
        const status = sub.status === "active" ? "active" : 
                       sub.status === "trialing" ? "in_trial" :
                       sub.status === "canceled" ? "canceled" : "expired";

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        // Update by matching the store + looking up
        console.log(`[stripe-webhook] Subscription updated: ${sub.id}, status: ${status}, plan: ${planType}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] Subscription deleted: ${sub.id}`);
        // Will be handled by the subscription expiry cleanup in smart-scan
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
