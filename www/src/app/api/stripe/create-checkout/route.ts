import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { tier, userId, email, returnUrl } = await req.json();

    if (!tier || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: tier, userId, email" },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const priceId =
      tier === "basic"
        ? process.env.STRIPE_BASIC_PRICE_ID
        : tier === "premium"
        ? process.env.STRIPE_PREMIUM_PRICE_ID
        : null;

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    const baseUrl = returnUrl || process.env.NEXT_PUBLIC_APP_URL || "https://annapurna-eight.vercel.app";

    // Create Stripe Checkout Session via REST API
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("customer_email", email);
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${baseUrl}/settings?canceled=true`);
    params.append("metadata[userId]", userId);
    params.append("metadata[tier]", tier);
    params.append("subscription_data[metadata][userId]", userId);
    params.append("subscription_data[metadata][tier]", tier);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error("[Stripe] Checkout error:", session.error);
      return NextResponse.json(
        { error: session.error.message || "Failed to create checkout session" },
        { status: 500 }
      );
    }

    console.log("[Stripe] Checkout session created:", session.id);
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    console.error("[Stripe] create-checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
