import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory store for verification codes (in production, use Redis or Firestore)
// We'll use Firestore for persistence
const VERIFICATION_COLLECTION = "emailVerifications";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid email" },
        { status: 400 }
      );
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code in Firestore via REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const authEmail = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL;
    const authPassword = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    // Get Firebase auth token
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
    const idToken = authData.idToken;

    // Store verification code in Firestore
    const docId = email.replace(/[^a-zA-Z0-9]/g, "_");
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${VERIFICATION_COLLECTION}/${docId}?key=${apiKey}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            email: { stringValue: email },
            code: { stringValue: code },
            expiresAt: { integerValue: expiresAt.toString() },
            verified: { booleanValue: false },
          },
        }),
      }
    );

    // Send verification email via Resend
    const { error } = await resend.emails.send({
      from: "HomeMaid <ashok+homemaid@jaiswals.live>",
      to: [email],
      subject: "Your HomeMaid Verification Code 🔐",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px;">🍲</span>
            <h1 style="color: #ea580c; margin: 10px 0 0;">HomeMaid</h1>
          </div>
          <div style="background: #fff7ed; padding: 30px; border-radius: 12px; text-align: center;">
            <h2 style="color: #333; margin: 0 0 10px;">Your Verification Code</h2>
            <p style="color: #666; margin: 0 0 20px;">Enter this code to verify your email address:</p>
            <div style="background: white; display: inline-block; padding: 16px 40px; border-radius: 12px; border: 2px dashed #ea580c;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #ea580c;">${code}</span>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 20px;">
              This code expires in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            <p>© 2026 HomeMaid. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Verification email error:", error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    console.log("[Auth] Verification code sent to:", email);
    return NextResponse.json({ success: true, message: "Verification code sent" });
  } catch (err: any) {
    console.error("[Auth] send-verification error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}
