"use client";

import React from "react";
import Link from "@/platform/link";
import AccountShell from "@/components/features/account/account-shell";
import OrderStatusBadge from "@/components/features/account/order-status-badge";
import { useMe } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useNotifications } from "@/hooks/use-notifications";
import { formatINR } from "@/lib/utils";
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Bell, 
  User, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function AccountPage() {
  const { data: meData } = useMe();
  const { data: ordersData } = useOrders();
  const { data: notificationsData } = useNotifications();

  const user = meData?.data;
  const orders = ordersData?.data || [];
  const notifications = notificationsData?.data || [];

  // Compute stat card numbers dynamically
  const totalOrders = orders.length;
  
  const pendingPaymentsCount = orders.filter(
    (o) => o.order_status === "pending_payment" && o.payment_status !== "paid"
  ).length;

  const activeShipmentsCount = orders.filter(
    (o) => o.fulfillment_status === "shipped" || o.fulfillment_status === "packed"
  ).length;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Retrieve 2 most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AccountShell 
      title="Customer Dashboard" 
      description="Welcome to your account portal. Monitor your orders, notifications, and profile details."
    >
      <div className="space-y-8 animate-fade-up">
        
        {/* PROMINENT MY ORDERS BANNER */}
        <div className="bg-gradient-to-r from-deodharForest via-[#1a3a30] to-deodharForest text-richCream rounded-lg p-5 sm:p-6 shadow-md border border-burnishedGold/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gheeGold block">
              Customer Orders Portal
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
              Track & Manage Your Orders
            </h2>
            <p className="text-xs text-richCream/80 font-sans max-w-xl">
              View your order history, download tax invoices, track active courier shipments, and reorder your favorite ghee.
            </p>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gheeGold hover:bg-[#d8a846] text-deodharForest font-sans text-xs font-bold tracking-widest uppercase rounded-[4px] shadow transition-all duration-200 shrink-0 hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4 text-deodharForest" />
            <span>Go to My Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* STATS GRID - Clickable to corresponding pages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Orders */}
          <Link 
            href="/account/orders"
            className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-4 flex items-center gap-3 shadow-sm hover:border-burnishedGold/40 hover:bg-white hover:shadow transition-all group"
          >
            <div className="w-10 h-10 bg-deodharForest/5 group-hover:bg-deodharForest group-hover:text-white border border-burnishedGold/15 rounded-full flex items-center justify-center shrink-0 text-deodharForest transition-colors">
              <ShoppingBag className="w-5 h-5 text-gheeGold group-hover:text-gheeGold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indianInk/50 block group-hover:text-deodharForest transition-colors">
                Total Orders
              </span>
              <span className="text-xl font-bold font-sans text-deodharForest">
                {totalOrders}
              </span>
            </div>
          </Link>

          {/* Card 2: Pending Payments */}
          <Link 
            href="/account/orders"
            className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-4 flex items-center gap-3 shadow-sm hover:border-burnishedGold/40 hover:bg-white hover:shadow transition-all group"
          >
            <div className="w-10 h-10 bg-deodharForest/5 group-hover:bg-deodharForest group-hover:text-white border border-burnishedGold/15 rounded-full flex items-center justify-center shrink-0 text-deodharForest transition-colors">
              <CreditCard className="w-5 h-5 text-gheeGold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indianInk/50 block group-hover:text-deodharForest transition-colors">
                Unpaid Orders
              </span>
              <span className="text-xl font-bold font-sans text-deodharForest">
                {pendingPaymentsCount}
              </span>
            </div>
          </Link>

          {/* Card 3: Active Shipments */}
          <Link 
            href="/account/orders"
            className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-4 flex items-center gap-3 shadow-sm hover:border-burnishedGold/40 hover:bg-white hover:shadow transition-all group"
          >
            <div className="w-10 h-10 bg-deodharForest/5 group-hover:bg-deodharForest group-hover:text-white border border-burnishedGold/15 rounded-full flex items-center justify-center shrink-0 text-deodharForest transition-colors">
              <Truck className="w-5 h-5 text-gheeGold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indianInk/50 block group-hover:text-deodharForest transition-colors">
                In Dispatch
              </span>
              <span className="text-xl font-bold font-sans text-deodharForest">
                {activeShipmentsCount}
              </span>
            </div>
          </Link>

          {/* Card 4: Unread Notifications */}
          <Link 
            href="/account/notifications"
            className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-4 flex items-center gap-3 shadow-sm hover:border-burnishedGold/40 hover:bg-white hover:shadow transition-all group"
          >
            <div className="w-10 h-10 bg-deodharForest/5 group-hover:bg-deodharForest group-hover:text-white border border-burnishedGold/15 rounded-full flex items-center justify-center shrink-0 text-deodharForest transition-colors">
              <Bell className="w-5 h-5 text-gheeGold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indianInk/50 block group-hover:text-deodharForest transition-colors">
                Unread Inbox
              </span>
              <span className="text-xl font-bold font-sans text-deodharForest">
                {unreadCount}
              </span>
            </div>
          </Link>

        </div>

        {/* TWO PANEL CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Profile Details Block (Left) */}
          <div className="md:col-span-5 bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-deodharForest border-b border-burnishedGold/10 pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-burnishedGold" /> Personal Profile
            </h3>

            {user && (
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <span className="text-indianInk/50 block font-semibold uppercase tracking-wider text-[9px]">
                    First Name
                  </span>
                  <span className="text-sm font-semibold text-indianInk">
                    {user.personal_details?.first_name || "N/A"}
                  </span>
                </div>
                
                <div>
                  <span className="text-indianInk/50 block font-semibold uppercase tracking-wider text-[9px]">
                    Last Name
                  </span>
                  <span className="text-sm font-semibold text-indianInk">
                    {user.personal_details?.last_name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-indianInk/50 block font-semibold uppercase tracking-wider text-[9px]">
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-indianInk truncate block">
                    {user.email || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-indianInk/50 block font-semibold uppercase tracking-wider text-[9px]">
                    Phone Number
                  </span>
                  <span className="text-sm font-semibold text-indianInk">
                    {user.phone || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-indianInk/50 block font-semibold uppercase tracking-wider text-[9px]">
                    Account Role
                  </span>
                  <span className="text-sm font-semibold text-indianInk uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-success inline" /> {user.role}
                  </span>
                </div>

                <div className="pt-2 border-t border-burnishedGold/10">
                  <Link
                    href="/account/orders"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-deodharForest/5 hover:bg-deodharForest text-deodharForest hover:text-white border border-burnishedGold/25 rounded font-sans text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View My Orders</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Orders Preview Block (Right) */}
          <div className="md:col-span-7 bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-burnishedGold/10 pb-2">
              <h3 className="font-serif text-base font-bold text-deodharForest flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-burnishedGold" /> Recent Orders
              </h3>
              <Link
                href="/account/orders"
                className="text-[11px] font-sans font-bold uppercase tracking-wider text-burnishedGold hover:text-deodharForest flex items-center gap-1 transition-colors"
              >
                <span>View All Orders</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-indianInk/60 font-sans">
                  You haven't placed any orders yet.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    href="/shop"
                    className="inline-block px-4 py-2 bg-deodharForest text-richCream font-sans text-[10px] font-bold tracking-widest uppercase rounded-[4px] border border-transparent hover:border-gheeGold"
                  >
                    Shop Ghee
                  </Link>
                  <Link
                    href="/account/orders"
                    className="inline-block px-4 py-2 border border-burnishedGold/30 text-deodharForest font-sans text-[10px] font-bold tracking-widest uppercase rounded-[4px] hover:border-deodharForest"
                  >
                    Orders Portal
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-3 border border-burnishedGold/10 rounded-[4px] hover:border-burnishedGold/25 transition-all duration-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-sans"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-deodharForest">
                          #{order.order_number}
                        </span>
                        <span className="text-[10px] text-indianInk/40">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <OrderStatusBadge type="order" value={order.order_status} />
                        <OrderStatusBadge type="payment" value={order.payment_status} />
                      </div>
                    </div>

                    <div className="flex justify-between sm:justify-end items-center gap-4 sm:text-right shrink-0">
                      <div>
                        <span className="text-indianInk/50 block text-[9px] uppercase tracking-wider">
                          Amount
                        </span>
                        <span className="font-bold text-indianInk">
                          {formatINR(order.pricing.grand_total)}
                        </span>
                      </div>
                      <Link
                        href={`/order/${order.id}`}
                        className="px-3 py-1.5 bg-deodharForest/5 border border-burnishedGold/15 hover:border-deodharForest text-deodharForest font-semibold text-[10px] uppercase tracking-widest rounded transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AccountShell>
  );
}
