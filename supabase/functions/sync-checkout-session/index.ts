import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_PRO_PRICE_ID = "price_1TRTQuGDw0P2L0A1MsgZiMeM";
const isPaidSubscription = (status: string) => status === "active" || status === "trialing";

const response = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!authHeader || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeSecretKey) {
      console.error("[sync-checkout-session] Missing required configuration or authorization.");
      return response({ error: "Unable to verify checkout because the server is not configured." }, 500);
    }

    const { sessionId } = await req.json();
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return response({ error: "Invalid Stripe Checkout Session ID." }, 400);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return response({ error: "Your sign-in session is no longer valid. Please sign in again." }, 401);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const checkoutUserId = checkout.client_reference_id || checkout.metadata?.userId || checkout.metadata?.user_id;

    if (checkout.mode !== "subscription" || checkoutUserId !== user.id) {
      console.warn(`[sync-checkout-session] Checkout ${sessionId} does not belong to user ${user.id}.`);
      return response({ error: "This checkout cannot be used to update this account." }, 403);
    }

    if (checkout.payment_status !== "paid" || !checkout.subscription) {
      return response({ error: "Stripe has not confirmed this payment yet. Please try again shortly." }, 409);
    }

    const subscriptionId = checkout.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO") || DEFAULT_PRO_PRICE_ID;

    if (priceId !== proPriceId || !isPaidSubscription(subscription.status)) {
      console.warn(`[sync-checkout-session] Checkout ${sessionId} is not an active Pro subscription.`);
      return response({ error: "This checkout did not create an active Pro subscription." }, 409);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: updateError } = await serviceClient
      .from("profiles")
      .update({
        subscription_tier: "pro",
        subscription_status: "active",
        plan: "pro",
        stripe_customer_id: checkout.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_price_id: priceId,
        stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, subscription_tier")
      .maybeSingle();

    if (updateError) {
      console.error("[sync-checkout-session] Failed to save entitlement:", updateError.message);
      return response({ error: "Stripe confirmed your payment, but we could not save your access yet." }, 500);
    }

    if (!profile) {
      console.error(`[sync-checkout-session] No profile found for user ${user.id}.`);
      return response({ error: "We could not find a profile for this signed-in account." }, 404);
    }

    console.log(`[sync-checkout-session] Pro access activated for ${user.id}.`);
    return response({ subscriptionTier: "pro" });
  } catch (error: any) {
    console.error("[sync-checkout-session] Unexpected error:", error?.message || error);
    return response({ error: "Unable to verify your checkout right now. Please try again shortly." }, 500);
  }
});
