import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { stripeCustomerId, returnUrl } = await req.json();

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing stripeCustomerId" },
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

    const baseUrl = returnUrl || process.env.NEXT_PUBLIC_APP_URL || "https://annapurna-eight.vercel.app";

    const params = new URLSearchParams();
    params.append("customer", stripeCustomerId);
    params.append("return_url", `${baseUrl}/settings`);

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (session.error) {
      console.error("[Stripe] Portal error:", session.error);
      return NextResponse.json(
        { error: session.error.message || "Failed to create portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] portal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
