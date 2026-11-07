import React from "react";
import Link from "@/platform/link";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}) => {
  return (
    <div className="w-full max-w-[480px] bg-white border border-indianInk/5 rounded-lg shadow-[0_4px_16px_rgba(28,35,33,0.04)] overflow-hidden">
      {/* Brand Header */}
      <div className="bg-deodharForest text-richCream px-8 py-6 text-center border-b border-indianInk/5">
        <h2 className="font-serif text-3xl text-white font-medium tracking-tight mb-1">
          BHARATH DELIGHT FOODS
        </h2>
        <p className="text-xs uppercase tracking-[0.12em] font-sans text-warmIvory/70">
          Authenticity in Every Delight
        </p>
      </div>

      <div className="px-8 py-8 md:px-10 md:py-10">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-indianInk mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-sans text-indianInk/60">
              {subtitle}
            </p>
          )}
        </div>

        {children}

        {(footerText || (footerLinkText && footerLinkHref)) && (
          <div className="mt-8 pt-6 border-t border-indianInk/5 text-center text-sm font-sans text-indianInk/60">
            {footerText}{" "}
            {footerLinkText && footerLinkHref && (
              <Link
                href={footerLinkHref}
                className="font-medium text-kashmirSaffron hover:text-kashmirSaffron/80 underline underline-offset-4 transition-colors duration-150"
              >
                {footerLinkText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard;
