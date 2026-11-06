"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import { useRouter, usePathname } from "@/platform/navigation";
import { useMe, useLogout } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import AuthGuard from "@/components/features/auth/auth-guard";
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Truck,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  User,
  Bell,
  Moon,
  Sun,
  Tags,
  FolderTree,
  FileSpreadsheet,
  BadgePercent,
} from "lucide-react";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      <AdminRoleGuard>{children}</AdminRoleGuard>
    </AuthGuard>
  );
}

function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogout();
  const { data: meData, isPending } = useMe();
  const { data: notificationsRes } = useNotifications();

  const user = meData?.data;
  const role = user?.role;
  const unreadCount = notificationsRes?.data?.filter(n => !n.is_read).length || 0;

  const firstInitial = user?.personal_details?.first_name?.[0] || "";
  const lastInitial = user?.personal_details?.last_name?.[0] || "";
  const initials = (firstInitial + lastInitial).toUpperCase() || (user?.email?.[0] || "AD").toUpperCase();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      }
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-burnishedGold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indianInk/60 text-xs tracking-wider uppercase font-medium">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // 1. Check if user is Admin or Warehouse
  const isAuthorized = role === "admin" || role === "warehouse";

  if (!isAuthorized) {
    return <ForbiddenScreen title="Access Denied" message="Only ADMIN and WAREHOUSE roles are permitted to access this panel." onLogout={handleLogout} />;
  }

  // 2. If Warehouse, check if attempting to access restricted pages
  const isWarehouse = role === "warehouse";
  const restrictedPaths = ["/admin/payments", "/admin/reviews", "/admin/settings", "/admin/categories", "/admin/offers"];
  const isPathRestricted = restrictedPaths.some(path => pathname.startsWith(path));

  if (isWarehouse && isPathRestricted) {
    return <ForbiddenScreen title="Unauthorized Section" message="Warehouse personnel are restricted from accessing payments, reviews, offers, and settings." onLogout={handleLogout} />;
  }

  // Define sidebar items based on role
  const allNavItems = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "warehouse"] },
    { title: "Orders", href: "/admin/orders", icon: ShoppingBag, roles: ["admin", "warehouse"] },
    { title: "Reports", href: "/admin/reports", icon: FileSpreadsheet, roles: ["admin", "warehouse"] },
    { title: "Products", href: "/admin/products", icon: Tags, roles: ["admin", "warehouse"] },
    { title: "Offers", href: "/admin/offers", icon: BadgePercent, roles: ["admin"] },
    { title: "Categories", href: "/admin/categories", icon: FolderTree, roles: ["admin"] },
    { title: "Payments", href: "/admin/payments", icon: CreditCard, roles: ["admin"] },
    { title: "Shipments", href: "/admin/shipments", icon: Truck, roles: ["admin", "warehouse"] },
    { title: "Inventory", href: "/admin/inventory", icon: Package, roles: ["admin", "warehouse"] },
    { title: "Reviews", href: "/admin/reviews", icon: MessageSquare, roles: ["admin"] },
    { title: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role || ""));

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-indianInk flex flex-col lg:flex-row font-sans">

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-deodharForest text-richCream shrink-0 border-r border-burnishedGold/10">

        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-burnishedGold/10 bg-deodharForest/95">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-gheeGold tracking-wide">
              Bharath Delight Admin
            </span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-burnishedGold/10 bg-deodharForest/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-richCream/15 flex items-center justify-center text-gheeGold border border-burnishedGold/25">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-richCream truncate">
                {user?.personal_details?.first_name || "Staff"} {user?.personal_details?.last_name || ""}
              </p>
              <p className="text-[10px] font-semibold text-gheeGold uppercase tracking-wider">
                {role}
              </p>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3.5 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 hover:translate-x-1 border-l-4 ${isActive
                    ? "bg-[#072118] text-richCream border-gheeGold shadow-[inset_0_0_8px_rgba(0,0,0,0.6),_0_0_12px_rgba(217,164,65,0.2)]"
                    : "text-richCream/80 border-transparent hover:bg-richCream/10 hover:text-richCream"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors group-hover:text-gheeGold ${isActive ? "text-gheeGold" : "text-gheeGold/70"}`} />
                  <span className={isActive ? "drop-shadow-[0_0_1px_rgba(217,164,65,0.4)]" : ""}>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-burnishedGold/10">
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-richCream/60 hover:text-richCream hover:bg-white/5 rounded transition-colors duration-150 disabled:opacity-40 outline-none text-left"
          >
            <LogOut className="w-4 h-4 text-gheeGold" />
            <span>{logoutMutation.isPending ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Header and Mobile nav */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Mobile Header / Top Bar */}
        <header className="lg:hidden h-16 bg-deodharForest text-richCream flex items-center justify-between px-4 border-b border-burnishedGold/10 shrink-0">
          <Link href="/admin" className="font-serif font-bold text-sm text-gheeGold tracking-widest uppercase">
            Bharath Delight Admin
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold uppercase tracking-widest border border-gheeGold/40 px-2 py-0.5 rounded text-gheeGold bg-gheeGold/5">
              {role}
            </span>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="p-1 outline-none text-richCream/80 hover:text-richCream"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-gheeGold" />
            </button>
          </div>
        </header>

        {/* Mobile Sub-Navigation Tabs */}
        <div className="lg:hidden bg-deodharForest text-richCream border-b border-burnishedGold/10 px-4 py-2 overflow-x-auto scrollbar-none shrink-0 flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 border rounded-[4px] font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-200 ${isActive
                    ? "bg-gheeGold text-deodharForest border-transparent"
                    : "bg-deodharForest text-richCream/80 border-burnishedGold/15 hover:border-burnishedGold/30"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-deodharForest" : "text-gheeGold"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Top Header Bar (Desktop SaaS top-bar) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-burnishedGold/15 px-8 items-center justify-between shrink-0">
          <div>
            <span className="font-serif font-bold text-sm uppercase tracking-wider text-deodharForest">
              {pathname === "/admin" ? "Dashboard" : pathname.replace("/admin/", "").replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-6">

            {/* Notifications icon */}
            <Link href="/admin/orders" className="relative p-1.5 hover:bg-[#FAF9F6] rounded-full text-indianInk/60 hover:text-deodharForest transition-colors" title="Notifications">
              <Bell className="w-5 h-5 text-burnishedGold" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>



            {/* Profile Pill */}
            <div className="flex items-center gap-3 pl-4 border-l border-burnishedGold/15">
              <div className="w-8 h-8 rounded-full bg-deodharForest text-richCream flex items-center justify-center font-bold text-xs border border-burnishedGold/25">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-indianInk">
                  {user?.personal_details?.first_name || "Admin"}
                </p>
                <p className="text-[9px] font-bold text-gheeGold uppercase tracking-widest leading-none mt-0.5">
                  {role}
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}

interface ForbiddenScreenProps {
  title: string;
  message: string;
  onLogout: () => void;
}

function ForbiddenScreen({ title, message, onLogout }: ForbiddenScreenProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center px-4 font-sans text-center">
      <div className="bg-white border border-burnishedGold/15 rounded-lg p-8 shadow-md max-w-md w-full flex flex-col items-center gap-6 animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-deodharForest mb-2">
            {title}
          </h2>
          <p className="text-sm text-indianInk/70 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 text-center font-sans text-xs font-bold uppercase tracking-wider border border-burnishedGold/35 hover:bg-richCream/10 text-deodharForest rounded transition duration-200"
          >
            Back to Shop
          </Link>
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 px-4 text-center font-sans text-xs font-bold uppercase tracking-wider bg-deodharForest text-richCream hover:bg-deodharForest/90 rounded transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
