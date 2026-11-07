"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/platform/navigation";
import { useGoogleLogin } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode?: "signin" | "signup";
  onError?: (msg: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = "signin",
  onError,
}) => {
  const router = useRouter();
  const googleLoginMutation = useGoogleLogin();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const clientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    "388496280445-h1ag930eib0auv9ccjgr41omofhc5grk.apps.googleusercontent.com";

  const handleCredentialResponse = (response: { credential: string }) => {
    if (!response.credential) {
      const err = "Failed to receive Google credential.";
      setInternalError(err);
      onError?.(err);
      return;
    }

    setInternalError(null);
    googleLoginMutation.mutate(response.credential, {
      onSuccess: (res) => {
        if (res.success) {
          const redirectParam =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("redirect")
              : null;
          const targetUrl =
            redirectParam &&
            redirectParam.startsWith("/") &&
            !redirectParam.startsWith("//")
              ? redirectParam
              : "/shop";
          router.push(targetUrl);
        } else {
          const err = res.message || "Google authentication failed.";
          setInternalError(err);
          onError?.(err);
        }
      },
      onError: (err: any) => {
        const errDetail =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to complete Google sign-in. Please ensure Google OAuth credentials are configured.";
        setInternalError(errDetail);
        onError?.(errDetail);
      },
    });
  };

  useEffect(() => {
    // If clientId is missing, we don't attempt script initialization
    if (!clientId) {
      return;
    }

    // Load Google Identity Services script if not already in DOM
    const existingScript = document.getElementById("google-gsi-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    if (!isScriptLoaded || !clientId || !containerRef.current || !window.google) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      // Clear container before rendering
      containerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular",
        width: "100%",
        logo_alignment: "left",
      });
    } catch {
      // fallback to custom button if renderButton encounters issues
    }
  }, [isScriptLoaded, clientId, mode]);

  const handleCustomButtonClick = () => {
    if (!clientId) {
      const msg =
        "Google Sign-In is being configured. Please use Email/Phone sign in, or provide your Google Client ID.";
      setInternalError(msg);
      onError?.(msg);
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch {
        // handled
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Container for rendered official Google Button when GIS is loaded and configured */}
      {clientId ? (
        <div className="w-full">
          <div ref={containerRef} className="w-full flex justify-center [&>div]:w-full" />
          {(!isScriptLoaded || googleLoginMutation.isPending) && (
            <div className="w-full py-3 px-4 border border-burnishedGold/20 rounded-[4px] bg-white flex items-center justify-center gap-2 text-xs font-sans text-indianInk/70">
              <Loader2 className="w-4 h-4 animate-spin text-burnishedGold" />
              <span>Connecting to Google...</span>
            </div>
          )}
        </div>
      ) : (
        /* Styled Fallback / Demo Button when Client ID is not yet provided */
        <button
          type="button"
          onClick={handleCustomButtonClick}
          className="w-full py-3.5 px-4 bg-white hover:bg-richCream/30 text-indianInk border border-indianInk/20 hover:border-burnishedGold/40 rounded-[4px] font-sans text-xs font-semibold tracking-wider transition-all duration-200 shadow-2xs flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          {/* Authentic Google "G" Logo */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </span>
        </button>
      )}

      {internalError && (
        <p className="text-[11px] font-sans text-destructive text-center mt-1">
          {internalError}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
