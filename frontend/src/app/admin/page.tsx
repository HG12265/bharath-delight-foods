"use client";

import React from "react";
import Link from "@/platform/link";
import { useMe } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import dynamic from "@/platform/dynamic";

const LineChart = dynamic(() => import("@/components/ui/svg-charts").then((mod) => ({ default: mod.LineChart })), {
  ssr: false,
});
const BarChart = dynamic(() => import("@/components/ui/svg-charts").then((mod) => ({ default: mod.BarChart })), {
  ssr: false,
});
const ProgressDistribution = dynamic(() => import("@/components/ui/svg-charts").then((mod) => ({ default: mod.ProgressDistribution })), {
  ssr: false,
});
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  AlertTriangle, 
  MessageSquare, 
  Truck,
  Users,
  Package,
  ArrowRight,
  Clock,
  Loader2
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: meData } = useMe();
  const { data: dashboardRes, isPending, error } = useDashboard();

  const user = meData?.data;
  const role = user?.role;
  const isAdmin = role === "admin";

  const stats = dashboardRes?.data;

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  if (error || !dashboardRes?.success) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Failed to load dashboard statistics. Please check your credentials or connection.
      </div>
    );
  }

  // Currency Formatter
  const formatCurrency = (val?: number) => {
    if (val === undefined) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

  // Helper for status badge
  const getFulfillmentBadgeClass = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "packed": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-burnishedGold/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1 font-sans">
            Operations summary and alerts. Signed in as <span className="font-bold text-deodharForest">{user?.personal_details?.first_name || "Staff"}</span> ({role}).
          </p>
        </div>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* ROW 1: Revenue, Orders, Customers, Products */}
        
        {/* Total Revenue - ADMIN only */}
        {isAdmin && (
          <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-green-50 flex items-center justify-center text-green-700 border border-green-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
                Total Revenue
              </p>
              <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
                {formatCurrency(stats?.total_revenue)}
              </h3>
            </div>
          </div>
        )}

        {/* Total Orders */}
        <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
              Total Orders
            </p>
            <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
              {stats?.total_orders || 0}
            </h3>
          </div>
        </div>

        {/* Total Customers - ADMIN only */}
        {isAdmin && (
          <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
                Total Customers
              </p>
              <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
                {stats?.total_customers || 0}
              </h3>
            </div>
          </div>
        )}

        {/* Total Products */}
        <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
              Total Products
            </p>
            <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
              {stats?.total_products || 0}
            </h3>
          </div>
        </div>

        {/* ROW 2: Payments, Shipments, Low Stock, Reviews */}

        {/* Pending Payment Proofs - ADMIN only */}
        {isAdmin && (
          <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
                Pending Payments
              </p>
              <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
                {stats?.pending_payments || 0}
              </h3>
            </div>
          </div>
        )}

        {/* Active Shipments */}
        <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
              Active Shipments
            </p>
            <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
              {(stats?.confirmed_orders || 0) + (stats?.shipped_orders || 0)}
            </h3>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-red-50 flex items-center justify-center text-red-700 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
              Low Stock Alerts
            </p>
            <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
              {stats?.low_stock_count || 0}
            </h3>
          </div>
        </div>

        {/* Pending Reviews - ADMIN only */}
        {isAdmin && (
          <div className="bg-white border border-burnishedGold/15 rounded p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-indigo-50 flex items-center justify-center text-indigo-700 border border-indigo-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indianInk/50 uppercase tracking-widest font-sans">
                Pending Reviews
              </p>
              <h3 className="font-serif text-xl font-bold text-deodharForest mt-0.5">
                {stats?.pending_review_count || 0}
              </h3>
            </div>
          </div>
        )}

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <LineChart title="Revenue Trend" data={undefined} />
        )}
        <div className={isAdmin ? "" : "lg:col-span-2"}>
          <BarChart title="Orders Trend" data={undefined} />
        </div>
        <div>
          <ProgressDistribution title="Product Sales Distribution" data={undefined} />
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders Preview */}
        <div className="bg-white border border-burnishedGold/15 rounded shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-burnishedGold/10 pb-3">
            <h2 className="font-serif text-base font-bold text-deodharForest flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-burnishedGold" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-[10px] font-bold text-burnishedGold hover:text-deodharForest flex items-center gap-1 uppercase tracking-widest transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto min-w-full">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b border-burnishedGold/10 text-indianInk/50">
                  <th className="py-2.5 font-bold uppercase tracking-wider">Order</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Customer</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Total</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burnishedGold/10">
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-richCream/5">
                      <td className="py-2.5 font-semibold text-deodharForest">#{o.order_number}</td>
                      <td className="py-2.5 truncate max-w-[120px]">{o.customer_snapshot.first_name || o.customer_snapshot.email}</td>
                      <td className="py-2.5 font-medium">{formatCurrency(o.pricing.grand_total)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getFulfillmentBadgeClass(o.fulfillment_status)}`}>
                          {o.fulfillment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-indianInk/40 italic">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Preview */}
        <div className="bg-white border border-burnishedGold/15 rounded shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-burnishedGold/10 pb-3">
            <h2 className="font-serif text-base font-bold text-deodharForest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Low Stock Alerts
            </h2>
            <Link href="/admin/inventory" className="text-[10px] font-bold text-burnishedGold hover:text-deodharForest flex items-center gap-1 uppercase tracking-widest transition-colors">
              Manage Stock <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto min-w-full">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b border-burnishedGold/10 text-indianInk/50">
                  <th className="py-2.5 font-bold uppercase tracking-wider">SKU</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">On Hand</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Reserved</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Safety Lvl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burnishedGold/10">
                {stats?.low_stock_alerts && stats.low_stock_alerts.length > 0 ? (
                  stats.low_stock_alerts.map((item) => (
                    <tr key={item.id} className="hover:bg-richCream/5">
                      <td className="py-2.5 font-semibold text-red-700">{item.sku}</td>
                      <td className="py-2.5 font-medium">{item.on_hand_total}</td>
                      <td className="py-2.5 text-indianInk/60">{item.reserved_total}</td>
                      <td className="py-2.5 text-indianInk/60 font-semibold">{item.safety_stock_level}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-green-700 font-medium italic">
                      🟢 Healthy Inventory — No products require replenishment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ADMIN ONLY lower section */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Payment Gateway Status */}
          <div className="bg-white border border-burnishedGold/15 rounded shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-burnishedGold/10 pb-3">
              <h2 className="font-serif text-base font-bold text-deodharForest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-burnishedGold" />
                Payment Gateway (PhonePe)
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                ● Live & Automated
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-[#FAF9F6] border border-burnishedGold/10 rounded flex items-center justify-between">
                <div>
                  <p className="font-bold text-deodharForest">PhonePe Standard Checkout V2</p>
                  <p className="text-[11px] text-indianInk/60 mt-0.5">
                    UPI, Cards & NetBanking with 100% automated instant verification.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-[#5f259f] text-white px-2.5 py-1 rounded">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-indianInk/50 italic">
                Manual UPI screenshot submissions are disabled. All payments are verified directly by PhonePe.
              </p>
            </div>
          </div>

          {/* Pending Reviews Preview */}
          <div className="bg-white border border-burnishedGold/15 rounded shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-burnishedGold/10 pb-3">
              <h2 className="font-serif text-base font-bold text-deodharForest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-burnishedGold" />
                Pending Review Moderations
              </h2>
              <Link href="/admin/reviews" className="text-[10px] font-bold text-burnishedGold hover:text-deodharForest flex items-center gap-1 uppercase tracking-widest transition-colors">
                Moderate Reviews <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex-grow space-y-3">
              {stats?.pending_reviews && stats.pending_reviews.length > 0 ? (
                stats.pending_reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="border border-burnishedGold/10 rounded p-3 bg-[#FAF9F6]/50 flex flex-col gap-1.5 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-deodharForest uppercase tracking-widest">
                        Rating: {r.rating} ★
                      </span>
                      <span className="text-[9px] text-indianInk/50">
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-indianInk truncate">
                      "{r.title}"
                    </p>
                    <p className="text-[11px] text-indianInk/70 line-clamp-1">
                      {r.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-indianInk/40 italic py-4 text-center">
                  No reviews pending moderation.
                </p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
