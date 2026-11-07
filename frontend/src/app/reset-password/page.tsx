"use client";

import AuthGuard from "@/components/features/auth/auth-guard";
import AuthCard from "@/components/features/auth/auth-card";
import ResetPasswordForm from "@/components/features/auth/reset-password-form";
import Link from "@/platform/link";
import { useSearchParams } from "@/platform/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <AuthGuard requireAuth={false}>
      <main className="min-h-screen bg-richCream flex flex-col justify-center items-center px-4 py-12 md:py-24">
        <div className="w-full max-w-[480px] flex justify-start mb-4 animate-fade-up">
          <Link 
            href={loginHref}
            className="flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-all duration-150 hover:-translate-x-1"
          >
            ← Back to Sign In
          </Link>
        </div>
        <AuthCard
          title="Reset Password"
          subtitle="Verify your account email and create a new password"
          footerText="Remembered your password?"
          footerLinkText="Sign in here"
          footerLinkHref={loginHref}
        >
          <ResetPasswordForm />
        </AuthCard>
      </main>
    </AuthGuard>
  );
}

