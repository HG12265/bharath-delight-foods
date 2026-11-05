import React from "react";

/**
 * Global 404 Custom Not Found fallback page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 px-4 text-center bg-background">
      <div className="space-y-2">
        <h1 className="font-serif text-6xl text-kashmirSaffron">404</h1>
        <h2 className="font-serif text-2xl text-foreground">Page Not Found</h2>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          The specified destination cannot be located. It may have been modified, archived, or is temporarily offline.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href="/"
          className="w-full sm:w-auto text-center rounded bg-primary px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
        >
          Return Home
        </a>
        <a
          href="/trust"
          className="w-full sm:w-auto text-center rounded border border-primary px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary hover:bg-muted/30 transition-colors"
        >
          Verify Batch Code
        </a>
      </div>
    </div>
  );
}