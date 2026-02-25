"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ListChecks, Receipt, ShoppingCart, Settings } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV_ITEMS = [
  { href: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelHi: "रेसिपी" },
  { href: "/tasks", icon: ListChecks, labelEn: "Tasks", labelHi: "कार्य" },
  { href: "/expenses", icon: Receipt, labelEn: "Expenses", labelHi: "खर्च" },
  { href: "/grocery", icon: ShoppingCart, labelEn: "Grocery", labelHi: "किराना" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 shadow-lg shadow-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🍲</span>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">
              {language === "Hindi" ? "होमबडी" : "HomeMaid"}
            </span>
          </Link>

          {/* Nav items */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === "Hindi" ? item.labelHi : item.labelEn}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher />
            <Link
              href="/settings"
              className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${
                pathname === "/settings"
                  ? "bg-white/25 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Settings"
            >
              {user ? (
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold border border-white/30">
                  {profile?.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
                </div>
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
