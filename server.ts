import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Supabase configuration for server-side (using Service Role Key for admin access)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function startServer() {
  // Stripe Webhook
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret || !sig) {
      console.error("Stripe webhook configuration missing");
      return res.status(400).send("Webhook Error: Configuration missing");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          const priceId = session.line_items?.data?.[0]?.price?.id || (session as any).metadata?.priceId;

          console.log(`[StripeWebhook] Checkout completed for user: ${userId}, priceId: ${priceId}`);

          if (userId && supabase) {
            let tier = "free";
            const plusPriceId = process.env.VITE_STRIPE_PRICE_ID_PLUS || process.env.STRIPE_PRICE_ID_PLUS;
            const proPriceId = process.env.VITE_STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID_PRO;

            if (priceId === plusPriceId) tier = "plus";
            if (priceId === proPriceId) tier = "pro";

            console.log(`[StripeWebhook] Updating user ${userId} to tier: ${tier}`);

            const { error } = await supabase
              .from("profiles")
              .update({ subscription_tier: tier })
              .eq("id", userId);
            
            if (error) console.error(`[StripeWebhook] Supabase error: ${error.message}`);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          if (supabase) {
            // Find user by customer ID and downgrade
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .single();

            if (profile) {
              await supabase
                .from("profiles")
                .update({ subscription_tier: "free" })
                .eq("id", profile.id);
            }
          }
          break;
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error(`Database Error: ${err.message}`);
      res.status(500).send("Internal Server Error");
    }
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session Creation
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, userId } = req.body;
    
    console.log(`[StripeAPI] Received request for checkout session. User: ${userId}, Price: ${priceId}`);

    if (!stripe) {
      console.error("[StripeAPI] Stripe is not configured on the server");
      return res.status(500).json({ error: "Stripe is not configured on the server" });
    }

    if (!priceId) {
      console.error("[StripeAPI] Missing priceId in request");
      return res.status(400).json({ error: "Missing priceId" });
    }

    if (!userId) {
      console.error("[StripeAPI] Missing userId in request");
      return res.status(400).json({ error: "Missing userId" });
    }

    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      // Ensure no trailing slash for consistency
      const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

      console.log(`[StripeAPI] Creating session with baseUrl: ${baseUrl}`);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/profile?success=true`,
        cancel_url: `${baseUrl}/profile?canceled=true`,
        client_reference_id: userId,
        metadata: {
          userId,
          priceId
        }
      });
      
      console.log(`[StripeAPI] Session created: ${session.id}`);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error(`[StripeAPI] Stripe Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
