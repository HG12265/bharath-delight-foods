"use client";

import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import { usePathname, useSearchParams } from "@/platform/navigation";
import { useSession, useMe } from "@/hooks/use-auth";
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  LogIn, 
  Package
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: sessionData } = useSession();
  const { data: meData } = useMe();
  const user = sessionData?.data?.user || meData?.data;
  const isLoggedIn = Boolean(user);

  const [currentHash, setCurrentHash] = useState(
    typeof window !== "undefined" ? window.location.hash : ""
  );

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Update hash when pathname or search params change
  useEffect(() => {
    setCurrentHash(typeof window !== "undefined" ? window.location.hash : "");
  }, [pathname, searchParams]);

  const activeCategory = searchParams.get("category");
  const isHomeActive = pathname === "/";
  
  // Products is active when visiting product catalog or any PDP
  const isProductsActive = 
    (pathname === "/shop" && (currentHash === "#product-catalog" || currentHash === "#all-products")) ||
    pathname.startsWith("/products");

  // Categories is active when on /shop browsing category cards or filtered by category
  const isCategoriesActive = 
    (pathname === "/shop" && !isProductsActive) || 
    pathname.startsWith("/shop/");

  const isAuthOrOrdersActive = isLoggedIn 
    ? (pathname.startsWith("/account/orders") || pathname.startsWith("/account"))
    : (pathname === "/login" || pathname === "/register");

  // Smooth scroll handler when already on /shop
  const handleCategoriesClick = (e: React.MouseEvent) => {
    if (pathname === "/shop") {
      e.preventDefault();
      window.history.replaceState(null, "", "/shop");
      setCurrentHash("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProductsClick = (e: React.MouseEvent) => {
    if (pathname === "/shop") {
      e.preventDefault();
      window.history.replaceState(null, "", "/shop#product-catalog");
      setCurrentHash("#product-catalog");
      const el = document.getElementById("product-catalog");
      if (el) {
        const headerOffset = 80;
        const pos = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: pos, behavior: "smooth" });
      }
    }
  };

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#C49A45]/20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 items-center h-14 sm:h-16 max-w-lg mx-auto px-1">
        
        {/* 1. Home */}
        <Link
          href="/"
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

        {/* 2. Categories -> Navigates to /shop (Categories section at top) */}
        <Link
          href="/shop"
          onClick={handleCategoriesClick}
          className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
            isCategoriesActive 
              ? "text-[#0F3D2E]" 
              : "text-indianInk/55 hover:text-[#0F3D2E]"
          }`}
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
        </Link>

        {/* 3. Products -> Navigates to /shop#product-catalog (All Products section below) */}
        <Link
          href="/shop#product-catalog"
          onClick={handleProductsClick}
          className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
            isProductsActive 
              ? "text-[#0F3D2E]" 
              : "text-indianInk/55 hover:text-[#0F3D2E]"
          }`}
          aria-label="Products"
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
  );
};

export default MobileBottomNav;
