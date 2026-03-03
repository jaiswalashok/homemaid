"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Crown,
  Star,
  Zap,
  Check,
  ArrowRight,
  Loader2,
  LogOut,
  Users,
  Plus,
  Trash2,
  ChevronLeft,
  Shield,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { TIER_LIMITS, SubscriptionTier, canPerformAction, UsageCount } from "@/lib/subscription";
import NavBar from "@/components/NavBar";
import toast from "react-hot-toast";

const TIER_ICONS: Record<SubscriptionTier, any> = {
  free: Zap,
  basic: Star,
  premium: Crown,
};

const TIER_COLORS: Record<SubscriptionTier, { badge: string; progress: string }> = {
  free: { badge: "bg-gray-100 text-gray-700", progress: "bg-gray-400" },
  basic: { badge: "bg-orange-100 text-orange-700", progress: "bg-orange-500" },
  premium: { badge: "bg-purple-100 text-purple-700", progress: "bg-purple-500" },
};

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [usage, setUsage] = useState<UsageCount | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  const tier = (profile?.tier || "free") as SubscriptionTier;
  const limits = TIER_LIMITS[tier];
  const colors = TIER_COLORS[tier];
  const TierIcon = TIER_ICONS[tier];

  // Check for successful checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      toast.success("Subscription activated! Welcome to your new plan.");
      refreshProfile();
      // Clean URL
      router.replace("/settings");
    }
    const canceled = searchParams.get("canceled");
    if (canceled) {
      toast("Checkout canceled", { icon: "ℹ️" });
      router.replace("/settings");
    }
  }, [searchParams, refreshProfile, router]);

  // Load usage
  useEffect(() => {
    if (!user) return;
    async function loadUsage() {
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user!.uid }),
        });
        if (res.ok) {
          const data = await res.json();
          setUsage(data.usage);
        }
      } catch (err) {
        console.error("Failed to load usage:", err);
      } finally {
        setLoadingUsage(false);
      }
    }
    loadUsage();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !profile) {
      // Give auth a moment to load
      const timeout = setTimeout(() => {
        if (!user) router.push("/login");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, profile, router]);

  const handleUpgrade = async (targetTier: SubscriptionTier) => {
    if (!user || !profile) return;
    setUpgrading(targetTier);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: targetTier,
          userId: user.uid,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start upgrade");
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.stripeCustomerId) {
      toast.error("No billing account found");
      return;
    }
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId: profile.stripeCustomerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open billing portal");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setManagingBilling(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/landing");
  };

  const usageItems = usage
    ? [
        { label: "Recipes", current: usage.recipes, limit: limits.recipes },
        { label: "Grocery Items", current: usage.groceryItems, limit: limits.groceryItems },
        { label: "Daily Tasks", current: usage.tasks, limit: limits.tasks },
        { label: "Family Members", current: usage.familyMembers, limit: limits.familyMembers },
      ]
    : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl font-bold">
              {profile?.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {profile?.displayName || "User"}
              </h2>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${colors.badge}`}>
              <TierIcon className="w-3.5 h-3.5" />
              {limits.label}
            </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            Usage & Limits
          </h3>

          {loadingUsage ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {usageItems.map((item) => {
                const pct = Math.min(100, Math.round((item.current / item.limit) * 100));
                const isNearLimit = pct >= 80;
                const isAtLimit = item.current >= item.limit;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <span className={`text-sm font-semibold ${isAtLimit ? "text-red-600" : isNearLimit ? "text-orange-600" : "text-gray-600"}`}>
                        {item.current}/{item.limit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAtLimit ? "bg-red-500" : isNearLimit ? "bg-orange-500" : colors.progress
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            Subscription
          </h3>

          <div className="space-y-3">
            {(["free", "basic", "premium"] as SubscriptionTier[]).map((t) => {
              const tLimits = TIER_LIMITS[t];
              const isCurrent = t === tier;
              const isUpgrade = (t === "basic" && tier === "free") || (t === "premium" && (tier === "free" || tier === "basic"));
              const Icon = TIER_ICONS[t];

              return (
                <div
                  key={t}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TIER_COLORS[t].badge}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{tLimits.label}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-bold rounded-full uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tLimits.recipes} recipes · {tLimits.tasks} tasks · {tLimits.groceryItems} grocery · {tLimits.familyMembers} member{tLimits.familyMembers > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${tLimits.priceMonthly}
                      <span className="text-xs text-gray-400 font-normal">/mo</span>
                    </div>
                    {isUpgrade && (
                      <button
                        onClick={() => handleUpgrade(t)}
                        disabled={!!upgrading}
                        className="mt-1 flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {upgrading === t ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            Upgrade <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manage Billing */}
          {profile?.stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {managingBilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Manage Billing
                </>
              )}
            </button>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
