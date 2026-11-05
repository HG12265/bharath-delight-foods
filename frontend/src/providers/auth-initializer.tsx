"use client";

import React, { useEffect, useState } from "react";
import Loading from "@/app/loading";
import axios from "axios";
import { env } from "@/lib/env";
import { getAccessToken, setAccessToken } from "@/services/api-client";
import authService from "@/services/auth-service";
import { Envelope, Token } from "@/types";

/**
 * AuthInitializer — ensures persistent authentication across page reloads.
 *
 * 1. Restores the stored access token from localStorage immediately on mount.
 * 2. Background-verifies the active session without blocking initial render.
 * 3. Falls back to silent token refresh only when the access token has expired.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setAccessToken(storedToken);
        return true;
      }
      if (localStorage.getItem("was_logged_in") !== "true") {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const wasLoggedIn = typeof window !== "undefined" && localStorage.getItem("was_logged_in") === "true";

      // Case 1: Valid access token exists in localStorage
      if (storedToken) {
        setAccessToken(storedToken);
        try {
          const sessionRes = await authService.getSession();
          if (!cancelled && sessionRes?.data?.user) {
            if (typeof window !== "undefined") {
              localStorage.setItem("current_user", JSON.stringify(sessionRes.data.user));
              localStorage.setItem("was_logged_in", "true");
            }
            if (!cancelled) setIsReady(true);
            return;
          }
        } catch {
          // getSession returned 401 or network error — try refresh below
        }
      }

      // Case 2: User had a session but access token is missing or expired
      if (wasLoggedIn || storedToken) {
        try {
          const response = await axios.post<Envelope<Token>>(
            `${env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
            {},
            { withCredentials: true, timeout: 10000 }
          );
          if (!cancelled && response.data?.data?.access_token) {
            setAccessToken(response.data.data.access_token);
            if (response.data.data.user && typeof window !== "undefined") {
              localStorage.setItem("current_user", JSON.stringify(response.data.data.user));
              localStorage.setItem("was_logged_in", "true");
            }
            if (!cancelled) setIsReady(true);
            return;
          }
        } catch {
          // Both access token and refresh failed — clear credentials
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("current_user");
            localStorage.removeItem("was_logged_in");
          }
          setAccessToken(null);
        }
      } else {
        setAccessToken(null);
      }

      if (!cancelled) {
        setIsReady(true);
      }
    };

    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return <Loading />;
  }

  return <>{children}</>;
}
