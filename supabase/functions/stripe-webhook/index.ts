import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripe = new Stripe(stripeSecretKey!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        let priceId = session.metadata?.priceId;

        console.log(`[Webhook] Checkout completed. User: ${userId}, Price (from metadata): ${priceId}`);

        if (!priceId) {
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            priceId = lineItems.data[0]?.price?.id;
            console.log(`[Webhook] Price from line items: ${priceId}`);
          } catch (err) {
            console.error(`[Webhook] Failed to fetch line items: ${err}`);
          }
        }

        if (userId && priceId) {
          let tier = "free";
          const plusPriceId = Deno.env.get("STRIPE_PRICE_ID_PLUS");
          const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO");

          console.log(`[Webhook] Comparing prices - Input: ${priceId}, Plus: ${plusPriceId}, Pro: ${proPriceId}`);

          if (priceId === plusPriceId) {
            tier = "plus";
          } else if (priceId === proPriceId) {
            tier = "pro";
          } else {
            console.warn(`[Webhook] Unknown priceId: ${priceId}. Defaulting to free.`);
          }

          console.log(`[Webhook] Updating user ${userId} to tier: ${tier}`);

          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error(`[Webhook] Supabase Error: ${error.message}`);
            throw error;
          }
          console.log(`[Webhook] ✓ Successfully updated user ${userId} to ${tier}`);
        } else {
          console.error(`[Webhook] ERROR - Missing userId (${userId}) or priceId (${priceId})`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id;

        console.log(`[Webhook] Subscription updated. Customer: ${customerId}, Price: ${priceId}`);

        if (customerId) {
          const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error(`[Webhook] Fetch Error: ${fetchError.message}`);
          } else if (profile && priceId) {
            let tier = "free";
            const plusPriceId = Deno.env.get("STRIPE_PRICE_ID_PLUS");
            const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO");

            if (priceId === plusPriceId) tier = "plus";
            else if (priceId === proPriceId) tier = "pro";

            console.log(`[Webhook] Updating user ${profile.id} to tier: ${tier}`);

            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                subscription_tier: tier,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id);

            if (updateError) {
              console.error(`[Webhook] Update Error: ${updateError.message}`);
            } else {
              console.log(`[Webhook] ✓ Successfully updated user ${profile.id} to ${tier}`);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`[Webhook] Subscription deleted for customer: ${customerId}`);

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (fetchError) {
          console.error(`[Webhook] Fetch Error: ${fetchError.message}`);
        } else if (profile) {
          console.log(`[Webhook] Resetting user ${profile.id} to free tier`);
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (updateError) {
            console.error(`[Webhook] Update Error: ${updateError.message}`);
          } else {
            console.log(`[Webhook] ✓ Successfully reset user ${profile.id} to free`);
          }
        } else {
          console.warn(`[Webhook] No profile found for customerId: ${customerId}`);
        }
        break;
      }

      case "invoice.paid": {
        // Handle recurring invoice payments
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`[Webhook] Invoice paid for customer: ${customerId}`);

        if (customerId && invoice.paid) {
          const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error(`[Webhook] Fetch Error: ${fetchError.message}`);
          } else if (profile) {
            // Get subscription to find current tier
            try {
              const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                limit: 1,
              });

              const subscription = subscriptions.data[0];
              const priceId = subscription?.items?.data?.[0]?.price?.id;

              if (priceId) {
                let tier = "free";
                const plusPriceId = Deno.env.get("STRIPE_PRICE_ID_PLUS");
                const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO");

                if (priceId === plusPriceId) tier = "plus";
                else if (priceId === proPriceId) tier = "pro";

                console.log(`[Webhook] Invoice paid - user ${profile.id}, tier: ${tier}`);

                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({
                    subscription_tier: tier,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", profile.id);

                if (updateError) {
                  console.error(`[Webhook] Update Error: ${updateError.message}`);
                } else {
                  console.log(`[Webhook] ✓ Invoice paid - user ${profile.id} tier maintained as ${tier}`);
                }
              }
            } catch (err) {
              console.error(`[Webhook] Failed to fetch subscription: ${err}`);
            }
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error(`[Webhook] Error processing event: ${err.message}`);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
