// Subscription tiers and usage limits for the SaaS model

export type SubscriptionTier = "free" | "basic" | "premium";

export interface TierLimits {
  familyMembers: number;
  recipes: number;
  groceryItems: number;
  tasks: number;
  priceMonthly: number; // in dollars
  label: string;
  description: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    familyMembers: 1,
    recipes: 10,
    groceryItems: 20,
    tasks: 10,
    priceMonthly: 0,
    label: "Free",
    description: "Perfect for getting started",
  },
  basic: {
    familyMembers: 2,
    recipes: 20,
    groceryItems: 40,
    tasks: 20,
    priceMonthly: 1,
    label: "Basic",
    description: "Great for small families",
  },
  premium: {
    familyMembers: 4,
    recipes: 40,
    groceryItems: 80,
    tasks: 40,
    priceMonthly: 2,
    label: "Premium",
    description: "Best for large families",
  },
};

// Stripe price IDs — set these in .env.local
export const STRIPE_PRICE_IDS: Record<Exclude<SubscriptionTier, "free">, string> = {
  basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || "",
  premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "",
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  familyMembers: FamilyMember[];
  createdAt: any;
  updatedAt: any;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "member";
  addedAt: any;
}

export interface UsageCount {
  recipes: number;
  groceryItems: number;
  tasks: number;
  familyMembers: number;
}

export function canPerformAction(
  tier: SubscriptionTier,
  usage: UsageCount,
  action: keyof UsageCount
): { allowed: boolean; limit: number; current: number } {
  const limits = TIER_LIMITS[tier];
  const limitMap: Record<keyof UsageCount, number> = {
    recipes: limits.recipes,
    groceryItems: limits.groceryItems,
    tasks: limits.tasks,
    familyMembers: limits.familyMembers,
  };
  const limit = limitMap[action];
  const current = usage[action];
  return { allowed: current < limit, limit, current };
}

export function getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  if (currentTier === "free") return "basic";
  if (currentTier === "basic") return "premium";
  return null;
}
