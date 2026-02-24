import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For webhook signature verification, we need the raw body
    // In production, verify signature with webhookSecret
    // For now, parse the event directly
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log("[Stripe Webhook] Event type:", event.type);

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const authEmail = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL;
    const authPassword = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    // Get Firebase auth token for Firestore writes
    async function getFirebaseToken(): Promise<string> {
      const authRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            returnSecureToken: true,
          }),
        }
      );
      const authData = await authRes.json();
      return authData.idToken;
    }

    async function updateUserTier(userId: string, tier: string, stripeCustomerId?: string, stripeSubscriptionId?: string) {
      const idToken = await getFirebaseToken();
      const fields: any = {
        tier: { stringValue: tier },
        updatedAt: { timestampValue: new Date().toISOString() },
      };
      if (stripeCustomerId) {
        fields.stripeCustomerId = { stringValue: stripeCustomerId };
      }
      if (stripeSubscriptionId) {
        fields.stripeSubscriptionId = { stringValue: stripeSubscriptionId };
      }

      const fieldPaths = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join("&");

      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?${fieldPaths}&key=${apiKey}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ fields }),
        }
      );
      console.log(`[Stripe Webhook] Updated user ${userId} to tier: ${tier}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && tier) {
          await updateUserTier(userId, tier, customerId, subscriptionId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier;

        if (userId && tier && subscription.status === "active") {
          await updateUserTier(userId, tier, subscription.customer, subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await updateUserTier(userId, "free");
          console.log(`[Stripe Webhook] Subscription canceled for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("[Stripe Webhook] Payment failed for:", invoice.customer_email);
        break;
      }

      default:
        console.log("[Stripe Webhook] Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Error:", err);
    return NextResponse.json(
      { error: err.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
