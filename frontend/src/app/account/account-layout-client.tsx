"use client";

import React from "react";
import AuthGuard from "@/components/features/auth/auth-guard";
import PublicLayout from "@/components/layout/public-layout";

export default function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      <PublicLayout>
        <div 
          className="min-h-screen text-indianInk py-12 md:py-16 border-b border-burnishedGold/15"
          style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </PublicLayout>
    </AuthGuard>
  );
}
