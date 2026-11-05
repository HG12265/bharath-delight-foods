"use client";

import React, { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import { useAdminOrders } from "@/hooks/use-orders";
import orderService from "@/services/order-service";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";

export default function AdminReportsPage() {
  const { data: ordersRes, isPending, refetch, isRefetching } = useAdminOrders();
  const allOrders = useMemo(() => ordersRes?.data || [], [ordersRes]);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("all_time");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Export loading states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Compute date range based on preset
  const computedDateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { start, end: now.toISOString() };
    }
    if (datePreset === "last_7_days") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { start: past, end: now.toISOString() };
    }
    if (datePreset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { start, end: now.toISOString() };
    }
    if (datePreset === "custom" && startDate && endDate) {
      return {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate + "T23:59:59").toISOString(),
      };
    }
    return { start: undefined, end: undefined };
  }, [datePreset, startDate, endDate]);

  // Client-side preview filtered orders
  const previewOrders = useMemo(() => {
    let result = [...allOrders];

    // Status filter
    if (selectedStatus !== "all") {
      const s = selectedStatus.toLowerCase();
      if (s === "pending") {
        result = result.filter(
          (o) =>
            o.order_status === "pending_payment" ||
            o.fulfillment_status === "pending" ||
            o.payment_status === "pending"
        );
      } else if (s === "delivered") {
        result = result.filter((o) => o.fulfillment_status === "delivered");
      } else if (s === "shipped") {
        result = result.filter((o) => o.fulfillment_status === "shipped");
      } else if (s === "paid") {
        result = result.filter((o) => o.payment_status === "paid");
      } else if (s === "confirmed") {
        result = result.filter((o) => o.order_status === "confirmed");
      } else if (s === "cancelled") {
        result = result.filter(
          (o) => o.order_status === "cancelled" || o.fulfillment_status === "cancelled"
        );
      }
    }

    // Date range filter
    if (computedDateRange.start) {
      result = result.filter((o) => new Date(o.created_at) >= new Date(computedDateRange.start!));
    }
    if (computedDateRange.end) {
      result = result.filter((o) => new Date(o.created_at) <= new Date(computedDateRange.end!));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_snapshot.email.toLowerCase().includes(q) ||
          (o.shipping_address_snapshot.full_name || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [allOrders, selectedStatus, computedDateRange, searchQuery]);

  // Summary statistics for preview
  const stats = useMemo(() => {
    const totalRev = previewOrders.reduce(
      (acc, o) => acc + (typeof o.pricing.grand_total === "number" ? o.pricing.grand_total : parseFloat(String(o.pricing.grand_total) || "0")),
      0
    );
    const deliveredCount = previewOrders.filter((o) => o.fulfillment_status === "delivered").length;
    const pendingCount = previewOrders.filter(
      (o) => o.order_status === "pending_payment" || o.payment_status === "pending"
    ).length;
    const paidCount = previewOrders.filter((o) => o.payment_status === "paid").length;

    return {
      totalOrders: previewOrders.length,
      totalRevenue: totalRev,
      deliveredCount,
      pendingCount,
      paidCount,
    };
  }, [previewOrders]);

  // Download handler
  const handleExport = async (format: "pdf" | "excel") => {
    if (format === "pdf") setIsExportingPDF(true);
    else setIsExportingExcel(true);

    setExportError(null);
    setExportSuccess(null);

    try {
      const blob = await orderService.exportOrdersReport({
        format,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        startDate: computedDateRange.start,
        endDate: computedDateRange.end,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "pdf" ? "pdf" : "xlsx";
      const statusSlug = selectedStatus.replace(/_/g, "-");
      const dateSlug = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `bharath-delight-orders-${statusSlug}-${dateSlug}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(
        `Successfully generated and downloaded ${format.toUpperCase()} report with ${previewOrders.length} orders.`
      );
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err: any) {
      console.error("Export error:", err);
      let msg = `Failed to generate ${format.toUpperCase()} report. Please try again.`;
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) msg = json.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setExportError(msg);
    } finally {
      setIsExportingPDF(false);
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C49A45]/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1E352F] flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-[#C49A45]" />
            Orders & Operations Reports
          </h1>
          <p className="font-sans text-xs text-indianInk/60 mt-1">
            Generate, filter, and download comprehensive official audit reports in PDF and Excel (.xlsx) formats.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-[#C49A45]/30 hover:border-[#C49A45] bg-white text-[#1E352F] font-sans text-xs font-bold uppercase tracking-widest rounded transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Alert Notices */}
      {exportSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-900 rounded flex items-center gap-3 font-sans text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded flex items-center gap-3 font-sans text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#C49A45]/15 p-4 rounded shadow-sm">
          <p className="text-[10px] font-sans uppercase font-bold text-indianInk/50 tracking-wider">
            Total Matching
          </p>
          <p className="text-2xl font-serif font-bold text-[#1E352F] mt-1">
            {stats.totalOrders}
          </p>
          <span className="text-[10px] text-indianInk/40 font-sans">Filtered Orders</span>
        </div>

        <div className="bg-white border border-[#C49A45]/15 p-4 rounded shadow-sm">
          <p className="text-[10px] font-sans uppercase font-bold text-indianInk/50 tracking-wider">
            Total Revenue
          </p>
          <p className="text-xl font-sans font-bold text-[#1E352F] mt-1">
            {formatINR(stats.totalRevenue)}
          </p>
          <span className="text-[10px] text-indianInk/40 font-sans">Gross Volume</span>
        </div>

        <div className="bg-white border border-green-200 p-4 rounded shadow-sm bg-green-50/30">
          <p className="text-[10px] font-sans uppercase font-bold text-green-700 tracking-wider">
            Delivered Orders
          </p>
          <p className="text-2xl font-serif font-bold text-green-900 mt-1">
            {stats.deliveredCount}
          </p>
          <span className="text-[10px] text-green-700/60 font-sans">Fulfilled & Complete</span>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded shadow-sm bg-amber-50/30">
          <p className="text-[10px] font-sans uppercase font-bold text-amber-700 tracking-wider">
            Pending Orders
          </p>
          <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
            {stats.pendingCount}
          </p>
          <span className="text-[10px] text-amber-700/60 font-sans">Awaiting Payment/Verify</span>
        </div>

        <div className="bg-white border border-blue-200 p-4 rounded shadow-sm bg-blue-50/30">
          <p className="text-[10px] font-sans uppercase font-bold text-blue-700 tracking-wider">
            Paid / Confirmed
          </p>
          <p className="text-2xl font-serif font-bold text-blue-900 mt-1">
            {stats.paidCount}
          </p>
          <span className="text-[10px] text-blue-700/60 font-sans">Settled Payments</span>
        </div>
      </div>

      {/* Control Panel: Filters & Export Actions */}
      <div className="bg-white border border-[#C49A45]/20 rounded-lg p-5 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#C49A45]/10 pb-4">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#1E352F] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#C49A45]" />
              Filter Report Parameters
            </h3>
            <p className="text-xs text-indianInk/60 font-sans">
              Choose the exact criteria to include in your generated PDF or Excel report.
            </p>
          </div>

          {/* EXPORT ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExportingPDF || isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream font-sans text-xs font-bold uppercase tracking-wider rounded shadow transition disabled:opacity-50"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C49A45]" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#C49A45]" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport("excel")}
              disabled={isExportingExcel || isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-sans text-xs font-bold uppercase tracking-wider rounded shadow transition disabled:opacity-50"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Excel...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Download Excel (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-indianInk/60 font-sans">
              Order / Fulfillment Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-indianInk/15 rounded bg-[#FAF9F6] font-sans text-xs focus:outline-none focus:border-[#C49A45] text-indianInk font-semibold"
            >
              <option value="all">All Orders (Complete Registry)</option>
              <option value="delivered">Delivered Orders Only</option>
              <option value="shipped">Shipped Orders Only</option>
              <option value="paid">Paid Orders Only</option>
              <option value="confirmed">Confirmed Orders Only</option>
              <option value="pending">Pending Orders (Awaiting Payment / Proof)</option>
              <option value="cancelled">Cancelled Orders</option>
            </select>
          </div>

          {/* Timeframe Preset */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-indianInk/60 font-sans">
              Timeframe / Date Range:
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full px-3 py-2 border border-indianInk/15 rounded bg-[#FAF9F6] font-sans text-xs focus:outline-none focus:border-[#C49A45] text-indianInk font-semibold"
            >
              <option value="all_time">All Time (Full History)</option>
              <option value="today">Today's Orders</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="this_month">This Current Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-indianInk/60 font-sans">
              Search by Order / Email:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indianInk/40" />
              <input
                type="text"
                placeholder="Search order number or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-indianInk/15 rounded bg-[#FAF9F6] font-sans text-xs focus:outline-none focus:border-[#C49A45] text-indianInk"
              />
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (if custom selected) */}
        {datePreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#C49A45]/10">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-indianInk/60 font-sans block mb-1">
                Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-indianInk/15 rounded bg-[#FAF9F6] font-sans text-xs text-indianInk"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-indianInk/60 font-sans block mb-1">
                End Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-indianInk/15 rounded bg-[#FAF9F6] font-sans text-xs text-indianInk"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#1E352F]">
            Report Content Live Preview ({previewOrders.length} records)
          </h3>
          <span className="text-xs font-sans text-indianInk/50">
            Data shown matches the exact contents of your download
          </span>
        </div>

        {isPending ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded border border-[#C49A45]/15">
            <Loader2 className="w-7 h-7 text-[#C49A45] animate-spin mb-2" />
            <p className="text-xs font-sans text-indianInk/60 uppercase tracking-widest">
              Loading orders...
            </p>
          </div>
        ) : previewOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded border border-[#C49A45]/15">
            <ShoppingBag className="w-8 h-8 text-indianInk/30 mx-auto mb-2" />
            <p className="text-sm font-sans font-semibold text-indianInk">
              No orders matched the selected filter criteria.
            </p>
            <p className="text-xs text-indianInk/50 mt-1">
              Try switching your status filter or broadening your date range.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#C49A45]/15 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#C49A45]/10 text-indianInk/60">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Order #</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Items Summary</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Order Status</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Fulfillment</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Payment</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C49A45]/10">
                  {previewOrders.slice(0, 50).map((order) => {
                    const custName =
                      `${order.customer_snapshot.first_name || ""} ${order.customer_snapshot.last_name || ""}`.trim() ||
                      order.shipping_address_snapshot.full_name ||
                      "Guest";
                    const itemsStr = order.items.map((it) => `${it.product_name} (${it.quantity})`).join(", ");

                    return (
                      <tr key={order.id} className="hover:bg-[#FAF9F6]/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#1E352F]">
                          {order.order_number}
                        </td>
                        <td className="py-3 px-4 text-indianInk/70 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-indianInk">{custName}</p>
                          <p className="text-[10px] text-indianInk/50">{order.customer_snapshot.email}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-indianInk/75">
                          {itemsStr}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.order_status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : order.order_status === "pending_payment"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.order_status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.fulfillment_status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.fulfillment_status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.fulfillment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-right text-[#1E352F]">
                          {formatINR(order.pricing.grand_total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {previewOrders.length > 50 && (
                <div className="p-3 bg-[#FAF9F6] text-center border-t border-[#C49A45]/10 text-xs text-indianInk/60 font-sans">
                  Showing first 50 of {previewOrders.length} orders in preview. The downloaded PDF and Excel files will contain all {previewOrders.length} orders.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

