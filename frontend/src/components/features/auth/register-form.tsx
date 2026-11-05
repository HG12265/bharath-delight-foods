"use client";

import React, { useState } from "react";
import { useRouter } from "@/platform/navigation";
import { useRegister, useLogin } from "../../../hooks/use-auth";
import PasswordField from "./password-field";

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPhoneToE164 = (phoneStr: string): string => {
    // Remove all characters except digits and plus sign
    const cleaned = phoneStr.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // If it's a 10-digit Indian mobile number, prefix with +91
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // If it starts with 91 and has 12 digits total
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    // Default fallback: prepend + if not there
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.first_name = "First name is required";
    } else if (firstName.trim().length < 2) {
      errors.first_name = "First name must be at least 2 characters";
    }

    if (!lastName.trim()) {
      errors.last_name = "Last name is required";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (cleanDigits.length < 10) {
      errors.phone = "Please enter a valid 10-digit phone number";
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

    const formattedPhone = formatPhoneToE164(phone);

    registerMutation.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone_number: formattedPhone,
        password,
      },
      {
        onSuccess: (regRes) => {
          if (regRes.success) {
            setSuccess(true);

            // Auto-login on successful registration
            loginMutation.mutate(
              {
                email_or_phone: formattedPhone,
                password,
              },
              {
                onSuccess: (loginRes) => {
                  if (loginRes.success) {
                    const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
                    const targetUrl = (redirectParam && redirectParam !== "/account") ? redirectParam : "/shop";
                    router.push(targetUrl);
                  } else {
                    setApiError("Account created successfully, but automatic login failed. Please sign in manually.");
                  }
                },
                onError: () => {
                  setApiError("Account created successfully, but automatic login failed. Please sign in manually.");
                },
              }
            );
          } else {
            setApiError(regRes.message || "Registration failed. Please try again.");
          }
        },
        onError: (err: any) => {
          const errMsg =
            err.response?.data?.message ||
            err.message ||
            "Unable to connect to the server. Please try again.";
          setApiError(errMsg);
        },
      }
    );
  };

  const isPending = registerMutation.isPending || loginMutation.isPending;

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
          Account created! Setting up your session...
        </div>
      )}

      {/* First & Last Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* First Name */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
            First Name
          </label>
          <input
            type="text"
            disabled={isPending || success}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (validationErrors.first_name) {
                setValidationErrors((prev) => ({ ...prev, first_name: "" }));
              }
            }}
            placeholder="First Name"
            className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${validationErrors.first_name
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                : "border-indianInk/20"
              }`}
          />
          {validationErrors.first_name && (
            <span className="text-xs text-destructive font-sans font-medium mt-1">
              {validationErrors.first_name}
            </span>
          )}
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
            Last Name
          </label>
          <input
            type="text"
            disabled={isPending || success}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (validationErrors.last_name) {
                setValidationErrors((prev) => ({ ...prev, last_name: "" }));
              }
            }}
            placeholder="Last Name"
            className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${validationErrors.last_name
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                : "border-indianInk/20"
              }`}
          />
          {validationErrors.last_name && (
            <span className="text-xs text-destructive font-sans font-medium mt-1">
              {validationErrors.last_name}
            </span>
          )}
        </div>
      </div>

      {/* Email Address */}
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
          placeholder="Enter email address"
          className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${validationErrors.email
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

      {/* Phone Number */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
          Phone Number
        </label>
        <input
          type="tel"
          disabled={isPending || success}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (validationErrors.phone) {
              setValidationErrors((prev) => ({ ...prev, phone: "" }));
            }
          }}
          placeholder="e.g. 9876543210"
          className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${validationErrors.phone
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
              : "border-indianInk/20"
            }`}
        />
        {validationErrors.phone && (
          <span className="text-xs text-destructive font-sans font-medium mt-1">
            {validationErrors.phone}
          </span>
        )}
      </div>

      {/* Password Field */}
      <PasswordField
        disabled={isPending || success}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (validationErrors.password) {
            setValidationErrors((prev) => ({ ...prev, password: "" }));
          }
        }}
        placeholder="Choose password (min. 8 characters)"
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
            <span>Creating Account...</span>
          </>
        ) : (
          <span>Register Account</span>
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
