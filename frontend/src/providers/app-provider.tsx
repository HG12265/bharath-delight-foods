"use client";

import React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { CartDrawerProvider } from "./cart-drawer-provider";
import { AuthInitializer } from "./auth-initializer";

/**
 * Global App Provider wrapper combining Theme and API Query client providers.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthInitializer>
          <CartDrawerProvider>{children}</CartDrawerProvider>
        </AuthInitializer>
      </QueryProvider>
    </ThemeProvider>
  );
}
