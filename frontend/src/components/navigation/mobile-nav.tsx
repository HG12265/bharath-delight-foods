"use client";

import React, { useEffect, useRef } from "react";
import Link from "@/platform/link";
import { useRouter } from "@/platform/navigation";
import { useLogout } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";
import Image from "@/platform/image";
import { X, User, LogIn, ChevronRight, LogOut, Package, Heart, UserPlus, ShieldCheck } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, user }) => {
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="brand-mobile-menu fixed inset-0 z-50 xl:hidden flex justify-end">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-indianInk/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div ref={panelRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigation menu" className="relative w-full max-w-[360px] h-full bg-richCream text-indianInk p-6 shadow-2xl flex flex-col justify-between z-10 transition-transform duration-300 border-l border-burnishedGold/15 animate-slide-in overflow-y-auto">
        <div>
          {/* Header with BD Logo */}
          <div className="flex items-center justify-between pb-5 border-b border-burnishedGold/15">
            <Link href="/" onClick={onClose} className="flex items-center select-none" aria-label="Bharath Delight">
              <Image
                src="/images/logo.png"
                alt="Bharath Delight"
                width={140}
                height={46}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-1 hover:text-burnishedGold text-deodharForest transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Welcome Banner if logged in */}
          {user && (
            <div className="mt-4 p-3 bg-white/80 border border-burnishedGold/20 rounded-lg shadow-sm">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C49A45]">
                Namaskaram
              </p>
              <p className="text-sm font-serif font-bold text-deodharForest truncate">
                {user.personal_details?.first_name || "Valued Customer"}
              </p>
              <p className="text-[11px] text-indianInk/60 truncate font-sans">
                {user.email || user.phone}
              </p>
            </div>
          )}

          {/* Main Nav Links */}
          <nav className="mt-6 flex flex-col gap-3.5">
            <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-indianInk/40 mb-1">
              Menu
            </p>
            {siteConfig.nav.main.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between text-xs uppercase font-semibold tracking-widest text-indianInk/85 hover:text-deodharForest pb-2 border-b border-burnishedGold/10 transition-colors duration-150"
              >
                <span>{item.title}</span>
                <ChevronRight className="w-4 h-4 text-burnishedGold/60" />
              </Link>
            ))}

            {/* Account section if logged in */}
            {user && (
              <>
                <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-indianInk/40 mt-3 mb-1">
                  My Account
                </p>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-between text-xs uppercase font-semibold tracking-widest text-indianInk/85 hover:text-deodharForest pb-2 border-b border-burnishedGold/10 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#C49A45]" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-burnishedGold/60" />
                </Link>

                <Link
                  href="/account/orders"
                  onClick={onClose}
                  className="flex items-center justify-between text-xs uppercase font-semibold tracking-widest text-indianInk/85 hover:text-deodharForest pb-2 border-b border-burnishedGold/10 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#C49A45]" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-burnishedGold/60" />
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-between text-xs uppercase font-semibold tracking-widest text-indianInk/85 hover:text-deodharForest pb-2 border-b border-burnishedGold/10 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-[#C49A45]" />
                    <span>Wishlist</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-burnishedGold/60" />
                </Link>
              </>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" onClick={onClose} className="flex items-center gap-2 py-3 text-sm font-semibold text-deodharForest border-b border-burnishedGold/10">
                <ShieldCheck className="w-4 h-4 text-burnishedGold" /> Admin Portal
              </Link>
            )}
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center justify-between text-xs uppercase font-semibold tracking-widest text-indianInk/85 hover:text-deodharForest pb-2 border-b border-burnishedGold/10 transition-colors duration-150"
            >
              <span>Shopping Cart</span>
              <ChevronRight className="w-4 h-4 text-burnishedGold/60" />
            </Link>
          </nav>
        </div>

        {/* Footer Area with Action Buttons */}
        <div className="mt-8 pt-5 border-t border-burnishedGold/15 flex flex-col gap-3">
          {user ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-deodharForest text-richCream border border-transparent rounded-[4px] font-sans text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 shadow-sm text-center"
                >
                  <User className="w-3.5 h-3.5 text-gheeGold" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/account/orders"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-[#FAF9F6] border border-burnishedGold/30 text-deodharForest rounded-[4px] font-sans text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 shadow-sm text-center"
                >
                  <Package className="w-3.5 h-3.5 text-burnishedGold" />
                  <span>Orders</span>
                </Link>
              </div>

              <button
                onClick={() => {
                  onClose();
                  handleLogout();
                }}
                disabled={logoutMutation.isPending}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-50 border border-rose-200 hover:border-rose-400 rounded-[4px] font-sans text-xs font-semibold tracking-widest text-rose-600 uppercase transition-all duration-200 disabled:opacity-50 mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>{logoutMutation.isPending ? "Signing Out..." : "Sign Out / Logout"}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 bg-deodharForest text-richCream border border-transparent hover:border-burnishedGold rounded-[4px] font-sans text-xs font-semibold tracking-widest uppercase transition-all duration-200 shadow-sm"
              >
                <LogIn className="w-4 h-4 text-gheeGold" />
                <span>Sign In / Login</span>
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-deodharForest border border-burnishedGold/30 hover:border-burnishedGold rounded-[4px] font-sans text-xs font-semibold tracking-widest uppercase transition-all duration-200 shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-burnishedGold" />
                <span>Create Account</span>
              </Link>
            </div>
          )}

          <p className="text-[9px] text-center text-indianInk/55 font-sans tracking-widest uppercase mt-1">
            © 2026 Bharath Delight Foods
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;