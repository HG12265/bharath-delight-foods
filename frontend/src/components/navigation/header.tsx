"use client";

import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import { useRouter, usePathname } from "@/platform/navigation";
import { useSession, useLogout, useMe } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { siteConfig } from "@/config/site";
import Image from "@/platform/image";
import {
  Menu,
  X,
  User,
  ShoppingCart,
  ShoppingBag,
  LogIn,
  LogOut,
  Package,
  ChevronDown,
  Heart,
  ShieldCheck
} from "lucide-react";
import MobileNav from "./mobile-nav";
import { useCartDrawer } from "@/providers/cart-drawer-provider";

/* Navigation items matching the reference design */
const NAV_LINKS = [
  { title: "Home", href: "/" },
  { title: "About Us", href: "/about" },
  { title: "Products", href: "/shop" },
  { title: "Our Promise", href: "/trust" },
  { title: "Contact Us", href: "/contact" },
];

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { openCart } = useCartDrawer();

  useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false); }, [pathname]);

  /* Scroll detection for subtle shadow */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: sessionData } = useSession({ staleTime: 5 * 60 * 1000 });
  const { data: meData } = useMe({ staleTime: 5 * 60 * 1000 });
  const user = sessionData?.data?.user || meData?.data;

  const logoutMutation = useLogout();
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  const { data: cartData } = useCart();
  const cartItemCount = cartData?.data?.summary?.quantity_total || 0;

  return (
    <>
      <header
        className={`brand-header sticky top-0 z-40 w-full bg-[#FAF7F0] transition-shadow duration-300 border-t border-[#F1E3CD]/80 border-b border-[#E6D4BA] ${isScrolled ? "shadow-[0_2px_16px_rgba(180,140,70,0.12)]" : "shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
          }`}
      >
        <div className="brand-header__inner w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[var(--header-height)] flex flex-nowrap items-center justify-between relative">

          {/* ── Logo (Left) ───────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3.5 select-none group py-1 shrink-0 z-10"
            aria-label="Bharath Delight - Home"
          >
            {/* Blue Crest Badge */}
            <Image
              src="/images/logo.png"
              alt="Bharath Delight"
              width={140}
              height={84}
              className="h-10 sm:h-12 lg:h-[48px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
              priority
            />

            {/* Tagline Lockup with Gold Arc - Hidden on mobile, visible on desktop/tablet */}
            <div className="hidden sm:flex flex-col justify-center leading-none select-none">
              <span className="font-serif italic font-semibold text-[14px] sm:text-[16px] lg:text-[17px] text-[#16382B] tracking-tight">
                Authenticity in
              </span>
              <div className="relative inline-block mt-0.5 sm:mt-1">
                <span className="font-serif italic font-semibold text-[14px] sm:text-[16px] lg:text-[17px] text-[#16382B] tracking-tight">
                  Every Delight
                </span>
                {/* Golden Smile Arc Underline */}
                <svg
                  viewBox="0 0 100 12"
                  className="w-full h-[6px] -mt-0.5 overflow-visible"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 2 3 Q 50 11 98 2"
                    stroke="#C49A45"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* ── Nav Links (Center) ─────────────────────────── */}
          <nav aria-label="Main navigation" className="brand-header__nav hidden xl:flex items-center gap-7">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`relative font-sans text-[14.5px] tracking-normal transition-colors duration-150 py-1 ${isActive
                    ? "text-[#16382B] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#C49A45] after:rounded-full"
                    : "text-[#2C3E33] hover:text-[#C49A45] font-medium"
                    }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions ─────────────────────────────── */}
          <div className="brand-header__actions hidden xl:flex items-center gap-3 shrink-0 z-10">
            {/* Divider line before cart */}
            <div className="h-6 w-px bg-[#E2D5C0] mx-0.5" />

            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-2 text-[#233428] hover:text-[#C49A45] transition-colors outline-none"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C49A45] text-white text-[9px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border border-white shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Account / Auth CTA */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* User Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 border border-[#E5D5BD] hover:border-[#C49A45] rounded-full font-sans text-xs font-semibold text-[#16382B] hover:text-[#C49A45] transition-all duration-200 bg-[#FDFBF7] shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#16382B]/10 flex items-center justify-center text-[#16382B]">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="max-w-[110px] truncate">
                      {user.personal_details?.first_name || "Account"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#16382B]/50 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-[#FAF7F0] border border-[#E5D5BD] rounded-xl shadow-xl py-1 z-40 animate-fade-up overflow-hidden">
                        {/* User Greeting Card */}
                        <div className="px-4 py-2.5 border-b border-[#E5D5BD]/60 bg-[#F4EDE0]">
                          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C49A45]">
                            Signed In
                          </p>
                          <p className="text-xs font-bold text-[#1E352F] truncate">
                            {user.personal_details?.first_name || "Valued"} {user.personal_details?.last_name || "Customer"}
                          </p>
                          <p className="text-[11px] text-[#1E352F]/60 truncate font-sans">
                            {user.email || user.phone}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E352F] hover:bg-[#FAF8F3] hover:text-[#C49A45] transition-colors"
                          >
                            <User className="w-4 h-4 text-[#C49A45]" />
                            <span>My Profile</span>
                          </Link>

                          <Link
                            href="/account/orders"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E352F] hover:bg-[#FAF8F3] hover:text-[#C49A45] transition-colors"
                          >
                            <Package className="w-4 h-4 text-[#C49A45]" />
                            <span>My Orders</span>
                          </Link>

                          <Link
                            href="/account/wishlist"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E352F] hover:bg-[#FAF8F3] hover:text-[#C49A45] transition-colors"
                          >
                            <Heart className="w-4 h-4 text-[#C49A45]" />
                            <span>Wishlist</span>
                          </Link>

                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E352F] hover:bg-[#FAF8F3] hover:text-[#C49A45] transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4 text-[#C49A45]" />
                              <span>Admin Portal</span>
                            </Link>
                          )}
                        </div>

                        {/* Dropdown Logout */}
                        <div className="border-t border-[#C49A45]/15 pt-1 pb-1 bg-red-50/20">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            disabled={logoutMutation.isPending}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <LogOut className="w-4 h-4 text-rose-600" />
                            <span>{logoutMutation.isPending ? "Signing Out…" : "Logout"}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  title="Logout"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200/80 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-600 rounded-full font-sans text-xs font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Login Button - Cream pill with gold arrow */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-[#E5D5BD] hover:border-[#C49A45] text-[#233428] hover:text-[#C49A45] rounded-full font-sans text-[13.5px] font-semibold transition-all duration-200 bg-[#FAF6EE] hover:bg-[#F2ECE0] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                >
                  <LogIn className="w-4 h-4 text-[#C49A45]" />
                  <span>Login</span>
                </Link>

                {/* Explore Products Button - Forest green pill */}
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#13372B] hover:bg-[#0E2C22] text-white rounded-full font-sans text-[13.5px] font-semibold shadow-sm transition-all duration-200"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>Explore Products</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile actions ────────────────────────────── */}
          <div className="brand-header__mobile flex xl:hidden items-center gap-2 z-10">
            <button
              onClick={openCart}
              className="relative p-2 text-[#1E352F] hover:text-[#C49A45] transition-colors outline-none"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C49A45] text-white text-[9px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border border-white shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1E352F] hover:text-[#C49A45] focus:outline-none transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
      />
    </>
  );
};

export default Header;