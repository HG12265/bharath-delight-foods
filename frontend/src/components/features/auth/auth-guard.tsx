"use client";

import React, { useEffect } from "react";
import { useRouter } from "@/platform/navigation";
import { useMe } from "../../../hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const router = useRouter();
  // Fetch active session. We disable retries for immediate feedback
  const { data, isPending, isError } = useMe();

  const isAuthenticated = !!data?.success && !!data?.data;

  useEffect(() => {
    if (!isPending) {
      if (requireAuth && (!isAuthenticated || isError)) {
        router.push("/login");
      } else if (!requireAuth && isAuthenticated) {
        const role = data?.data?.role;
        if (role === "admin" || role === "warehouse") {
          router.push("/admin");
        } else {
          const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
          const targetUrl = (redirectParam && redirectParam !== "/account") ? redirectParam : "/shop";
          router.push(targetUrl);
        }
      }
    }
  }, [isAuthenticated, isPending, isError, requireAuth, router, data]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Spinner with Burnished Gold highlight */}
          <div className="w-10 h-10 border-2 border-burnishedGold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indianInk/60 text-xs tracking-wider uppercase font-medium">
            Verifying Secure Session...
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash of contents during active redirection
  if (requireAuth && (!isAuthenticated || isError)) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
