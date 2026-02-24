"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  ListChecks,
  ShoppingCart,
  Receipt,
  Users,
  Sparkles,
  ChefHat,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  Star,
  Zap,
  Crown,
} from "lucide-react";
import { TIER_LIMITS, SubscriptionTier } from "@/lib/subscription";

const FEATURES = [
  {
    icon: ChefHat,
    title: "AI Recipe Creation",
    description: "Describe any dish and get detailed bilingual recipes with stunning AI-generated images",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: ListChecks,
    title: "Smart Task Management",
    description: "Track daily tasks with timers, urgency levels, and recurring schedules",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: ShoppingCart,
    title: "Grocery Lists",
    description: "AI-formatted grocery items with emoji, one-tap purchased toggle",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Receipt,
    title: "Expense Tracking",
    description: "Scan receipts with AI, track spending, and manage household budget",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Users,
    title: "Family Collaboration",
    description: "Share recipes, tasks, and lists with family members seamlessly",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Web app, iOS, Android, and Telegram bot — your data syncs across all devices",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
];

const TIER_ICONS: Record<SubscriptionTier, any> = {
  free: Zap,
  basic: Star,
  premium: Crown,
};

const TIER_COLORS: Record<SubscriptionTier, { border: string; bg: string; badge: string; button: string }> = {
  free: {
    border: "border-gray-200",
    bg: "bg-white",
    badge: "bg-gray-100 text-gray-600",
    button: "bg-gray-800 hover:bg-gray-900 text-white",
  },
  basic: {
    border: "border-orange-300 ring-2 ring-orange-200",
    bg: "bg-gradient-to-b from-orange-50 to-white",
    badge: "bg-orange-100 text-orange-700",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  premium: {
    border: "border-purple-300 ring-2 ring-purple-200",
    bg: "bg-gradient-to-b from-purple-50 to-white",
    badge: "bg-purple-100 text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍲</span>
              <span className="text-xl font-bold text-gray-900 tracking-tight">HomeMaid</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-purple-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,146,60,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-orange-200 text-sm text-orange-700 font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Powered by AI — Your Smart Home Assistant
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              Manage your home
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                like a pro
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              AI-powered recipes, smart task management, grocery lists, and expense tracking — 
              all in one beautiful app for your entire family.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login?mode=signup"
                className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30"
              >
                Start Free — No Card Required
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-gray-200 shadow-sm"
              >
                See Features
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-gray-900">10+</div>
                <div className="text-sm text-gray-500 mt-1">Free Recipes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">🤖</div>
                <div className="text-sm text-gray-500 mt-1">AI Powered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">📱</div>
                <div className="text-sm text-gray-500 mt-1">All Devices</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything your home needs
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From AI-generated recipes to smart expense tracking, HomeMaid has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {(["free", "basic", "premium"] as SubscriptionTier[]).map((tier) => {
              const limits = TIER_LIMITS[tier];
              const colors = TIER_COLORS[tier];
              const TierIcon = TIER_ICONS[tier];
              const isPopular = tier === "basic";

              return (
                <div
                  key={tier}
                  className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-8 flex flex-col`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.badge} flex items-center justify-center`}>
                      <TierIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{limits.label}</h3>
                      <p className="text-xs text-gray-500">{limits.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${limits.priceMonthly}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span><strong>{limits.familyMembers}</strong> family member{limits.familyMembers > 1 ? "s" : ""}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span><strong>{limits.recipes}</strong> recipes</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span><strong>{limits.groceryItems}</strong> grocery items</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span><strong>{limits.tasks}</strong> daily tasks</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      AI recipe generation
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Telegram bot access
                    </li>
                  </ul>

                  <Link
                    href={tier === "free" ? "/login?mode=signup" : `/login?mode=signup&tier=${tier}`}
                    className={`w-full py-3 rounded-xl text-center text-sm font-semibold transition-colors ${colors.button} block`}
                  >
                    {tier === "free" ? "Get Started Free" : `Start ${limits.label} Plan`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to simplify your home life?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join families who use HomeMaid to manage recipes, tasks, groceries, and expenses — all powered by AI.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-orange-600 bg-white hover:bg-gray-50 rounded-2xl transition-colors shadow-lg"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍲</span>
              <span className="text-lg font-bold text-white">HomeMaid</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
            <p className="text-sm text-gray-500">© 2026 HomeMaid by Jaiswals Family. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
