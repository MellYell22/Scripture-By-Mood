import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

// Lazy Stripe initialization to avoid top-level crashes
let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("[StripeAPI] STRIPE_SECRET_KEY is missing from environment variables");
      return null;
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as any,
    });
  }
  return stripeInstance;
}

// Supabase configuration for server-side (using Service Role Key for admin access)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Stripe Webhook - MUST be before express.json()
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = getStripe();
  console.log(`[StripeWebhook] >>> START: Received webhook event.`);

  if (!stripe) {
    console.error("[StripeWebhook] ERROR: Stripe is not configured.");
    return res.status(500).json({ error: "Stripe is not configured on the server." });
  }

  if (!sig || !webhookSecret) {
    console.error("[StripeWebhook] ERROR: Stripe webhook configuration missing (signature or secret).");
    return res.status(400).json({ error: "Webhook Error: Configuration missing" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`[StripeWebhook] Event Type: ${event.type}`);
  } catch (err: any) {
    console.error(`[StripeWebhook] ERROR: Verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const priceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.priceId;

        console.log(`[StripeWebhook] Checkout completed. User: ${userId}, Price: ${priceId}`);

        if (userId && supabase) {
          let tier = "free";
          const plusPriceId = process.env.STRIPE_PRICE_ID_PLUS || process.env.VITE_STRIPE_PRICE_ID_PLUS;
          const proPriceId = process.env.STRIPE_PRICE_ID_PRO || process.env.VITE_STRIPE_PRICE_ID_PRO;

          if (priceId === plusPriceId) tier = "plus";
          else if (priceId === proPriceId) tier = "pro";
          else {
            console.warn(`[StripeWebhook] Unknown priceId: ${priceId}. Defaulting to free or check mapping.`);
          }

          console.log(`[StripeWebhook] Updating user ${userId} to tier: ${tier}`);

          const { error } = await supabase
            .from("profiles")
            .update({ 
              subscription_tier: tier,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq("id", userId);
          
          if (error) {
            console.error(`[StripeWebhook] Supabase Update Error: ${error.message}`);
            throw error;
          }
          console.log(`[StripeWebhook] Successfully updated user ${userId} to ${tier}`);
        } else {
          console.error(`[StripeWebhook] ERROR: Missing userId (${userId}) or Supabase client (${!!supabase})`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`[StripeWebhook] Subscription deleted for customer: ${customerId}`);

        if (supabase) {
          // Find user by customer ID and downgrade
          const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error(`[StripeWebhook] Supabase Fetch Error: ${fetchError.message}`);
          } else if (profile) {
            console.log(`[StripeWebhook] Resetting user ${profile.id} to free tier.`);
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ 
                subscription_tier: "free",
                updated_at: new Date().toISOString()
              })
              .eq("id", profile.id);
            
            if (updateError) console.error(`[StripeWebhook] Supabase Update Error: ${updateError.message}`);
          } else {
            console.warn(`[StripeWebhook] No profile found for customerId: ${customerId}`);
          }
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error(`[StripeWebhook] Unexpected Error: ${err.message}`);
    console.error(`[StripeWebhook] Stack Trace: ${err.stack}`);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    stripeConfigured: !!getStripe(),
    supabaseConfigured: !!supabase,
    env: process.env.NODE_ENV,
    appUrl: process.env.APP_URL || "not set"
  });
});

// 404 for API routes - MUST be after all API routes
app.all("/api/*", (req, res) => {
  console.warn(`[Server] 404 on API route: ${req.method} ${req.url}`);
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global Error Handler - Ensures JSON response for all errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Server Error] ${err.stack || err.message}`);
  res.status(err.status || 500).json({ 
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred"
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`APP_URL: ${process.env.APP_URL || "not set (defaulting to localhost:3000)"}`);
      console.log(`Stripe Configured: ${!!getStripe()}`);
      console.log(`Supabase Configured: ${!!supabase}`);
    });
  }
}

startServer();
