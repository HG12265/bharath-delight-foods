import AuthGuard from "@/components/features/auth/auth-guard";
import AuthCard from "@/components/features/auth/auth-card";
import LoginForm from "@/components/features/auth/login-form";
import Link from "@/platform/link";

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <main className="min-h-screen bg-richCream flex flex-col justify-center items-center px-4 py-12 md:py-24">
        <div className="w-full max-w-[480px] flex justify-start mb-4 animate-fade-up">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-all duration-150 hover:-translate-x-1"
          >
            ← Back to Home
          </Link>
        </div>
        <AuthCard
          title="Sign In to Your Account"
          subtitle="Access your orders, track shipments, and manage settings"
          footerText="Don't have an account?"
          footerLinkText="Create one here"
          footerLinkHref="/register"
        >
          <LoginForm />
        </AuthCard>
      </main>
    </AuthGuard>
  );
}
