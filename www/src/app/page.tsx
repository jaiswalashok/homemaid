"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Show fallback after 3 seconds if still loading
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    if (!loading) {
      clearTimeout(fallbackTimer);
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/landing');
      }
    }

    return () => clearTimeout(fallbackTimer);
  }, [user, loading, router]);

  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Loading...</p>
          <button 
            onClick={() => router.push('/landing')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Continue to Landing Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}
