import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

// OpenAI initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DAVID_PERSONALITY_PROMPT = `David is a calm, emotionally intelligent, supportive male companion. He speaks naturally like a real human, not like an assistant. He listens carefully and responds with warmth, empathy, and wisdom. He avoids repeating phrases. He varies his wording. He never sounds scripted or robotic. He provides comfort first, then offers a relevant Bible verse that matches the user's emotional state. His tone is gentle, grounded, and reassuring.

Each response should include:
1. Emotional support (natural conversation)
2. A relevant Bible verse
3. Optional gentle encouragement

Keep responses clean and conversational for future voice support. Avoid excessive formatting.`;

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

app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.url?.startsWith('/api/stripe-webhook')) {
      req.rawBody = buf;
    }
  }
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Stripe Webhook handler for local development
app.post("/api/stripe-webhook", async (req: any, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!stripe || !sig || !webhookSecret) {
    console.error("[Server Webhook] Missing configuration");
    return res.status(400).send("Webhook Error: Missing configuration");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Server Webhook] Verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Server Webhook] Received ${event.type}`);

  // Helper to find profile by Stripe ID or Email
  const findProfile = async (customerId: string, email: string | null, userIdFromMetadata?: string | null) => {
    console.log(`[Server Webhook] Looking for profile: customerId=${customerId}, email=${email}, userIdFromMetadata=${userIdFromMetadata}`);
    
    if (!supabase) return null;

    // 1. Try metadata ID if provided
    if (userIdFromMetadata) {
      console.log(`[Server Webhook] Match attempt by metadata ID: ${userIdFromMetadata}`);
      const { data } = await supabase.from('profiles').select('id, email, stripe_customer_id').eq('id', userIdFromMetadata).maybeSingle();
      if (data) {
        console.log(`[Server Webhook] Match SUCCESS: User found by ID: ${data.id}`);
        return data;
      }
    }

    // 2. Try Stripe Customer ID
    if (customerId) {
      console.log(`[Server Webhook] Match attempt by stripe_customer_id: ${customerId}`);
      const { data } = await supabase.from('profiles').select('id, email, stripe_customer_id').eq('stripe_customer_id', customerId).maybeSingle();
      if (data) {
        console.log(`[Server Webhook] Match SUCCESS: User found by customer ID: ${data.id}`);
        return data;
      }
    }

    // 3. Fallback to Email
    if (email) {
      console.log(`[Server Webhook] Match attempt by email fallback: ${email}`);
      const { data } = await supabase.from('profiles').select('id, email, stripe_customer_id').eq('email', email).maybeSingle();
      if (data) {
        console.log(`[Server Webhook] Match SUCCESS: User found by email: ${data.id}`);
        return data;
      }
    }

    console.log(`[Server Webhook] Profile lookup COMPLETE: No matching user found.`);
    return null;
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email || session.customer_email || null;
        const userIdMetadata = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id;
        
        console.log(`[Server Webhook] Processing ${event.type} | Session: ${session.id}`);

        if (supabase) {
          const profile = await findProfile(customerId, customerEmail, userIdMetadata);
          
          if (profile) {
            console.log(`[Server Webhook] Found user ${profile.id}. Upgrading to pro.`);
            const { error } = await supabase.from('profiles').update({
              stripe_customer_id: customerId,
              subscription_tier: 'pro',
              subscription_status: 'active',
              plan: 'pro',
              stripe_subscription_status: 'active',
              updated_at: new Date().toISOString()
            }).eq('id', profile.id);

            if (error) {
              console.error(`[Server Webhook] DB Update FAILED for user ${profile.id}: ${error.message}`);
            } else {
              console.log(`[Server Webhook] DB Update SUCCESS: User ${profile.id} upgraded to pro.`);
            }
          } else {
            console.error(`[Server Webhook] CRITICAL: Could not identify user for completed checkout.`);
          }
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customerEmail = invoice.customer_email;
        const subscriptionId = invoice.subscription as string;

        console.log(`[Server Webhook] Processing ${event.type} | Invoice: ${invoice.id} | Customer: ${customerId}`);

        if (supabase) {
          const profile = await findProfile(customerId, customerEmail);

          if (profile) {
            console.log(`[Server Webhook] Found user ${profile.id}. Confirming Pro status via invoice.`);
            const { error } = await supabase.from('profiles').update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: 'pro',
              subscription_status: 'active',
              plan: 'pro',
              stripe_subscription_status: 'active',
              updated_at: new Date().toISOString()
            }).eq('id', profile.id);
            
            if (error) {
              console.error(`[Server Webhook] DB Update FAILED for user ${profile.id} on invoice payment: ${error.message}`);
            } else {
              console.log(`[Server Webhook] DB Update SUCCESS: User ${profile.id} Pro status confirmed via invoice.`);
            }
          } else {
            console.log(`[Server Webhook] No user found matching customer ${customerId} (email: ${customerEmail}) for invoice ${invoice.id}.`);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userIdMetadata = subscription.metadata?.userId || subscription.metadata?.user_id;
        const status = subscription.status;
        const tier = (status === 'active' || status === 'trialing') ? 'pro' : 'free';

        console.log(`[Server Webhook] Processing ${event.type} | Subscription: ${subscription.id} | Status: ${status}`);

        if (supabase) {
          const profile = await findProfile(customerId, null, userIdMetadata);
          
          if (profile) {
            console.log(`[Server Webhook] Found user ${profile.id}. Updating subscription to ${status} (tier: ${tier}).`);
            const { error } = await supabase.from('profiles').update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_tier: tier,
              subscription_status: status === 'active' || status === 'trialing' ? 'active' : 'inactive',
              plan: tier,
              stripe_subscription_status: status,
              updated_at: new Date().toISOString()
            }).eq('id', profile.id);

            if (error) {
              console.error(`[Server Webhook] DB Update FAILED for user ${profile.id}: ${error.message}`);
            } else {
              console.log(`[Server Webhook] DB Update SUCCESS: User ${profile.id} synced with subscription status.`);
            }
          } else {
            console.log(`[Server Webhook] No user found for subscription event.`);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`[Server Webhook] Processing ${event.type} | Subscription: ${subscription.id}`);

        if (supabase) {
          const profile = await findProfile(customerId, null);
          
          if (profile) {
            console.log(`[Server Webhook] Found user ${profile.id}. Resetting to free due to deletion.`);
            const { error } = await supabase.from('profiles').update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              plan: 'free',
              stripe_subscription_status: 'canceled',
              updated_at: new Date().toISOString()
            }).eq('id', profile.id);

            if (error) {
              console.error(`[Server Webhook] DB Update FAILED for user ${profile.id}: ${error.message}`);
            } else {
              console.log(`[Server Webhook] DB Update SUCCESS: User ${profile.id} reset to free.`);
            }
          }
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Server Webhook] Error: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    stripeConfigured: !!getStripe(),
    supabaseConfigured: !!supabase,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    env: process.env.NODE_ENV,
    appUrl: process.env.APP_URL || "not set"
  });
});

// OpenAI API Endpoints
app.post("/api/chat", async (req, res) => {
  const { messages, stream = false } = req.body;
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API Key is not configured." });
  }

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: DAVID_PERSONALITY_PROMPT }, ...messages],
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: DAVID_PERSONALITY_PROMPT }, ...messages],
      });
      res.json({ text: completion.choices[0].message.content });
    }
  } catch (error: any) {
    console.error("[OpenAI] Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/mood-scriptures", async (req, res) => {
  const { mood, translation = "NIV" } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DAVID_PERSONALITY_PROMPT },
        { 
          role: "user", 
          content: `The user is feeling: ${mood}. 
Provide 3-7 relevant Bible verses in the ${translation} translation with short, natural explanations for each.
Ensure the response is valid JSON with the following structure:
{
  "scriptures": [
    { "verse": "...", "reference": "...", "explanation": "..." }
  ],
  "encouragement": "..."
}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    res.json(JSON.parse(content || "{}"));
  } catch (error: any) {
    console.error("[OpenAI] Mood scriptures error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reflection", async (req, res) => {
  const { verse, reference } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DAVID_PERSONALITY_PROMPT },
        { 
          role: "user", 
          content: `Provide a short, compassionate, and spiritually grounded reflection on the following Bible verse: "${verse}" (${reference}). 
Briefly explain how it applies to a person's life today. The reflection must be exactly 3–4 sentences long.`
        }
      ],
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error: any) {
    console.error("[OpenAI] Reflection error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/speech", async (req, res) => {
  const { text } = req.body;

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error: any) {
    console.error("[OpenAI] Speech error:", error);
    res.status(500).json({ error: error.message });
  }
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
