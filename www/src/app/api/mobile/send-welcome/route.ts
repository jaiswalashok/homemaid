import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: "Email and name are required" },
        { status: 400 }
      );
    }

    // Send welcome email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'HomeMaid <noreply@HomeMaid.app>',
        to: [email],
        subject: 'Welcome to HomeMaid! 🏠',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4A90E2; margin: 0;">HomeMaid</h1>
              <p style="color: #666; margin: 5px 0;">Your Smart Home Assistant</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 10px 0;">Welcome to HomeMaid! 🎉</h2>
              <p style="color: #666; margin: 0 0 20px 0;">
                Hi ${name},<br>
                Welcome to your new smart home assistant! We're excited to help you manage your household more efficiently.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #4A90E2; margin: 0 0 15px 0;">What you can do with HomeMaid:</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">🍳 <strong>AI Recipe Creation</strong> - Describe any dish and get detailed recipes</li>
                  <li style="margin-bottom: 8px;">📝 <strong>Smart Task Management</strong> - Organize your household tasks efficiently</li>
                  <li style="margin-bottom: 8px;">🛒 <strong>Grocery Lists</strong> - Never forget items again</li>
                  <li style="margin-bottom: 8px;">💰 <strong>Expense Tracking</strong> - Monitor your spending</li>
                  <li style="margin-bottom: 8px;">👨‍👩‍👧‍👦 <strong>Family Management</strong> - Keep everyone organized</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Open HomeMaid App
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>Need help? Reply to this email and we'll assist you!</p>
              <p>© 2026 HomeMaid. All rights reserved.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[Resend] Error sending welcome email:", error);
        return NextResponse.json(
          { success: false, message: "Failed to send welcome email" },
          { status: 500 }
        );
      }

      console.log("[Resend] Welcome email sent:", { email, messageId: data?.id });

      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
      });
    } catch (emailError) {
      console.error("[Resend] Email sending error:", emailError);
      return NextResponse.json(
        { success: false, message: "Failed to send welcome email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Send welcome error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send welcome email" },
      { status: 500 }
    );
  }
}
