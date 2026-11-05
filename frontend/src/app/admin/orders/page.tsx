"use client";

import React, { useState, useMemo } from "react";
import Link from "@/platform/link";
import { formatINR, optimizeCloudinaryUrl } from "@/lib/utils";
import { useMe } from "@/hooks/use-auth";
import { useAdminOrders, useAdminUpdateOrderStatus } from "@/hooks/use-orders";
import { useAdminPaymentByOrder, useAdminVerifyPayment } from "@/hooks/use-payments";
import { useShipmentByOrder } from "@/hooks/use-shipments";
import { useMediaAsset } from "@/hooks/use-media";
import orderService from "@/services/order-service";
import {
  Loader2,
  RefreshCw,
  Eye,
  Search,
  Filter,
  Clipboard,
  X,
  Check,
  Edit2,
  AlertCircle,
  Plus,
  ShoppingBag,
  Clock,
  Printer,
  AlertTriangle,
  MapPin,
  Truck,
  CreditCard,
  User,
  ShieldCheck,
  PlusCircle,
  Info,
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  ExternalLink
} from "lucide-react";
import { getCourierTrackingUrl } from "@/lib/constants";

export default function AdminOrdersPage() {
  const { data: meData } = useMe();
  const user = meData?.data;
  const role = user?.role;
  const isAdmin = role === "admin";
  const isWarehouse = role === "warehouse";

  // Data fetching
  const { data: ordersRes, isPending, refetch, isRefetching } = useAdminOrders();
  const updateStatusMutation = useAdminUpdateOrderStatus();

  // Component states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Edit status states (in drawer)
  const [editOrderStatus, setEditOrderStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Rejection reason state
  const [rejectionReason, setRejectionReason] = useState("");

  // Invoice states
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [viewInvoiceError, setViewInvoiceError] = useState<string | null>(null);

  // Export states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const handleExportOrders = async (format: "pdf" | "excel") => {
    if (format === "pdf") setIsExportingPDF(true);
    else setIsExportingExcel(true);
    setExportNotice(null);

    try {
      const blob = await orderService.exportOrdersReport({
        format,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
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
    } catch (err: any) {
      console.error("Export error:", err);
      let msg = "Failed to generate report. Please try again.";
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) msg = json.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setExportNotice(msg);
    } finally {
      setIsExportingPDF(false);
      setIsExportingExcel(false);
    }
  };

  // Bulk selection and invoices
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isDownloadingBulkInvoices, setIsDownloadingBulkInvoices] = useState(false);

  const handleBulkDownloadInvoices = async () => {
    setIsDownloadingBulkInvoices(true);
    setExportNotice(null);

    try {
      const blob = await orderService.bulkDownloadInvoices({
        order_ids: selectedOrderIds.length > 0 ? selectedOrderIds : undefined,
        status: selectedOrderIds.length === 0 && selectedStatus !== "all" ? selectedStatus : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const countLabel =
        selectedOrderIds.length > 0
          ? `${selectedOrderIds.length}-orders`
          : selectedStatus.replace(/_/g, "-");
      const dateSlug = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `bharath-delight-invoices-${countLabel}-${dateSlug}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Bulk invoice download error:", err);
      let msg = "Failed to generate bulk invoices. Please try again.";
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) msg = json.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setExportNotice(msg);
    } finally {
      setIsDownloadingBulkInvoices(false);
    }
  };

  const orders = useMemo(() => ordersRes?.data || [], [ordersRes]);

  // Find the currently selected order from the list
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Drawer extra queries
  const paymentRes = useAdminPaymentByOrder(selectedOrderId || "", { enabled: !!selectedOrderId });
  const shipmentRes = useShipmentByOrder(selectedOrderId || "", { enabled: !!selectedOrderId });

  // Get image URL of screenshot media asset
  const screenshotMediaId = paymentRes.data?.data?.screenshot_media_id;
  const mediaRes = useMediaAsset(screenshotMediaId || "", { enabled: !!screenshotMediaId });

  // Mutation Hooks
  const verifyPaymentMutation = useAdminVerifyPayment();

  // Sync edit dropdowns when order is selected
  React.useEffect(() => {
    if (selectedOrder) {
      setEditOrderStatus(selectedOrder.order_status);
      setEditPaymentStatus(selectedOrder.payment_status);
      setViewInvoiceError(null);
    }
  }, [selectedOrder]);

  const handleUpdateStatuses = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    const payload: any = {};
    if (isAdmin) {
      payload.order_status = editOrderStatus;
      payload.payment_status = editPaymentStatus;
    }

    try {
      await updateStatusMutation.mutateAsync({
        orderId: selectedOrder.id,
        payload
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update order status parameters.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVerifyPayment = async (action: "approve" | "reject") => {
    const paymentId = paymentRes.data?.data?.payment_id;
    if (!paymentId) return;

    if (action === "reject" && !rejectionReason.trim()) {
      alert("Please enter a clear reason for payment proof rejection.");
      return;
    }

    try {
      await verifyPaymentMutation.mutateAsync({
        paymentId,
        payload: {
          action,
          rejection_reason: action === "reject" ? rejectionReason : undefined
        }
      });
      setRejectionReason("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Payment verification failed.");
    }
  };

  // Filters & Search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Order status or Payment status filter mapping
      if (selectedStatus !== "all") {
        if (selectedStatus === "paid") {
          if (order.payment_status !== "paid") return false;
        } else {
          if (order.order_status !== selectedStatus) return false;
        }
      } else {
        // Under "All Orders", exclude unsubmitted checkouts where payment proof was never submitted
        if (order.order_status === "pending_payment" && !order.proof_submitted_at) {
          return false;
        }
      }

      // Order No Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim().replace("#", "");
        if (!order.order_number.toLowerCase().includes(query)) return false;
      }

      // Customer Email Search
      if (searchEmail.trim()) {
        const emailQuery = searchEmail.toLowerCase().trim();
        if (!order.customer_snapshot.email.toLowerCase().includes(emailQuery)) return false;
      }

      return true;
    });
  }, [orders, selectedStatus, searchQuery, searchEmail]);

  const toggleSelectAll = () => {
    if (filteredOrders.length === 0) return;
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

  const getStatusBadge = (type: "order" | "payment" | "fulfillment", status: string) => {
    let classes = "inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ";
    if (type === "order") {
      switch (status) {
        case "confirmed": classes += "bg-green-50 text-[#2E7D32] border-[#2E7D32]/20"; break;
        case "cancelled": classes += "bg-red-50 text-[#C62828] border-[#C62828]/20"; break;
        case "closed": classes += "bg-gray-50 text-gray-700 border-gray-200"; break;
        default: classes += "bg-yellow-50 text-[#C49A45] border-[#C49A45]/20";
      }
    } else if (type === "payment") {
      switch (status) {
        case "paid": classes += "bg-green-50 text-[#2E7D32] border-[#2E7D32]/20"; break;
        case "failed": classes += "bg-red-50 text-[#C62828] border-[#C62828]/20"; break;
        case "refunded": classes += "bg-purple-50 text-purple-700 border-purple-200"; break;
        default: classes += "bg-yellow-50 text-[#C49A45] border-[#C49A45]/20";
      }
    } else {
      switch (status) {
        case "delivered": classes += "bg-emerald-50 text-[#2E7D32] border-[#2E7D32]/20"; break;
        case "shipped": classes += "bg-blue-50 text-[#1565C0] border-[#1565C0]/20"; break;
        case "packed": classes += "bg-amber-50 text-[#C49A45] border-[#C49A45]/20"; break;
        case "cancelled": classes += "bg-red-50 text-[#C62828] border-[#C62828]/20"; break;
        default: classes += "bg-gray-50 text-gray-600 border-gray-200";
      }
    }
    return <span className={classes}>{status.replace(/_/g, " ")}</span>;
  };

  const handleViewInvoice = async () => {
    if (!selectedOrder) return;
    setIsViewingInvoice(true);
    setViewInvoiceError(null);
    try {
      const blob = await orderService.getInvoiceBlob(selectedOrder.id, "view");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      console.error("Failed to fetch invoice:", err);
      let errorMsg = "Failed to load invoice. Please try again.";
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) errorMsg = json.message;
        } catch {
          // fallback
        }
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setViewInvoiceError(errorMsg);
    } finally {
      setIsViewingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isPending) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C49A45]" />
        <p className="font-sans text-xs text-indianInk/50 tracking-widest uppercase">Loading catalog orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 no-print">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            visibility: visible !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C49A45]/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1E352F]">
            Order Registry
          </h1>
          <p className="font-sans text-xs text-indianInk/60 mt-1">
            {role === "warehouse"
              ? "Operations: View payment proofs, manage shipments, and update fulfillments."
              : "Administration: Complete administrative access over payment approvals and status overrides."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick PDF Report */}
          <button
            onClick={() => handleExportOrders("pdf")}
            disabled={isExportingPDF || isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream font-sans text-xs font-bold uppercase tracking-wider rounded shadow-sm transition disabled:opacity-50"
            title="Download PDF report for current view"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C49A45]" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#C49A45]" />
            )}
            <span>PDF Report</span>
          </button>

          {/* Quick Excel Report */}
          <button
            onClick={() => handleExportOrders("excel")}
            disabled={isExportingExcel || isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-sans text-xs font-bold uppercase tracking-wider rounded shadow-sm transition disabled:opacity-50"
            title="Download Excel spreadsheet for current view"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            )}
            <span>Excel (.xlsx)</span>
          </button>

          {/* Bulk Invoices PDF */}
          <button
            onClick={handleBulkDownloadInvoices}
            disabled={isDownloadingBulkInvoices || isPending || filteredOrders.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C89B3C] hover:bg-[#b58b32] text-[#0F3D2E] font-sans text-xs font-bold uppercase tracking-wider rounded shadow-sm transition disabled:opacity-50"
            title="Download all invoices combined in a single PDF for selected or filtered orders"
          >
            {isDownloadingBulkInvoices ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F3D2E]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#0F3D2E]" />
            )}
            <span>
              {selectedOrderIds.length > 0
                ? `Invoices (${selectedOrderIds.length})`
                : "Bulk Invoices"}
            </span>
          </button>

          {/* Dedicated Reports Center Link */}
          <Link
            href="/admin/reports"
            className="flex items-center gap-1 px-3 py-2 border border-[#C49A45]/30 hover:border-[#C49A45] bg-[#FAF9F6] text-[#1E352F] font-sans text-xs font-bold uppercase tracking-wider rounded transition hover:bg-[#FAF9F6]/80"
            title="Open Advanced Reports & Operations Analytics Center"
          >
            <span>All Reports →</span>
          </Link>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#C49A45]/30 hover:border-[#C49A45] bg-white text-[#1E352F] font-sans text-xs font-bold uppercase tracking-widest rounded transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Export Notice */}
      {exportNotice && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded flex items-center justify-between text-xs font-sans">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-4 shadow-sm">
        {/* Text Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indianInk/40" />
            <input
              type="text"
              placeholder="Search by order number (e.g. #MBF-00101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indianInk/15 rounded bg-white font-sans text-xs focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] text-indianInk placeholder:text-indianInk/30"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indianInk/40" />
            <input
              type="text"
              placeholder="Search by customer email address..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indianInk/15 rounded bg-white font-sans text-xs focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] text-indianInk placeholder:text-indianInk/30"
            />
          </div>
        </div>

        {/* Status Filter Pill Checklist */}
        <div className="border-t border-[#C49A45]/10 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-indianInk/40 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Status:
            </span>
            {[
              { status: "all", label: "All Orders" },
              { status: "pending_payment", label: "Pending Payment" },
              { status: "paid", label: "Paid" },
              { status: "cancelled", label: "Cancelled" }
            ].map((p) => {
              const active = selectedStatus === p.status;
              return (
                <button
                  key={p.status}
                  onClick={() => setSelectedStatus(p.status)}
                  className={`px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider rounded border transition ${
                    active
                      ? "bg-[#1E352F] text-white border-[#1E352F]"
                      : "bg-[#FAF9F6] text-[#1C2321]/70 border-indianInk/10 hover:border-[#C49A45]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F3D2E] text-white px-4 py-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse"></span>
            <span className="font-sans text-xs font-semibold text-richCream">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "order" : "orders"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownloadInvoices}
              disabled={isDownloadingBulkInvoices}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C89B3C] hover:bg-[#b58b32] text-[#0F3D2E] font-sans text-xs font-bold uppercase tracking-wider rounded transition disabled:opacity-50"
            >
              {isDownloadingBulkInvoices ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download Invoices ({selectedOrderIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-xs text-richCream/70 hover:text-white underline font-sans transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Orders Output */}
      {filteredOrders.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white border border-[#C49A45]/15 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#C49A45]/10 text-indianInk/50">
                    <th className="px-3 py-3 w-[44px] text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrderIds.length === filteredOrders.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-[#C49A45]/40 text-[#0F3D2E] focus:ring-[#C49A45] cursor-pointer"
                        title="Select/Deselect All"
                      />
                    </th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[110px]">Order No</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[160px]">Date</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[180px]">Customer</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[110px]">Total</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[120px]">Order</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[120px]">Payment</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[120px]">Fulfillment</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[80px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indianInk/5">
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`transition-colors cursor-pointer ${
                        selectedOrderIds.includes(order.id)
                          ? "bg-[#C49A45]/10"
                          : index % 2 === 1
                          ? "bg-indianInk/[0.015]"
                          : "bg-white"
                      } hover:bg-[#F2ECE4]/40`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) => toggleSelectOrder(order.id, e as any)}
                          className="rounded border-[#C49A45]/40 text-[#0F3D2E] focus:ring-[#C49A45] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#1E352F]">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3.5 text-indianInk/70">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-indianInk truncate max-w-[170px]">
                          {order.customer_snapshot.first_name || ""} {order.customer_snapshot.last_name || ""}
                        </div>
                        <div className="text-[10px] text-indianInk/50 truncate max-w-[170px]">
                          {order.customer_snapshot.email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-indianInk">
                        {formatCurrency(order.pricing.grand_total)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge("order", order.order_status)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge("payment", order.payment_status)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge("fulfillment", order.fulfillment_status)}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="p-1 text-deodharForest hover:bg-[#FAF9F6] border border-[#C49A45]/20 hover:border-[#C49A45] rounded transition"
                          title="Open Details Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="sm:hidden space-y-4">
            {filteredOrders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id);
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`border rounded p-4 shadow-sm hover:border-[#C49A45] transition-colors cursor-pointer space-y-3 ${
                    isSelected
                      ? "bg-[#C49A45]/10 border-[#C89B3C]"
                      : "bg-white border-[#C49A45]/15"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectOrder(order.id, e as any)}
                        className="rounded border-[#C49A45]/40 text-[#0F3D2E] focus:ring-[#C49A45] cursor-pointer"
                      />
                      <span className="font-sans font-bold text-xs text-[#1E352F]">
                        #{order.order_number}
                      </span>
                    </div>
                    <span className="font-sans font-bold text-xs text-indianInk">
                      {formatCurrency(order.pricing.grand_total)}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-indianInk/70">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-semibold text-indianInk">
                        {order.customer_snapshot.first_name || ""}{" "}
                        {order.customer_snapshot.last_name || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-mono text-[10px]">
                        {order.customer_snapshot.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#C49A45]/10 pt-2 flex flex-wrap gap-1.5">
                    {getStatusBadge("order", order.order_status)}
                    {getStatusBadge("payment", order.payment_status)}
                    {getStatusBadge("fulfillment", order.fulfillment_status)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white border border-[#C49A45]/15 rounded p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#FAF9F6] border border-[#C49A45]/20 rounded-full flex items-center justify-center mx-auto text-deodharForest">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-deodharForest">No Orders Registered</h3>
          <p className="font-sans text-xs text-indianInk/60 leading-relaxed max-w-sm mx-auto">
            There are no customer orders in the database matching your query parameters. If this is a fresh database, completed checkouts will automatically populate here.
          </p>
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      {selectedOrder && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 bg-indianInk/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrderId(null)}
          />

          {/* Drawer Wrapper */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl sm:max-w-2xl bg-[#FAF9F6] shadow-2xl border-l border-[#C49A45]/20 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#1E352F] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  Order #{selectedOrder.order_number}
                </h2>
                <p className="font-sans text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
                  Placed {new Date(selectedOrder.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrder.payment_status === "paid" && (
                  <button
                    onClick={handleViewInvoice}
                    disabled={isViewingInvoice}
                    className="p-1.5 hover:bg-white/10 rounded transition text-white disabled:opacity-50 flex items-center justify-center"
                    title="View Invoice PDF"
                  >
                    {isViewingInvoice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="p-1.5 hover:bg-white/10 rounded transition text-white"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1.5 hover:bg-white/10 rounded transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-xs text-indianInk">
              {viewInvoiceError && (
                <div className="p-3 border border-red-200 bg-red-50 text-red-800 rounded font-medium text-[11px] flex items-start gap-2 relative">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 pr-6">
                    <span className="font-bold block text-red-900 mb-0.5">Invoice Error</span>
                    {viewInvoiceError}
                  </div>
                  <button
                    onClick={() => setViewInvoiceError(null)}
                    className="absolute right-2 top-2 p-1 text-red-800 hover:text-red-900 hover:bg-red-100 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              {/* Status Management Picker Panel */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-3 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <Edit2 className="w-4 h-4 text-burnishedGold" /> Status Adjustments
                </h4>
                {isAdmin ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-indianInk/50 uppercase font-semibold">Order Status</label>
                        <select
                          value={editOrderStatus}
                          onChange={(e) => setEditOrderStatus(e.target.value)}
                          className="w-full mt-1 bg-[#FAF9F6] border border-indianInk/10 rounded px-2.5 py-1.5 font-sans font-bold uppercase text-[10px] text-indianInk focus:outline-none focus:border-[#C49A45]"
                        >
                          <option value="pending_payment">pending_payment</option>
                          <option value="confirmed">confirmed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="closed">closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-indianInk/50 uppercase font-semibold">Payment Status</label>
                        <select
                          value={editPaymentStatus}
                          onChange={(e) => setEditPaymentStatus(e.target.value)}
                          className="w-full mt-1 bg-[#FAF9F6] border border-indianInk/10 rounded px-2.5 py-1.5 font-sans font-bold uppercase text-[10px] text-indianInk focus:outline-none focus:border-[#C49A45]"
                        >
                          <option value="pending">pending</option>
                          <option value="paid">paid</option>
                          <option value="failed">failed</option>
                          <option value="refunded">refunded</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleUpdateStatuses}
                        disabled={isUpdatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E352F] hover:bg-[#1E352F]/90 text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded transition disabled:opacity-50"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Apply Statuses
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded font-medium text-[11px] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-yellow-900 mb-0.5">Fulfillment Updates Location</span>
                      Warehouse personnel are restricted from modifying payment or order approval workflows. Please navigate to the <a href="/admin/shipments" className="underline font-bold text-deodharForest">Shipments dashboard</a> to register dispatches or post logistics tracking milestones.
                    </div>
                  </div>
                )}
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Snapshot */}
                <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-2.5 shadow-sm">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                    <User className="w-4 h-4 text-burnishedGold" /> Customer Information
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Full Name</span>
                      <span className="font-bold text-indianInk">
                        {selectedOrder.customer_snapshot.first_name || ""} {selectedOrder.customer_snapshot.last_name || ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Email Address</span>
                      <span className="font-mono text-indianInk select-all">{selectedOrder.customer_snapshot.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Contact Phone</span>
                      <span className="font-sans text-indianInk">{selectedOrder.customer_snapshot.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-2.5 shadow-sm">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                    <MapPin className="w-4 h-4 text-burnishedGold" /> Delivery Address
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Recipient</span>
                      <span className="font-bold text-indianInk">{selectedOrder.shipping_address_snapshot.full_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Address Line</span>
                      <span className="text-indianInk leading-normal block">
                        {selectedOrder.shipping_address_snapshot.address_line1}
                        {selectedOrder.shipping_address_snapshot.address_line2 && `, ${selectedOrder.shipping_address_snapshot.address_line2}`}
                      </span>
                      <span className="text-indianInk block">
                        {selectedOrder.shipping_address_snapshot.city}, {selectedOrder.shipping_address_snapshot.state} - {selectedOrder.shipping_address_snapshot.pincode}
                      </span>
                      <span className="text-[10px] text-indianInk/50 block mt-0.5">{selectedOrder.shipping_address_snapshot.country}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block">Delivery Phone</span>
                      <span className="font-sans text-indianInk">{selectedOrder.shipping_address_snapshot.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="bg-white border border-[#C49A45]/15 rounded shadow-sm overflow-hidden">
                <div className="bg-[#FAF9F6] border-b border-[#C49A45]/10 px-4 py-2 flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-burnishedGold" /> Ordered Items
                  </h4>
                  <span className="font-sans text-[10px] font-bold text-[#1E352F]/70 uppercase">
                    {selectedOrder.items.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                  </span>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-indianInk/5 text-indianInk/50">
                        <th className="px-4 py-2 font-bold uppercase w-[220px]">Product / Variant</th>
                        <th className="px-4 py-2 font-bold uppercase w-[80px] text-center">Qty</th>
                        <th className="px-4 py-2 font-bold uppercase w-[100px] text-right">Price</th>
                        <th className="px-4 py-2 font-bold uppercase w-[100px] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indianInk/5">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-[#FAF9F6]/50">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-indianInk">{item.product_name}</div>
                            <div className="text-[10px] text-indianInk/50 mt-0.5">
                              Variant: <span className="font-medium text-indianInk/85">{item.variant_title}</span> | SKU: <code className="font-mono bg-indianInk/5 px-1 rounded">{item.sku}</code>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-indianInk">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-indianInk/70">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-indianInk">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="bg-[#FAF9F6]/30 border-t border-[#C49A45]/10 p-4 flex justify-end">
                  <div className="w-full sm:w-[260px] space-y-1.5 text-xs">
                    <div className="flex justify-between text-indianInk/70">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.pricing.subtotal)}</span>
                    </div>
                    {selectedOrder.pricing.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-medium">-{formatCurrency(selectedOrder.pricing.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-indianInk/70">
                      <span>Tax (GST):</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.pricing.tax_total)}</span>
                    </div>
                    <div className="flex justify-between text-indianInk/70 pb-1.5 border-b border-indianInk/5">
                      <span>Shipping Fee:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.pricing.shipping_fee)}</span>
                    </div>
                    <div className="flex justify-between text-[#1E352F] font-bold text-sm">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(selectedOrder.pricing.grand_total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Proof Verification Panel */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-4 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <CreditCard className="w-4 h-4 text-burnishedGold" /> Payment Proof Verification
                </h4>

                {paymentRes.isPending ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-burnishedGold" />
                  </div>
                ) : paymentRes.data?.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block uppercase">UPI link details</span>
                        <code className="font-mono text-[9px] text-[#1E352F] block break-all select-all bg-[#FAF9F6] border border-[#C49A45]/15 p-1.5 rounded mt-0.5">
                          {paymentRes.data.data.upi_id}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block uppercase">UPI Payment Status</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          {paymentRes.data.data.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded">
                              <ShieldCheck className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : paymentRes.data.data.status === "proof_submitted" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded">
                              <Clock className="w-3.5 h-3.5 animate-pulse" /> Proof Submitted
                            </span>
                          ) : paymentRes.data.data.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                              <AlertCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded">
                              Pending Submission
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification Screenshot Upload */}
                    {screenshotMediaId && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-indianInk/50 block uppercase">Submitted Screenshot Receipt</span>
                        {mediaRes.isPending ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-burnishedGold" />
                          </div>
                        ) : mediaRes.data?.data?.public_url ? (
                          <div className="border border-indianInk/10 rounded overflow-hidden max-w-sm">
                            <img
                              src={optimizeCloudinaryUrl(mediaRes.data.data.public_url, 600)}
                              alt="Payment Screenshot Receipt Proof"
                              className="w-full h-auto object-contain max-h-[200px] hover:scale-[1.02] transition"
                            />
                            <div className="bg-[#FAF9F6] border-t border-indianInk/5 p-2 flex justify-between items-center text-[10px] text-indianInk/50">
                              <span>File Ref: {mediaRes.data.data.id}</span>
                              <a
                                href={mediaRes.data.data.public_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-[#1E352F] hover:underline"
                              >
                                View full size
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-500 text-xs italic">Failed to resolve image url link.</div>
                        )}
                      </div>
                    )}

                    {/* Rejection notice if rejected */}
                    {paymentRes.data.data.status === "rejected" && paymentRes.data.data.rejection_reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                        <span className="font-bold block uppercase text-[9px] text-red-900">Rejection Reason:</span>
                        <p className="mt-1 font-medium">{paymentRes.data.data.rejection_reason}</p>
                      </div>
                    )}

                    {/* Approval actions (restricted to Admin) */}
                    {paymentRes.data.data.status === "proof_submitted" && (
                      <div className="border-t border-[#C49A45]/15 pt-3 space-y-3">
                        {isAdmin ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-indianInk/50 uppercase font-semibold">Rejection reason (Required only for reject action)</label>
                              <textarea
                                placeholder="Enter rejection reason details (e.g. 'Amount mismatch', 'Receipt blurred')..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full border border-indianInk/15 rounded p-2 text-xs focus:outline-none focus:border-[#C49A45] min-h-[50px] font-sans bg-white text-indianInk placeholder:text-indianInk/30"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleVerifyPayment("reject")}
                                disabled={verifyPaymentMutation.isPending}
                                className="px-3.5 py-1.5 border border-red-500 text-red-700 hover:bg-red-50 font-sans text-[10px] font-bold uppercase tracking-wider rounded transition disabled:opacity-50"
                              >
                                Reject Proof
                              </button>
                              <button
                                onClick={() => handleVerifyPayment("approve")}
                                disabled={verifyPaymentMutation.isPending}
                                className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded transition disabled:opacity-50"
                              >
                                Approve Payment
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-[11px] leading-relaxed">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                            <span>Payment proof verification is restricted to Administrators only. Warehouse operators cannot approve payments.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-indianInk/50 italic py-2">
                    No payment initiation record exists for this order yet.
                  </p>
                )}
              </div>

              {/* Shipment Logistics Panel */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-4 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <Truck className="w-4 h-4 text-burnishedGold" /> Shipment Tracking Details
                </h4>

                {shipmentRes.isPending ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-burnishedGold" />
                  </div>
                ) : shipmentRes.data?.data ? (
                  /* Shipment exists - show Courier, Tracking ID, Copy and Track button */
                  <div className="space-y-4 text-xs">
                    <div className="bg-[#FAF9F6] border border-[#C49A45]/20 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Courier Service</span>
                          <span className="font-bold text-[#0F3D2E] text-sm uppercase tracking-wide">
                            {shipmentRes.data.data.carrier_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Delivery Status</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-[#C49A45] border border-[#C49A45]/30">
                            {shipmentRes.data.data.status === "shipped" || shipmentRes.data.data.status === "pending"
                              ? "Dispatched"
                              : shipmentRes.data.data.status}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indianInk/10">
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase mb-1">
                          Consignment / Tracking ID
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <code className="font-mono font-bold text-indianInk bg-white border border-[#C49A45]/20 px-2.5 py-1.5 rounded text-xs select-all">
                            {shipmentRes.data.data.tracking_number}
                          </code>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(shipmentRes.data.data.tracking_number);
                                setCopiedTracking(true);
                                setTimeout(() => setCopiedTracking(false), 2000);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 border border-[#C49A45]/30 hover:border-[#C49A45] bg-white text-[#0F3D2E] rounded text-xs font-bold uppercase tracking-wider transition"
                            >
                              {copiedTracking ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-[#C49A45]" />
                                  <span>Copy ID</span>
                                </>
                              )}
                            </button>
                            <a
                              href={getCourierTrackingUrl(shipmentRes.data.data.carrier_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream rounded text-xs font-bold uppercase tracking-wider transition"
                            >
                              <span>Track</span>
                              <ExternalLink className="w-3 h-3 text-[#C89B3C]" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border border-[#C49A45]/20 bg-[#FAF9F6] text-indianInk rounded font-medium text-[11px] leading-relaxed flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-[#C49A45] shrink-0 mt-0.5" />
                        <span>Manage dispatches, mark deliveries or returns on the </span>
                      </div>
                      <Link
                        href="/admin/shipments"
                        className="underline font-bold text-[#0F3D2E] hover:text-[#C49A45] whitespace-nowrap"
                      >
                        Shipments Dashboard →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 border border-[#C49A45]/20 bg-[#FAF9F6] text-indianInk rounded font-medium text-[11px] leading-relaxed flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-burnishedGold shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-deodharForest mb-0.5">Not Dispatched Yet</span>
                          <span>No courier shipment registered. Pack the product and dispatch via ST Courier or The Professional Couriers.</span>
                        </div>
                      </div>
                      <Link
                        href="/admin/shipments"
                        className="px-3 py-1.5 bg-[#0F3D2E] text-white rounded text-xs font-bold uppercase whitespace-nowrap tracking-wider hover:bg-[#15543F]"
                      >
                        Dispatch →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}

      {/* Printable Invoice Container (Visible only in print views) */}
      {selectedOrder && (
        <div className="hidden print:block print-only w-full max-w-3xl mx-auto p-8 bg-white text-black font-sans text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-black/15 pb-6 mb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#1E352F]">BHARATH DELIGHT FOODS</h1>
              <p className="text-[10px] text-black/60 mt-1">Selecting the Best to Serve the Best</p>
              <p className="text-[9px] text-black/50 mt-2">FSSAI Lic. No: 12423999000123</p>
            </div>
            <div className="text-right">
              <h2 className="font-serif text-lg font-bold uppercase tracking-wider text-black">INVOICE SUMMARY</h2>
              <p className="font-mono mt-1 text-xs">Ref: #{selectedOrder.order_number}</p>
              <p className="text-[10px] text-black/60 mt-1">Date: {new Date(selectedOrder.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-serif text-xs font-bold uppercase border-b border-black/10 pb-1 mb-2">Customer Account</h3>
              <p className="font-bold">{selectedOrder.customer_snapshot.first_name || ""} {selectedOrder.customer_snapshot.last_name || ""}</p>
              <p className="text-black/70 mt-0.5">{selectedOrder.customer_snapshot.email}</p>
              <p className="text-black/70 mt-0.5">{selectedOrder.customer_snapshot.phone || "No phone provided"}</p>
            </div>
            <div>
              <h3 className="font-serif text-xs font-bold uppercase border-b border-black/10 pb-1 mb-2">Shipping Destination</h3>
              <p className="font-bold">{selectedOrder.shipping_address_snapshot.full_name}</p>
              <p className="text-black/70 mt-0.5">{selectedOrder.shipping_address_snapshot.address_line1}</p>
              {selectedOrder.shipping_address_snapshot.address_line2 && (
                <p className="text-black/70 mt-0.5">{selectedOrder.shipping_address_snapshot.address_line2}</p>
              )}
              <p className="text-black/70 mt-0.5">
                {selectedOrder.shipping_address_snapshot.city}, {selectedOrder.shipping_address_snapshot.state} - {selectedOrder.shipping_address_snapshot.pincode}
              </p>
              <p className="text-black/50 mt-0.5">{selectedOrder.shipping_address_snapshot.country}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left font-sans text-[11px] border-collapse mb-6">
            <thead>
              <tr className="border-b border-black/15 text-black/70">
                <th className="py-2 font-bold uppercase">Product Description</th>
                <th className="py-2 font-bold uppercase text-center w-[60px]">Qty</th>
                <th className="py-2 font-bold uppercase text-right w-[100px]">Unit Price</th>
                <th className="py-2 font-bold uppercase text-right w-[100px]">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {selectedOrder.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2.5">
                    <div className="font-bold">{item.product_name}</div>
                    <div className="text-[9px] text-black/50 mt-0.5">Variant: {item.variant_title} | SKU: {item.sku}</div>
                  </td>
                  <td className="py-2.5 text-center">{item.quantity}</td>
                  <td className="py-2.5 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2.5 text-right font-bold">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Breakdown */}
          <div className="flex justify-end mb-8">
            <div className="w-[240px] space-y-1.5 text-[11px] border-t border-black/10 pt-3">
              <div className="flex justify-between text-black/70">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.pricing.subtotal)}</span>
              </div>
              {selectedOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-black/70">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedOrder.pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-black/70">
                <span>Tax (GST):</span>
                <span>{formatCurrency(selectedOrder.pricing.tax_total)}</span>
              </div>
              <div className="flex justify-between text-black/70 pb-1.5 border-b border-black/5">
                <span>Shipping Fee:</span>
                <span>{formatCurrency(selectedOrder.pricing.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-black font-bold text-xs pt-1.5">
                <span>Grand Total:</span>
                <span>{formatCurrency(selectedOrder.pricing.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Footer print disclaimer */}
          <div className="border-t border-black/10 pt-6 text-center text-[9px] text-black/40 space-y-1.5">
            <p>Thank you for purchasing curated gourmet products from BHARATH DELIGHT FOODS.</p>
            <p>This document is an administrative invoice summary compiled directly from digital catalog records.</p>
          </div>
        </div>
      )}
    </div>
  );
}
