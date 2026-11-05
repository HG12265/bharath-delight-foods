"use client";

import React from "react";
import Link from "@/platform/link";
import { useRouter, usePathname } from "@/platform/navigation";
import { useMe, useLogout } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { User, ShoppingBag, Bell, MessageSquare, LogOut, Loader2, Heart } from "lucide-react";

interface AccountShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AccountShell: React.FC<AccountShellProps> = ({ title, description, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogout();
  
  const { data: meData, isPending: isMePending } = useMe();
  const { data: notificationsData } = useNotifications();

  const user = meData?.data;
  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      }
    });
  };

  const navItems = [
    { title: "Profile", href: "/account", icon: User },
    { title: "Orders", href: "/account/orders", icon: ShoppingBag },
    { title: "Wishlist", href: "/account/wishlist", icon: Heart },
    { 
      title: "Notifications", 
      href: "/account/notifications", 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { title: "Reviews", href: "/account/reviews", icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
      
      {/* Sidebar Navigation */}
      <div className="lg:col-span-3 space-y-4 animate-fade-up">
        {/* Profile Card Summary Greeting */}
        <div className="bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm text-center sm:text-left flex flex-col items-center sm:items-start gap-2">
          {isMePending ? (
            <Loader2 className="w-5 h-5 animate-spin text-burnishedGold" />
          ) : user ? (
            <>
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-burnishedGold">
                Namaskaram
              </p>
              <h2 className="font-serif text-lg font-bold text-deodharForest leading-tight truncate max-w-full">
                {user.personal_details?.first_name || "Valued Customer"} {user.personal_details?.last_name || ""}
              </h2>
              <p className="text-xs text-indianInk/60 truncate max-w-full">
                {user.email || user.phone}
              </p>
            </>
          ) : (
            <p className="text-xs text-indianInk/60">Session expired</p>
          )}
        </div>

        {/* Desktop Sidebar menu list */}
        <div className="hidden lg:block bg-white border border-burnishedGold/15 rounded-lg overflow-hidden shadow-sm">
          <nav className="divide-y divide-burnishedGold/10">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3.5 font-sans text-xs font-semibold tracking-wider uppercase transition-colors duration-150 ${
                    isActive 
                      ? "bg-deodharForest text-richCream" 
                      : "text-indianInk/70 hover:bg-richCream/30 hover:text-deodharForest"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-gheeGold" : "text-burnishedGold"}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive ? "bg-gheeGold text-deodharForest" : "bg-deodharForest text-richCream"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3.5 font-sans text-xs font-semibold tracking-wider uppercase text-warmSaffron hover:bg-warmSaffron/5 transition-colors duration-150 disabled:opacity-40 outline-none border-t border-burnishedGold/10 text-left"
            >
              <LogOut className="w-4 h-4 text-warmSaffron" />
              <span>{logoutMutation.isPending ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </nav>
        </div>

        {/* Mobile Horizontal Scrolling Tabs Navigation bar */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 border-b border-burnishedGold/15 mb-4 scrollbar-none select-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-1.5 shrink-0 px-4 py-2 border rounded-[4px] font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-200 ${
                  isActive 
                    ? "bg-deodharForest text-richCream border-transparent" 
                    : "bg-white text-indianInk/70 border-burnishedGold/15 hover:border-burnishedGold/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gheeGold" : "text-burnishedGold"}`} />
                <span>{item.title}</span>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                    isActive ? "bg-gheeGold text-deodharForest" : "bg-deodharForest text-richCream"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Mobile Logout button */}
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-1.5 shrink-0 px-4 py-2 border border-warmSaffron/15 hover:border-warmSaffron/35 bg-white text-warmSaffron rounded-[4px] font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-40 outline-none"
          >
            <LogOut className="w-3.5 h-3.5 text-warmSaffron" />
            <span>{logoutMutation.isPending ? "..." : "Sign Out"}</span>
          </button>
        </div>

      </div>

      {/* Main Account Area */}
      <div className="lg:col-span-9 space-y-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col gap-6">
          <div className="border-b border-burnishedGold/10 pb-4">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm font-sans text-indianInk/60 mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex-grow">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AccountShell;
