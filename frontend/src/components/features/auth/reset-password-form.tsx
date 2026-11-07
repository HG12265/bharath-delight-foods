"use client";

import React, { useState } from "react";
import { useRouter } from "@/platform/navigation";
import Link from "@/platform/link";
import { useVerifyResetEmail, useResetPassword } from "../../../hooks/use-auth";
import PasswordField from "./password-field";
import { CheckCircle2, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const verifyMutation = useVerifyResetEmail();
  const resetMutation = useResetPassword();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Read redirect parameter if user was trying to go somewhere (e.g., checkout or shop)
  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
  const targetDestination = (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) ? redirectParam : "/shop";

  // Step 1 validation: Email
  const validateEmailStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 validation: Passwords
  const validatePasswordStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Step 1 submit: Verify Email
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!validateEmailStep()) return;

    verifyMutation.mutate(email.trim().toLowerCase(), {
      onSuccess: (res) => {
        if (res.success && res.data?.verified && res.data?.reset_token) {
          setVerifiedEmail(res.data.email);
          setResetToken(res.data.reset_token);
          setStep(2);
          setApiSuccess("Account verified! Please enter your new password below.");
        } else {
          setApiError(res.message || "Unable to verify this email address.");
        }
      },
      onError: (err: any) => {
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "No registered account was found with this email. Please check your spelling or sign up.";
        setApiError(errMsg);
      },
    });
  };

  // Handle Step 2 submit: Reset Password & Auto Login
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!validatePasswordStep()) return;

    resetMutation.mutate(
      {
        email: verifiedEmail,
        reset_token: resetToken,
        new_password: newPassword,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setStep(3);
            setApiSuccess("Password reset successfully! You are now logged in.");
            // Auto redirect after 2.5 seconds
            setTimeout(() => {
              router.push(targetDestination);
            }, 2500);
          } else {
            setApiError(res.message || "Failed to reset password. Please try again.");
          }
        },
        onError: (err: any) => {
          const errMsg =
            err.response?.data?.message ||
            err.message ||
            "Unable to reset password. Please request a new verification session.";
          setApiError(errMsg);
        },
      }
    );
  };

  const isVerifying = verifyMutation.isPending;
  const isResetting = resetMutation.isPending;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Progress Step Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-indianInk/10">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans ${
              step >= 1
                ? "bg-deodharForest text-white"
                : "bg-indianInk/10 text-indianInk/50"
            }`}
          >
            1
          </span>
          <span className={`text-xs font-sans font-semibold uppercase tracking-wider ${
            step === 1 ? "text-deodharForest" : "text-indianInk/60"
          }`}>
            Verify Email
          </span>
        </div>

        <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? "bg-deodharForest" : "bg-indianInk/15"}`} />

        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans ${
              step >= 2
                ? "bg-deodharForest text-white"
                : "bg-indianInk/10 text-indianInk/50"
            }`}
          >
            2
          </span>
          <span className={`text-xs font-sans font-semibold uppercase tracking-wider ${
            step >= 2 ? "text-deodharForest" : "text-indianInk/40"
          }`}>
            New Password
          </span>
        </div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] font-medium leading-relaxed">
          {apiError}
        </div>
      )}

      {/* API Success Notification */}
      {apiSuccess && step !== 3 && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-sans rounded-[4px] font-medium leading-relaxed flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{apiSuccess}</span>
        </div>
      )}

      {/* STEP 1: Verify Email Form */}
      {step === 1 && (
        <form onSubmit={handleVerifyEmail} className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-indianInk/70 font-sans leading-relaxed">
              Enter your registered email address. We will verify your account and allow you to set a new password.
            </span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
              Email Address
            </label>
            <div className="relative w-full">
              <input
                type="email"
                disabled={isVerifying}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="name@example.com"
                className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                  validationErrors.email
                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                    : "border-indianInk/20"
                }`}
              />
            </div>
            {validationErrors.email && (
              <span className="text-xs text-destructive font-sans font-medium mt-1">
                {validationErrors.email}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full mt-2 py-4 bg-indianInk text-white hover:bg-indianInk/90 transition-colors duration-200 rounded-[4px] font-sans text-sm font-medium tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Verify Email & Continue</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Enter New Password Form */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-5 w-full">
          {/* Verified Email Banner */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-[4px] text-xs font-sans text-emerald-900">
            <div className="flex items-center gap-2 overflow-hidden">
              <Mail size={16} className="text-emerald-700 shrink-0" />
              <div className="truncate">
                <span className="text-emerald-700 font-medium mr-1.5">Verified:</span>
                <span className="font-bold">{verifiedEmail}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setResetToken("");
                setApiError(null);
                setApiSuccess(null);
              }}
              className="text-emerald-800 hover:text-emerald-950 font-bold underline shrink-0 ml-2 text-xs"
            >
              Change
            </button>
          </div>

          {/* New Password */}
          <PasswordField
            label="New Password"
            disabled={isResetting}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (validationErrors.newPassword) {
                setValidationErrors((prev) => ({ ...prev, newPassword: "" }));
              }
            }}
            placeholder="At least 8 characters"
            error={validationErrors.newPassword}
          />

          {/* Confirm New Password */}
          <PasswordField
            label="Confirm New Password"
            disabled={isResetting}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) {
                setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            placeholder="Re-enter your new password"
            error={validationErrors.confirmPassword}
          />

          <button
            type="submit"
            disabled={isResetting}
            className="w-full mt-2 py-4 bg-deodharForest text-white hover:bg-deodharForest/90 transition-colors duration-200 rounded-[4px] font-sans text-sm font-medium tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isResetting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving New Password...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Save Password & Log In</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center gap-5 py-4 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl font-bold text-deodharForest">
              Password Reset Successfully!
            </h3>
            <p className="text-sm font-sans text-indianInk/70 max-w-sm">
              Your account password has been updated and you are now securely signed in.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 mt-3">
            <Link
              href={targetDestination}
              className="w-full py-3.5 bg-deodharForest text-white hover:bg-deodharForest/90 transition-colors duration-200 rounded-[4px] font-sans text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/account"
              className="w-full py-3 bg-white text-indianInk border border-indianInk/20 hover:bg-indianInk/5 transition-colors duration-200 rounded-[4px] font-sans text-xs font-semibold tracking-wider uppercase"
            >
              View My Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordForm;

