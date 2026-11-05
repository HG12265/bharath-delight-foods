"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

/**
 * Global TanStack Query Provider configuration.
 * Configures query limits and stale-time caching settings.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache validity duration
            gcTime: 1000 * 60 * 30, // 30 minutes garbage collection time
            refetchOnWindowFocus: false, // Prevents layout shifts on re-focus
            retry: 1, // Safe retry boundary for client requests
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}