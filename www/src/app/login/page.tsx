"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

type AuthMode = "login" | "signup" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSendVerification = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      toast.success("Verification code sent to your email!");
      setMode("verify");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndSignUp = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 4) {
      toast.error("Please enter the 4-digit code");
      return;
    }
    setLoading(true);
    try {
      // Verify the code
      const verifyRes = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid code");

      // Create account
      await signUp(email, password, displayName);

      // Send welcome email
      fetch("/api/mobile/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: displayName }),
      }).catch(() => {}); // fire and forget

      toast.success("Account created! Welcome to HomeBuddy!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const msg = err.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : err.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome!");
      router.push("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
      toast.success("Welcome!");
      router.push("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Apple sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/landing" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🍲</span>
            <span className="text-2xl font-bold text-gray-900">HomeBuddy</span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "verify"
              ? "Verify your email"
              : mode === "signup"
              ? "Create your account"
              : "Welcome back"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {mode === "verify"
              ? `We sent a 4-digit code to ${email}`
              : mode === "signup"
              ? "Start managing your home with AI"
              : "Sign in to your HomeBuddy account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {mode === "verify" ? (
            /* Verification Code Entry */
            <div className="space-y-5">
              <button
                onClick={() => setMode("signup")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyAndSignUp}
                disabled={loading || verificationCode.length !== 4}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleSendVerification}
                disabled={sendingCode}
                className="w-full text-sm text-gray-500 hover:text-orange-600 transition-colors"
              >
                {sendingCode ? "Sending..." : "Didn't receive it? Resend code"}
              </button>
            </div>
          ) : (
            /* Login / Signup Form */
            <div className="space-y-5">
              {/* Social Sign-In Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-gray-400 uppercase tracking-wider">or</span>
                </div>
              </div>

              {/* Email Form */}
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (mode === "login") handleLogin();
                        else handleSendVerification();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" ? (
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSendVerification}
                  disabled={sendingCode || !email.trim() || !password.trim() || !displayName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {sendingCode ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send Verification Code
                      <Mail className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {/* Toggle mode */}
              <p className="text-center text-sm text-gray-500">
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-orange-600 font-semibold hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-orange-600 font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
