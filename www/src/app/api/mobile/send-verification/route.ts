import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 4-digit verification code
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Store verification codes in memory (in production, use Redis or Firestore)
const verificationCodes = new Map<string, { code: string; expiresAt: number; email: string; name: string }>();

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: "Email and name are required" },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Store verification code
    verificationCodes.set(email, { code, expiresAt, email, name });

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'HomeBuddy <noreply@homebuddy.app>',
        to: [email],
        subject: 'Verify your HomeBuddy account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4A90E2; margin: 0;">HomeBuddy</h1>
              <p style="color: #666; margin: 5px 0;">Your Smart Home Assistant</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 10px 0;">Verify Your Email</h2>
              <p style="color: #666; margin: 0 0 20px 0;">
                Hi ${name},<br>
                Thanks for signing up for HomeBuddy! Please use the verification code below to complete your registration.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #4A90E2; letter-spacing: 8px; margin: 10px 0;">
                  ${code}
                </div>
                <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">This code expires in 10 minutes</p>
              </div>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>If you didn't request this verification, please ignore this email.</p>
              <p>© 2026 HomeBuddy. All rights reserved.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[Resend] Error sending verification email:", error);
        return NextResponse.json(
          { success: false, message: "Failed to send verification email" },
          { status: 500 }
        );
      }

      console.log("[Resend] Verification email sent:", { email, messageId: data?.id });

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your email",
        code, // Return code for development (remove in production)
        expiresAt,
      });
    } catch (emailError) {
      console.error("[Resend] Email sending error:", emailError);
      return NextResponse.json(
        { success: false, message: "Failed to send verification email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Send verification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}

// Helper function to verify code (for verification endpoint)
export function verifyCode(email: string, code: string): { success: boolean; message: string } {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    return { success: false, message: "No verification code found for this email" };
  }
  
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return { success: false, message: "Verification code has expired" };
  }
  
  if (stored.code !== code) {
    return { success: false, message: "Invalid verification code" };
  }
  
  // Code is valid, remove it
  verificationCodes.delete(email);
  return { success: true, message: "Code verified successfully" };
}
