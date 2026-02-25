import { NextRequest, NextResponse } from "next/server";

const VERIFICATION_COLLECTION = "emailVerifications";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Missing email or code" },
        { status: 400 }
      );
    }

    // Get verification record from Firestore using REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const docId = email.replace(/[^a-zA-Z0-9]/g, "_");
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${VERIFICATION_COLLECTION}/${docId}`;

    const docRes = await fetch(firestoreUrl);
    
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

    // Mark as verified in Firestore using REST API
    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          verified: { booleanValue: true },
          verifiedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    console.log("[Auth] Email verified:", email);
    return NextResponse.json({ 
      success: true, 
      verified: true
    });
  } catch (err: any) {
    console.error("[Auth] verify-code error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify code" },
      { status: 500 }
    );
  }
}
