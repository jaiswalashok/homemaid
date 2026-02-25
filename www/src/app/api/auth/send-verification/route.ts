import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
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

    // Store verification code in Firestore using REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const docId = email.replace(/[^a-zA-Z0-9]/g, "_");

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${VERIFICATION_COLLECTION}/${docId}`;
    
    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email },
          code: { stringValue: code },
          expiresAt: { integerValue: expiresAt.toString() },
          verified: { booleanValue: false },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    // Send verification email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@jaiswals.live";
    const { error } = await resend.emails.send({
      from: `HomeMaid <${fromEmail}>`,
      to: [email],
      subject: "Your HomeMaid Verification Code 🔐",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ea580c; margin: 10px 0 0;">HomeMaid</h1>
            <p style="color: #666;">From Jaiswals Family to all families around the world</p>
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
            <p>© 2026 HomeMaid by Jaiswals Family. All rights reserved.</p>
            <p>Support: ashok@jaiswals.live</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Verification email error:", error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email address." },
        { status: 500 }
      );
    }

    console.log("[Auth] Verification code sent to:", email);
    return NextResponse.json({ 
      success: true, 
      message: "Verification code sent"
    });
  } catch (err: any) {
    console.error("[Auth] send-verification error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}
