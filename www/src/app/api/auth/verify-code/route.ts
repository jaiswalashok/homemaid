import { NextRequest, NextResponse } from "next/server";

const VERIFICATION_COLLECTION = "emailVerifications";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Missing email or code" },
        { status: 400 }
      );
    }

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

    // Get verification record from Firestore
    const docId = email.replace(/[^a-zA-Z0-9]/g, "_");
    const docRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${VERIFICATION_COLLECTION}/${docId}?key=${apiKey}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    if (!docRes.ok) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 404 }
      );
    }

    const docData = await docRes.json();
    const fields = docData.fields;

    const storedCode = fields?.code?.stringValue;
    const expiresAt = parseInt(fields?.expiresAt?.integerValue || "0");

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    if (storedCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark as verified
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${VERIFICATION_COLLECTION}/${docId}?key=${apiKey}&updateMask.fieldPaths=verified`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            verified: { booleanValue: true },
          },
        }),
      }
    );

    console.log("[Auth] Email verified:", email);
    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    console.error("[Auth] verify-code error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify code" },
      { status: 500 }
    );
  }
}
