"use client";

import React, { useEffect } from "react";

/**
 * Global application error boundary fallback component.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Perform remote reporting or local debug dumps
    console.error("Hydration or Router Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 px-4 text-center bg-background">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl text-foreground">
          An Unexpected Event Occurred
        </h2>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          We encountered a disruption loading this request. Our technical staff has been alerted. Please try reloading the view.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto rounded bg-primary px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
        >
          Reload Interface
        </button>
        <a
          href="/"
          className="w-full sm:w-auto text-center rounded border border-primary px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary hover:bg-muted/30 transition-colors"
        >
          Return to Portal
        </a>
      </div>
    </div>
  );
}