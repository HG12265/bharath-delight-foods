"use client";

import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { usePathname, useSearchParams, useRouter } from "@/platform/navigation";
import { useSession, useMe } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  LogIn, 
  Package, 
  X, 
  ChevronRight, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: sessionData } = useSession();
  const { data: meData } = useMe();
  const user = sessionData?.data?.user || meData?.data;
  const isLoggedIn = Boolean(user);

  const { data: categoriesRes } = useCategories();
  const categories = categoriesRes?.data || [];

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Close categories sheet when route changes
  useEffect(() => {
    setIsCategoriesOpen(false);
  }, [pathname, searchParams]);

  // Lock body scroll when categories sheet is open
  useEffect(() => {
    if (isCategoriesOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCategoriesOpen]);

  const activeCategory = searchParams.get("category");
  const isHomeActive = pathname === "/";
  const isCategoriesActive = isCategoriesOpen || (pathname === "/shop" && Boolean(activeCategory));
  const isProductsActive = (pathname === "/shop" && !activeCategory) || pathname.startsWith("/products");
  const isAuthOrOrdersActive = isLoggedIn 
    ? (pathname.startsWith("/account/orders") || pathname.startsWith("/account"))
    : (pathname === "/login" || pathname === "/register");

  const handleCategorySelect = (slug?: string) => {
    setIsCategoriesOpen(false);
    if (slug) {
      router.push(`/shop?category=${encodeURIComponent(slug)}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <>
      {/* ── Fixed Mobile Bottom Navbar (Strictly Hidden on Desktop) ── */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#C49A45]/20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-4 items-center h-14 sm:h-16 max-w-lg mx-auto px-1">
          
          {/* 1. Home */}
          <Link
            href="/"
            onClick={() => setIsCategoriesOpen(false)}
            className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
              isHomeActive 
                ? "text-[#0F3D2E]" 
                : "text-indianInk/55 hover:text-[#0F3D2E]"
            }`}
          >
            <div className={`w-11 h-6 rounded-full flex items-center justify-center transition-all ${
              isHomeActive ? "bg-[#0F3D2E]/10" : ""
            }`}>
              <Home className={`w-4 h-4 ${isHomeActive ? "text-[#0F3D2E] stroke-[2.3]" : "text-indianInk/60"}`} />
            </div>
            <span className={`text-[10px] font-sans tracking-tight mt-0.5 ${
              isHomeActive ? "font-bold text-[#0F3D2E]" : "font-medium text-indianInk/65"
            }`}>
              Home
            </span>
          </Link>

          {/* 2. Categories */}
          <button
            type="button"
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 cursor-pointer ${
              isCategoriesActive 
                ? "text-[#0F3D2E]" 
                : "text-indianInk/55 hover:text-[#0F3D2E]"
            }`}
            aria-expanded={isCategoriesOpen}
            aria-label="Categories"
          >
            <div className={`w-11 h-6 rounded-full flex items-center justify-center transition-all ${
              isCategoriesActive ? "bg-[#0F3D2E]/10" : ""
            }`}>
              <LayoutGrid className={`w-4 h-4 ${isCategoriesActive ? "text-[#0F3D2E] stroke-[2.3]" : "text-indianInk/60"}`} />
            </div>
            <span className={`text-[10px] font-sans tracking-tight mt-0.5 ${
              isCategoriesActive ? "font-bold text-[#0F3D2E]" : "font-medium text-indianInk/65"
            }`}>
              Categories
            </span>
          </button>

          {/* 3. Products */}
          <Link
            href="/shop"
            onClick={() => setIsCategoriesOpen(false)}
            className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
              isProductsActive 
                ? "text-[#0F3D2E]" 
                : "text-indianInk/55 hover:text-[#0F3D2E]"
            }`}
          >
            <div className={`w-11 h-6 rounded-full flex items-center justify-center transition-all ${
              isProductsActive ? "bg-[#0F3D2E]/10" : ""
            }`}>
              <ShoppingBag className={`w-4 h-4 ${isProductsActive ? "text-[#0F3D2E] stroke-[2.3]" : "text-indianInk/60"}`} />
            </div>
            <span className={`text-[10px] font-sans tracking-tight mt-0.5 ${
              isProductsActive ? "font-bold text-[#0F3D2E]" : "font-medium text-indianInk/65"
            }`}>
              Products
            </span>
          </Link>

          {/* 4. Login (New user) OR My Orders (After login) */}
          {isLoggedIn ? (
            <Link
              href="/account/orders"
              onClick={() => setIsCategoriesOpen(false)}
              className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
                isAuthOrOrdersActive 
                  ? "text-[#0F3D2E]" 
                  : "text-indianInk/55 hover:text-[#0F3D2E]"
              }`}
            >
              <div className={`w-11 h-6 rounded-full flex items-center justify-center transition-all ${
                isAuthOrOrdersActive ? "bg-[#0F3D2E]/10" : ""
              }`}>
                <Package className={`w-4 h-4 ${isAuthOrOrdersActive ? "text-[#0F3D2E] stroke-[2.3]" : "text-indianInk/60"}`} />
              </div>
              <span className={`text-[10px] font-sans tracking-tight mt-0.5 truncate max-w-[70px] ${
                isAuthOrOrdersActive ? "font-bold text-[#0F3D2E]" : "font-medium text-indianInk/65"
              }`}>
                My Orders
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsCategoriesOpen(false)}
              className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
                isAuthOrOrdersActive 
                  ? "text-[#0F3D2E]" 
                  : "text-indianInk/55 hover:text-[#0F3D2E]"
              }`}
            >
              <div className={`w-11 h-6 rounded-full flex items-center justify-center transition-all ${
                isAuthOrOrdersActive ? "bg-[#0F3D2E]/10" : ""
              }`}>
                <LogIn className={`w-4 h-4 ${isAuthOrOrdersActive ? "text-[#0F3D2E] stroke-[2.3]" : "text-indianInk/60"}`} />
              </div>
              <span className={`text-[10px] font-sans tracking-tight mt-0.5 ${
                isAuthOrOrdersActive ? "font-bold text-[#0F3D2E]" : "font-medium text-indianInk/65"
              }`}>
                Login
              </span>
            </Link>
          )}

        </div>
      </nav>

      {/* ── Categories Bottom Sheet Modal ── */}
      {isCategoriesOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsCategoriesOpen(false)}
          />

          {/* Sliding Sheet */}
          <div className="relative z-10 bg-[#FFFDF7] rounded-t-2xl border-t border-[#C49A45]/25 shadow-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up">
            
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#C49A45]/15">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0F3D2E]/10 flex items-center justify-center text-[#0F3D2E]">
                  <LayoutGrid className="w-4 h-4 text-[#C49A45]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0F3D2E]">
                    Explore Categories
                  </h3>
                  <p className="text-[10px] font-sans text-indianInk/60">
                    Handcrafted traditional regional ghee collection
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoriesOpen(false)}
                className="p-1.5 text-indianInk/50 hover:text-[#0F3D2E] rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close categories"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories List / Grid */}
            <div className="py-4 space-y-2.5">
              {/* All Products Option */}
              <button
                type="button"
                onClick={() => handleCategorySelect()}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border border-[#C49A45]/20 bg-white hover:border-[#C49A45] hover:bg-[#FAF9F6] transition-all shadow-xs text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#0F3D2E]/5 border border-[#C49A45]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#C49A45]" />
                  </div>
                  <div>
                    <span className="font-serif text-sm font-bold text-[#0F3D2E] block">
                      All Products
                    </span>
                    <span className="text-[10px] font-sans text-indianInk/55">
                      Explore the complete Bharath Delight catalog
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C49A45] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Dynamic Categories from Catalog */}
              {categories.map((cat: any) => {
                const isSelected = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id || cat._id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all shadow-xs text-left group ${
                      isSelected
                        ? "border-[#0F3D2E] bg-[#0F3D2E]/5"
                        : "border-[#C49A45]/15 bg-white hover:border-[#C49A45] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md bg-[#FFFDF0] border border-[#C49A45]/20 flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={cat.image_url || "/images/category-ghee.png"}
                          alt={cat.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-serif text-sm font-bold text-[#0F3D2E] block">
                          {cat.name}
                        </span>
                        {cat.description ? (
                          <span className="text-[10px] font-sans text-indianInk/55 line-clamp-1">
                            {cat.description}
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans text-[#C49A45] font-semibold uppercase tracking-wider">
                            Explore Collection &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#C49A45] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>

            {/* View Full Store Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleCategorySelect()}
                className="w-full py-2.5 bg-[#0F3D2E] text-white rounded-md text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#0F3D2E]/90 transition-colors shadow-sm"
              >
                <span>View All In Store</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C49A45]" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
