"use client";

import React, { useState } from "react";
import { useRouter } from "@/platform/navigation";
import { useLogin } from "../../../hooks/use-auth";
import PasswordField from "./password-field";
import GoogleSignInButton from "./google-sign-in-button";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(false);

    if (!validate()) return;

    loginMutation.mutate(
      { email_or_phone: email.trim(), password },
      {
        onSuccess: (res) => {
          if (res.success) {
            setSuccess(true);
            const role = res.data?.role;
            if (role === "admin" || role === "warehouse") {
              router.push("/admin");
            } else {
              const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
              const targetUrl = (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) ? redirectParam : "/shop";
              router.push(targetUrl);
            }
          } else {
            setApiError(res.message || "Invalid credentials. Please try again.");
          }
        },
        onError: (err: any) => {
          const errMsg =
            err.response?.data?.message ||
            err.message ||
            "Unable to connect to the login server. Please try again.";
          setApiError(errMsg);
        },
      }
    );
  };

  const isPending = loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* API Error Display */}
      {apiError && (
        <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] font-medium leading-relaxed">
          {apiError}
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="p-4 bg-success/10 border border-success/20 text-success text-sm font-sans rounded-[4px] font-medium leading-relaxed">
          Authenticated successfully! Redirecting you...
        </div>
      )}

      {/* Email Input */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
          Email Address
        </label>
        <input
          type="email"
          disabled={isPending || success}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (validationErrors.email) {
              setValidationErrors((prev) => ({ ...prev, email: "" }));
            }
          }}
          placeholder="Enter your email"
          className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
            validationErrors.email
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
              : "border-indianInk/20"
          }`}
        />
        {validationErrors.email && (
          <span className="text-xs text-destructive font-sans font-medium mt-1">
            {validationErrors.email}
          </span>
        )}
      </div>

      {/* Password Input using PasswordField */}
      <PasswordField
        disabled={isPending || success}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (validationErrors.password) {
            setValidationErrors((prev) => ({ ...prev, password: "" }));
          }
        }}
        placeholder="Enter your password"
        error={validationErrors.password}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || success}
        className="w-full mt-2 py-4 bg-indianInk text-white hover:bg-indianInk/90 transition-colors duration-200 rounded-[4px] font-sans text-sm font-medium tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Logging In...</span>
          </>
        ) : (
          <span>Secure Sign In</span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-grow h-px bg-burnishedGold/20" />
        <span className="text-[11px] font-sans uppercase tracking-widest text-indianInk/45 font-medium">
          Or continue with
        </span>
        <div className="flex-grow h-px bg-burnishedGold/20" />
      </div>

      {/* Google Sign In */}
      <GoogleSignInButton mode="signin" onError={(err) => setApiError(err)} />
    </form>
  );
};

export default LoginForm;
