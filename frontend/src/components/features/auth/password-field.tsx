"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", error, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-medium tracking-wide uppercase text-indianInk/80 font-sans">
          {label}
        </label>
        <div className="relative w-full">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold pr-11 ${
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                : "border-indianInk/20"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-indianInk/50 hover:text-indianInk/85 transition-colors duration-150 p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
          </button>
        </div>
        {error && <span className="text-xs text-destructive font-sans font-medium mt-1">{error}</span>}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
export default PasswordField;
