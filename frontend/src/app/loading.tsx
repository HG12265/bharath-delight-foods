import React from "react";

/**
 * Global application fallback loading screen featuring the corporate brand.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4 px-4 bg-background">
      <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-kashmirSaffron" />
      <p className="font-serif text-lg tracking-wide text-foreground animate-pulse">
        BHARATH DELIGHT FOODS
      </p>
      <p className="font-sans text-xs tracking-wider uppercase text-muted-foreground">
        Selecting the Best to Serve the Best
      </p>
    </div>
  );
}