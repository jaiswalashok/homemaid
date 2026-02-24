"use client";

import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#333",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
      </LanguageProvider>
    </AuthProvider>
  );
}
