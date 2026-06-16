import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

// Initialize Supabase - using Service Role Key for admin access
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ACTIVE_PRO_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

const getConfiguredProPriceId = () =>
  process.env.STRIPE_PRICE_ID_PRO || process.env.VITE_STRIPE_PRICE_ID_PRO || '';

const requireConfiguredProPriceId = () => {
  const proPriceId = getConfiguredProPriceId();
  if (!proPriceId) {
    throw new Error('STRIPE_PRICE_ID_PRO is not configured; refusing to grant Pro access');
  }
  return proPriceId;
};

const isActiveProSubscription = (priceId?: string | null, status?: string | null) =>
  Boolean(
    priceId &&
    priceId === requireConfiguredProPriceId() &&
    status &&
    ACTIVE_PRO_SUBSCRIPTION_STATUSES.has(status),
  );

const getSubscriptionSyncData = async (subscriptionId?: string | null) => {
  if (!subscriptionId) {
    requireConfiguredProPriceId();
    return {
      tier: 'free',
      status: null,
      priceId: null,
      currentPeriodEnd: null,
    };
  }

  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id || null;
  const status = subscription.status || null;
  const tier = isActiveProSubscription(priceId, status) ? 'pro' : 'free';

  return {
    tier,
    status,
    priceId,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[Stripe Webhook] Error: Missing signature or webhook secret");
    return res.status(400).send('Webhook Error: Missing signature or webhook secret');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error: Verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Helper to find profile by metadata ID, Stripe ID, or Email
  const findProfile = async (customerId: string | null, email: string | null, userIdFromMetadata?: string | null) => {
    console.log(`[Stripe Webhook] Searching for profile: customerId=${customerId}, email=${email}, userIdFromMetadata=${userIdFromMetadata}`);
    
    // 1. Priority 1: User ID from metadata/client_reference_id
    if (userIdFromMetadata) {
      console.log(`[Stripe Webhook] Attempt 1: Look up by ID ${userIdFromMetadata}`);
      const { data, error } = await supabase.from('profiles').select('id, email, subscription_tier').eq('id', userIdFromMetadata).maybeSingle();
      if (data) {
        console.log(`[Stripe Webhook] SUCCESS: Found user by ID: ${data.id}`);
        return data;
      }
      if (error) throw error;
    }

    // 2. Priority 2: Stripe Customer ID
    if (customerId) {
      console.log(`[Stripe Webhook] Attempt 2: Look up by stripe_customer_id ${customerId}`);
      const { data, error } = await supabase.from('profiles').select('id, email, subscription_tier').eq('stripe_customer_id', customerId).maybeSingle();
      if (data) {
        console.log(`[Stripe Webhook] SUCCESS: Found user by customer ID: ${data.id}`);
        return data;
      }
      if (error) throw error;
    }

    // 3. Priority 3: Email Fallback
    if (email) {
      console.log(`[Stripe Webhook] Attempt 3: Look up by email ${email}`);
      const { data, error } = await supabase.from('profiles').select('id, email, subscription_tier').eq('email', email).maybeSingle();
      if (data) {
        console.log(`[Stripe Webhook] SUCCESS: Found user by email: ${data.id}`);
        return data;
      }
      if (error) throw error;
    }

    console.log(`[Stripe Webhook] FAILED: Could not identify profile.`);
    return null;
  };

  const updateProfileOrThrow = async (profileId: string, updateData: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select('id, subscription_tier');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`Profile update for ${profileId} affected 0 rows`);
    }

    return data[0];
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email || session.customer_email || null;
        const userIdMetadata = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id;
        const subscriptionId = session.subscription as string | null;
        
        console.log(`[Stripe Webhook] Processing session ${session.id} for user metadata: ${userIdMetadata}`);

        const profile = await findProfile(customerId, customerEmail, userIdMetadata);

        if (!profile) {
          console.error(`[Stripe Webhook] CRITICAL: Could not resolve profile for checkout session ${session.id}`);
          throw new Error(`Could not resolve profile for checkout session ${session.id}`);
        }

        const subscription = await getSubscriptionSyncData(subscriptionId);
        console.log(`[Stripe Webhook] Syncing checkout profile ${profile.id} to ${subscription.tier}; price=${subscription.priceId || 'none'} status=${subscription.status || 'none'}`);
        const updated = await updateProfileOrThrow(profile.id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_tier: subscription.tier,
          subscription_status: subscription.tier === 'pro' ? 'active' : 'inactive',
          plan: subscription.tier,
          stripe_subscription_status: subscription.status,
          stripe_price_id: subscription.priceId,
          stripe_current_period_end: subscription.currentPeriodEnd,
          updated_at: new Date().toISOString()
        });
        console.log(`[Stripe Webhook] UPDATE SUCCESS: User ${updated.id} tier is ${updated.subscription_tier}.`);
        break;
      }
      
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customerEmail = invoice.customer_email;
        const subscriptionId = invoice.subscription as string;

        console.log(`[Stripe Webhook] Processing invoice ${invoice.id} for customer ${customerId}`);

        const profile = await findProfile(customerId, customerEmail);

        if (!profile) {
          throw new Error(`Could not resolve profile for invoice ${invoice.id}`);
        }

        const subscription = await getSubscriptionSyncData(subscriptionId);
        console.log(`[Stripe Webhook] Confirming subscription for user ${profile.id}: tier=${subscription.tier}, price=${subscription.priceId || 'none'}, status=${subscription.status || 'none'}`);
        const updated = await updateProfileOrThrow(profile.id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_tier: subscription.tier,
          subscription_status: subscription.tier === 'pro' ? 'active' : 'inactive',
          plan: subscription.tier,
          stripe_subscription_status: subscription.status,
          stripe_price_id: subscription.priceId,
          stripe_current_period_end: subscription.currentPeriodEnd,
          updated_at: new Date().toISOString()
        });
        console.log(`[Stripe Webhook] UPDATE SUCCESS: User ${updated.id} tier confirmed as ${updated.subscription_tier}.`);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userIdMetadata = subscription.metadata?.userId || subscription.metadata?.user_id;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price?.id || null;
        const tier = isActiveProSubscription(priceId, status) ? 'pro' : 'free';

        console.log(`[Stripe Webhook] Syncing subscription ${subscription.id} status: ${status}, price=${priceId || 'none'} for user: ${userIdMetadata}`);

        const profile = await findProfile(customerId, null, userIdMetadata);

        if (!profile) {
          throw new Error(`Could not resolve profile for subscription ${subscription.id}`);
        }

        const updated = await updateProfileOrThrow(profile.id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_tier: tier,
          subscription_status: tier === 'pro' ? 'active' : 'inactive',
          plan: tier,
          stripe_subscription_status: status,
          stripe_price_id: priceId,
          stripe_current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString()
        });
        console.log(`[Stripe Webhook] SYNC SUCCESS: User ${updated.id} synchronized to ${updated.subscription_tier}.`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`[Stripe Webhook] Rescinding access for deleted subscription ${subscription.id}`);

        const profile = await findProfile(customerId, null);

        if (!profile) {
          throw new Error(`Could not resolve profile for deleted subscription ${subscription.id}`);
        }

        console.log(`[Stripe Webhook] Reverting user ${profile.id} to Free...`);
        const updated = await updateProfileOrThrow(profile.id, {
          subscription_tier: 'free',
          subscription_status: 'canceled',
          plan: 'free',
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        });
        console.log(`[Stripe Webhook] CANCELLATION SUCCESS: User ${updated.id} downgraded to free.`);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Fatal error processing webhook: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
