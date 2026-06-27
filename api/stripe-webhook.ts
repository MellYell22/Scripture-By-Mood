import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: "2023-10-16" as any });
};

import { buffer } from "micro";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const stripe = getStripe();
    const buf = await buffer(req);

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("✅ Webhook verified:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 🔥 HANDLE EVENTS
    switch (event.type) {
      case "checkout.session.completed":
      case "invoice.paid":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const data = event.data.object as any;

        const userId =
          data?.metadata?.userId ||
          data?.metadata?.user_id ||
          data?.client_reference_id;

        console.log("👤 Found userId:", userId);

        if (userId) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // Protect owner tier — never overwrite
          const { data: existing } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", userId)
            .single();

          if (existing?.subscription_tier === "owner") {
            console.log("👑 Owner tier preserved for userId:", userId);
            break;
          }

          const { data: updated, error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "pro",
              subscription_status: "active",
              stripe_subscription_status: "active",
            })
            .eq("id", userId)
            .select();

          if (error) {
            console.error("❌ Supabase update failed:", error);
            throw error; // Let Stripe retry
          }

          if (!updated || updated.length === 0) {
            console.error("❌ 0 rows updated for userId:", userId, "— Stripe will retry");
            throw new Error(`Profile not found for userId: ${userId}`);
          }

          console.log("✅ User upgraded to PRO:", userId);
        } else {
          console.error("❌ No userId found in metadata");
        }

        break;
      }

      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const data = event.data.object as any;

        const userId =
          data?.metadata?.userId ||
          data?.metadata?.user_id ||
          data?.client_reference_id;

        if (userId) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // Protect owner tier — never downgrade
          const { data: existing } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", userId)
            .single();

          if (existing?.subscription_tier === "owner") {
            console.log("👑 Owner tier preserved during downgrade event for userId:", userId);
            break;
          }

          const { data: updated, error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              subscription_status: "inactive",
            })
            .eq("id", userId)
            .select();

          if (error) {
            console.error("❌ Downgrade update failed:", error);
            throw error;
          }

          if (!updated || updated.length === 0) {
            console.error("❌ 0 rows updated on downgrade for userId:", userId, "— Stripe will retry");
            throw new Error(`Profile not found for userId: ${userId}`);
          }

          console.log("⬇️ User downgraded:", userId);
        }

        break;
      }

      default:
        console.log("Unhandled event:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook processing error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
