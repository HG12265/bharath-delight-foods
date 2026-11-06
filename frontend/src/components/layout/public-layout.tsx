"use client";

import React from "react";
import Header from "../navigation/header";
import Footer from "../navigation/footer";
import MobileBottomNav from "../navigation/mobile-bottom-nav";
import dynamic from "@/platform/dynamic";

const CartDrawer = dynamic(() => import("../features/cart/cart-drawer"), {
  ssr: false,
});

interface PublicLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="flex flex-col min-h-screen bg-richCream text-indianInk">
      {/* Shared sticky Header */}
      <Header />

      {/* Global Slideout Cart Drawer */}
      <CartDrawer />

      {/* Main Content Area */}
      <main className="flex-grow pb-16 md:pb-0">
        {children}
      </main>

      {/* Shared Footer */}
      {!hideFooter && <Footer />}

      {/* Fixed Mobile Bottom Navbar (Mobile Only) */}
      <MobileBottomNav />
    </div>
  );
};

export default PublicLayout;
