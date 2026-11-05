"use client";

import React from "react";
import Header from "../navigation/header";
import Footer from "../navigation/footer";
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
      <main className="flex-grow">
        {children}
      </main>

      {/* Shared Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;
