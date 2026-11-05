"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "@/platform/navigation";
import { useMe } from "@/hooks/use-auth";
import { useAdminOrders, useOrderDetails } from "@/hooks/use-orders";
import {
  useAdminShipments,
  useAdminUpdateShipmentStatus,
  useCreateShipment,
  useAdminEditShipment,
  useAdminCancelShipment,
  useAdminDeleteShipment,
} from "@/hooks/use-shipments";
import {
  Loader2,
  RefreshCw,
  Plus,
  Truck,
  Eye,
  X,
  Edit2,
  AlertCircle,
  Trash2,
  User,
  Info,
  Check,
  Search,
  Filter,
  Copy,
  ExternalLink,
  PackageCheck,
} from "lucide-react";
import { COURIER_SERVICES, getCourierTrackingUrl } from "@/lib/constants";

export default function AdminShipmentsPage() {
  const { data: meData } = useMe();
  const user = meData?.data;
  const role = user?.role;
  const isAdmin = role === "admin";
  const isWarehouse = role === "warehouse";

  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId");

  // Page States
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Auto-open modal if orderId passed in URL
  useEffect(() => {
    if (urlOrderId) {
      setIsCreateModalOpen(true);
      setCreateForm((prev) => ({ ...prev, orderId: urlOrderId }));
    }
  }, [urlOrderId]);

  // Data fetching
  const {
    data: shipmentsRes,
    isPending: isShipmentsPending,
    refetch,
    isRefetching,
  } = useAdminShipments();
  const { data: ordersRes } = useAdminOrders(undefined, {
    enabled: isCreateModalOpen || !!urlOrderId,
  });

  // Mutations
  const createShipmentMutation = useCreateShipment();
  const editShipmentMutation = useAdminEditShipment();
  const cancelShipmentMutation = useAdminCancelShipment();
  const deleteShipmentMutation = useAdminDeleteShipment();
  const updateStatusMutation = useAdminUpdateShipmentStatus();

  // Search & Filter States
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [searchTracking, setSearchTracking] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Form States
  const [createForm, setCreateForm] = useState({
    orderId: "",
    carrierName: "ST Courier",
    trackingNumber: "",
  });
  const [createError, setCreateError] = useState("");

  // Edit Carrier Info States
  const [isEditingCarrier, setIsEditingCarrier] = useState(false);
  const [editForm, setEditForm] = useState({
    carrierName: "ST Courier",
    trackingNumber: "",
  });

  // Memoized lists
  const shipments = useMemo(() => shipmentsRes?.data || [], [shipmentsRes]);
  const orders = useMemo(() => ordersRes?.data || [], [ordersRes]);

  // Selected shipment object
  const selectedShipment = useMemo(() => {
    if (!selectedShipmentId) return null;
    return shipments.find((s) => s.id === selectedShipmentId) || null;
  }, [shipments, selectedShipmentId]);

  // Dynamic order details fetch inside drawer
  const { data: orderDetailsRes, isPending: isOrderPending } = useOrderDetails(
    selectedShipment?.order_id || "",
    { enabled: !!selectedShipmentId },
  );
  const orderDetails = orderDetailsRes?.data;

  // Filter orders that are confirmed, paid, and have no active shipment
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.order_status === "confirmed" &&
        order.payment_status === "paid" &&
        !shipments.some((s) => s.order_id === order.id),
    );
  }, [orders, shipments]);

  // Search filter for pending orders in dispatch modal
  const filteredPendingOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return pendingOrders;
    const q = orderSearchQuery.toLowerCase().trim().replace("#", "");
    return pendingOrders.filter((o) => {
      if (o.order_number.toLowerCase().includes(q)) return true;
      const cust = o.customer_snapshot;
      const name = `${cust.first_name || ""} ${cust.last_name || ""}`.toLowerCase();
      if (name.includes(q)) return true;
      if (cust.email?.toLowerCase().includes(q)) return true;
      if (cust.phone?.includes(q)) return true;
      const addr = o.shipping_address_snapshot;
      if (addr?.city?.toLowerCase().includes(q)) return true;
      if (addr?.state?.toLowerCase().includes(q)) return true;
      if (addr?.phone?.includes(q)) return true;
      if (o.items?.some((item) => item.product_name?.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [pendingOrders, orderSearchQuery]);

  // Selected target order details for dispatch modal
  const selectedTargetOrder = useMemo(() => {
    if (!createForm.orderId) return null;
    return orders.find((o) => o.id === createForm.orderId) || null;
  }, [orders, createForm.orderId]);

  // Copy tracking ID helper
  const handleCopyTracking = (id: string, trackingNumber: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle syncing edit fields when editing carrier info is opened
  const startEditingCarrier = () => {
    if (!selectedShipment) return;
    setEditForm({
      carrierName: selectedShipment.carrier_name || "ST Courier",
      trackingNumber: selectedShipment.tracking_number,
    });
    setIsEditingCarrier(true);
  };

  const handleSaveCarrierEdit = async () => {
    if (!selectedShipment) return;
    if (!editForm.carrierName.trim() || !editForm.trackingNumber.trim()) {
      alert("Courier Service and Tracking Number are required.");
      return;
    }

    try {
      await editShipmentMutation.mutateAsync({
        id: selectedShipment.id,
        payload: {
          carrier_name: editForm.carrierName.trim(),
          tracking_number: editForm.trackingNumber.trim(),
        },
      });
      setIsEditingCarrier(false);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update shipment courier info.");
    }
  };

  // Handle dispatching a new shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createForm.orderId) {
      setCreateError("Please select a target order.");
      return;
    }
    if (!createForm.carrierName.trim()) {
      setCreateError("Please select a courier service.");
      return;
    }
    if (!createForm.trackingNumber.trim()) {
      setCreateError("Tracking Number / Consignment ID is required.");
      return;
    }

    try {
      await createShipmentMutation.mutateAsync({
        orderId: createForm.orderId,
        payload: {
          carrier_name: createForm.carrierName.trim(),
          tracking_number: createForm.trackingNumber.trim(),
        },
      });

      // Clear form and close
      setCreateForm({
        orderId: "",
        carrierName: "ST Courier",
        trackingNumber: "",
      });
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Failed to register shipment dispatch.");
    }
  };

  // Handle status update: Delivered or Returned
  const handleUpdateStatus = async (status: "delivered" | "returned") => {
    if (!selectedShipment) return;
    const confirmMessage =
      status === "delivered"
        ? "Confirm marking this order as DELIVERED to the customer?"
        : "Confirm marking this order as RETURNED to sender?";
    if (!confirm(confirmMessage)) return;

    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedShipment.id,
        payload: {
          status,
          message:
            status === "delivered"
              ? `Package successfully delivered via ${selectedShipment.carrier_name}.`
              : `Package returned to sender via ${selectedShipment.carrier_name}.`,
        },
      });
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to update status to ${status}.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Cancel shipment status overrides (Admin only)
  const handleCancelShipment = async () => {
    if (!selectedShipment) return;
    if (
      !confirm(
        "Are you sure you want to administratively CANCEL this shipment? This will cancel the dispatch record.",
      )
    ) {
      return;
    }

    try {
      await cancelShipmentMutation.mutateAsync(selectedShipment.id);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel shipment.");
    }
  };

  // Delete shipment (Soft-delete: Admin only)
  const handleDeleteShipment = async () => {
    if (!selectedShipment) return;
    if (
      !confirm(
        "CRITICAL: Are you sure you want to DELETE this shipment record from the active registry?",
      )
    ) {
      return;
    }

    try {
      await deleteShipmentMutation.mutateAsync(selectedShipment.id);
      setSelectedShipmentId(null);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete shipment record.");
    }
  };

  // Filter shipments client-side based on text searches and status pills
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "shipped") {
          if (!["shipped", "pending"].includes(shipment.status)) return false;
        } else if (shipment.status !== statusFilter) {
          return false;
        }
      }

      // Search by order number
      if (searchOrderNo.trim()) {
        const oQuery = searchOrderNo.toLowerCase().trim().replace("#", "");
        if (!shipment.order_number.toLowerCase().includes(oQuery)) {
          return false;
        }
      }

      // Search by tracking ID
      if (searchTracking.trim()) {
        const tQuery = searchTracking.toLowerCase().trim();
        if (!shipment.tracking_number.toLowerCase().includes(tQuery)) {
          return false;
        }
      }

      // Search by Customer Email
      if (searchEmail.trim()) {
        const eQuery = searchEmail.toLowerCase().trim();
        const matchingOrder = orders.find((o) => o.id === shipment.order_id);
        const email = matchingOrder?.customer_snapshot.email || "";
        if (!email.toLowerCase().includes(eQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [shipments, orders, statusFilter, searchOrderNo, searchTracking, searchEmail]);

  // Utility formatters
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const getShipmentBadge = (status: string) => {
    let classes =
      "inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ";
    switch (status) {
      case "delivered":
        classes += "bg-green-50 text-[#2E7D32] border-[#2E7D32]/20";
        return <span className={classes}>Delivered</span>;
      case "returned":
        classes += "bg-red-50 text-[#C62828] border-[#C62828]/20";
        return <span className={classes}>Returned</span>;
      case "cancelled":
        classes += "bg-gray-50 text-gray-700 border-gray-200";
        return <span className={classes}>Cancelled</span>;
      case "shipped":
      case "pending":
      default:
        classes += "bg-amber-50 text-[#C49A45] border-[#C49A45]/30";
        return <span className={classes}>Dispatched</span>;
    }
  };

  const formatDateTime = (val?: string) => {
    if (!val) return "Not recorded";
    return new Date(val).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isShipmentsPending) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C49A45]" />
        <p className="font-sans text-xs text-indianInk/50 tracking-widest uppercase">
          Loading logistics dispatches...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Dispatch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C49A45]/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1E352F]">
            Shipment Dispatches
          </h1>
          <p className="font-sans text-xs text-indianInk/60 mt-1">
            Dispatch orders via ST Courier or The Professional Couriers, copy tracking IDs, and open courier tracking portals.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-[#C49A45]/30 hover:border-[#C49A45] bg-white text-[#1E352F] font-sans text-xs font-bold uppercase tracking-widest rounded transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream font-sans text-xs font-bold uppercase tracking-widest rounded transition shadow-md"
          >
            <Plus className="w-4 h-4 text-[#C89B3C]" />
            Dispatch Shipment
          </button>
        </div>
      </div>

      {/* Search & Filter Panel */}
      <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-4 shadow-sm">
        {/* Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indianInk/40" />
            <input
              type="text"
              placeholder="Search Order Number (e.g. #MBF-00101)..."
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indianInk/15 rounded bg-[#FAF9F6]/20 font-sans text-xs focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] text-indianInk placeholder:text-indianInk/30"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indianInk/40" />
            <input
              type="text"
              placeholder="Search Tracking ID..."
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indianInk/15 rounded bg-[#FAF9F6]/20 font-sans text-xs focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] text-indianInk placeholder:text-indianInk/30"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indianInk/40" />
            <input
              type="text"
              placeholder="Search Customer Email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indianInk/15 rounded bg-[#FAF9F6]/20 font-sans text-xs focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] text-indianInk placeholder:text-indianInk/30"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="border-t border-[#C49A45]/10 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-indianInk/40 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Status:
            </span>
            {[
              { status: "all", label: "All Dispatches" },
              { status: "shipped", label: "Dispatched" },
              { status: "delivered", label: "Delivered" },
              { status: "returned", label: "Returned" },
              { status: "cancelled", label: "Cancelled" },
            ].map((p) => {
              const active = statusFilter === p.status;
              return (
                <button
                  key={p.status}
                  onClick={() => setStatusFilter(p.status)}
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

      {/* Shipments Registry */}
      {filteredShipments.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-[#C49A45]/15 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#C49A45]/10 text-indianInk/50">
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[110px]">Order No</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[160px]">Customer</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[180px]">Courier Service</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[220px]">Tracking Number / ID</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[110px]">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[130px]">Dispatched At</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[90px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indianInk/5">
                  {filteredShipments.map((shipment, index) => {
                    const matchedOrder = orders.find((o) => o.id === shipment.order_id);
                    const customerName = matchedOrder
                      ? `${matchedOrder.customer_snapshot.first_name || ""} ${matchedOrder.customer_snapshot.last_name || ""}`.trim()
                      : "Customer";
                    const trackingUrl = getCourierTrackingUrl(shipment.carrier_name);
                    const isCopied = copiedId === shipment.id;

                    return (
                      <tr
                        key={shipment.id}
                        onClick={() => setSelectedShipmentId(shipment.id)}
                        className={`transition-colors cursor-pointer ${
                          index % 2 === 1 ? "bg-indianInk/[0.015]" : "bg-white"
                        } hover:bg-[#F2ECE4]/40`}
                      >
                        <td className="px-4 py-3.5 font-bold text-[#1E352F]">
                          #{shipment.order_number}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-indianInk">
                          {customerName}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0F3D2E] uppercase">
                          {shipment.carrier_name}
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-[11px] font-bold text-indianInk bg-[#FAF9F6] border border-[#C49A45]/20 px-2 py-1 rounded select-all">
                              {shipment.tracking_number}
                            </code>

                            {/* Copy Button */}
                            <button
                              onClick={(e) =>
                                handleCopyTracking(shipment.id, shipment.tracking_number, e)
                              }
                              className="p-1 hover:bg-[#FAF9F6] border border-[#C49A45]/20 hover:border-[#C49A45] rounded text-deodharForest transition"
                              title="Copy Tracking ID"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[#C49A45]" />
                              )}
                            </button>

                            {/* Direct Track Button */}
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream rounded text-[10px] font-bold uppercase tracking-wider transition"
                              title="Track on Courier Website"
                            >
                              <span>Track</span>
                              <ExternalLink className="w-3 h-3 text-[#C89B3C]" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {getShipmentBadge(shipment.status)}
                        </td>
                        <td className="px-4 py-3.5 text-indianInk/60">
                          {new Date(shipment.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedShipmentId(shipment.id)}
                            className="p-1.5 text-deodharForest hover:bg-[#FAF9F6] border border-[#C49A45]/20 hover:border-[#C49A45] rounded transition"
                            title="Open Dispatch Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-4">
            {filteredShipments.map((shipment) => {
              const matchedOrder = orders.find((o) => o.id === shipment.order_id);
              const customerName = matchedOrder
                ? `${matchedOrder.customer_snapshot.first_name || ""} ${matchedOrder.customer_snapshot.last_name || ""}`.trim()
                : "Customer";
              const trackingUrl = getCourierTrackingUrl(shipment.carrier_name);
              const isCopied = copiedId === shipment.id;

              return (
                <div
                  key={shipment.id}
                  onClick={() => setSelectedShipmentId(shipment.id)}
                  className="bg-white border border-[#C49A45]/15 rounded p-4 shadow-sm hover:border-[#C49A45] transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-xs text-[#1E352F]">
                      Order #{shipment.order_number}
                    </span>
                    {getShipmentBadge(shipment.status)}
                  </div>

                  <div className="text-[11px] space-y-1.5 text-indianInk/70">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-semibold text-indianInk">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courier:</span>
                      <span className="font-bold text-[#0F3D2E] uppercase">{shipment.carrier_name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1" onClick={(e) => e.stopPropagation()}>
                      <span className="font-mono font-bold text-indianInk bg-[#FAF9F6] border border-[#C49A45]/20 px-2 py-0.5 rounded text-[11px]">
                        {shipment.tracking_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) =>
                            handleCopyTracking(shipment.id, shipment.tracking_number, e)
                          }
                          className="px-2 py-1 border border-[#C49A45]/30 rounded text-[10px] font-bold text-[#0F3D2E] hover:bg-[#FAF9F6] flex items-center gap-1"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#C49A45]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#0F3D2E] text-white rounded text-[10px] font-bold uppercase flex items-center gap-1"
                        >
                          <span>Track</span>
                          <ExternalLink className="w-3 h-3 text-[#C89B3C]" />
                        </a>
                      </div>
                    </div>
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
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-deodharForest">No Shipment Records</h3>
          <p className="font-sans text-xs text-indianInk/60 leading-relaxed max-w-sm mx-auto">
            There are no dispatched orders matching your query parameters. Clear your filter or click Dispatch Shipment to dispatch a new order.
          </p>
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      {selectedShipment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-indianInk/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setSelectedShipmentId(null);
              setIsEditingCarrier(false);
            }}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl sm:max-w-2xl bg-[#FAF9F6] shadow-2xl border-l border-[#C49A45]/20 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#1E352F] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  Dispatch Details
                </h2>
                <p className="font-sans text-[10px] uppercase tracking-wider text-white/60 mt-0.5 font-bold">
                  Order #{selectedShipment.order_number} | Status:{" "}
                  {selectedShipment.status === "shipped" || selectedShipment.status === "pending"
                    ? "DISPATCHED"
                    : selectedShipment.status.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedShipmentId(null);
                  setIsEditingCarrier(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-xs text-indianInk">
              {/* Courier & Tracking Section */}
              <div className="bg-white border border-[#C49A45]/20 rounded-lg p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-indianInk/5 pb-3">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#C49A45]" /> Third-Party Courier Routing
                  </h4>
                  {isAdmin && !isEditingCarrier && (
                    <button
                      onClick={startEditingCarrier}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#C49A45] hover:underline"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Courier Info
                    </button>
                  )}
                </div>

                {isEditingCarrier ? (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-indianInk/60 block mb-1">
                        Select Courier Service
                      </label>
                      <select
                        value={editForm.carrierName}
                        onChange={(e) => setEditForm({ ...editForm, carrierName: e.target.value })}
                        className="w-full border border-indianInk/20 rounded p-2 text-xs font-semibold focus:border-[#C49A45] focus:outline-none bg-white"
                      >
                        {COURIER_SERVICES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-indianInk/60 block mb-1">
                        Tracking Number / Consignment ID
                      </label>
                      <input
                        type="text"
                        value={editForm.trackingNumber}
                        onChange={(e) =>
                          setEditForm({ ...editForm, trackingNumber: e.target.value })
                        }
                        className="w-full border border-indianInk/20 rounded p-2 text-xs font-mono font-bold focus:border-[#C49A45] focus:outline-none bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-indianInk/5">
                      <button
                        onClick={() => setIsEditingCarrier(false)}
                        className="px-3 py-1.5 border border-indianInk/15 rounded hover:bg-[#FAF9F6] font-bold uppercase text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCarrierEdit}
                        disabled={editShipmentMutation.isPending}
                        className="px-4 py-1.5 bg-[#0F3D2E] hover:bg-[#15543F] text-white rounded font-bold uppercase text-[10px] tracking-wide"
                      >
                        {editShipmentMutation.isPending ? "Saving..." : "Save Edits"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                          Courier Service
                        </span>
                        <span className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wide">
                          {selectedShipment.carrier_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                          Dispatched Date
                        </span>
                        <span className="font-semibold text-indianInk">
                          {formatDateTime(selectedShipment.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Tracking ID + Copy + Track buttons */}
                    <div className="bg-[#FAF9F6] border border-[#C49A45]/30 rounded-md p-4 space-y-3">
                      <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                        Consignment / Tracking ID
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <code className="font-mono text-base font-bold text-[#0F3D2E] select-all bg-white border border-[#C49A45]/20 px-3 py-1.5 rounded">
                          {selectedShipment.tracking_number}
                        </code>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopyTracking(
                                selectedShipment.id,
                                selectedShipment.tracking_number,
                                e,
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 border border-[#C49A45]/40 hover:border-[#C49A45] bg-white text-[#0F3D2E] rounded font-bold uppercase text-xs transition"
                          >
                            {copiedId === selectedShipment.id ? (
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
                            href={getCourierTrackingUrl(selectedShipment.carrier_name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream rounded font-bold uppercase text-xs transition shadow-sm"
                          >
                            <span>Track on Portal</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#C89B3C]" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Action: Mark Delivered / Mark Returned */}
              <div className="bg-white border border-[#C49A45]/20 rounded-lg p-5 space-y-3 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <PackageCheck className="w-4 h-4 text-[#C49A45]" /> Delivery Settlement Status
                </h4>

                {selectedShipment.status === "delivered" ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md flex items-center gap-2.5">
                    <Check className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                        Order Delivered
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        This order has been confirmed as delivered to the customer.
                      </p>
                    </div>
                  </div>
                ) : selectedShipment.status === "returned" ? (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-md flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-red-800">
                        Package Returned
                      </p>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        This package was recorded as returned to warehouse by the courier service.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-indianInk/70 leading-relaxed">
                      Once the third-party courier confirms package status, mark this dispatch accordingly:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleUpdateStatus("delivered")}
                        disabled={isUpdatingStatus}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-sans text-xs font-bold uppercase tracking-wider rounded transition shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark as Delivered</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("returned")}
                        disabled={isUpdatingStatus}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-sans text-xs font-bold uppercase tracking-wider rounded transition shadow-sm disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Mark as Returned</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order & Recipient Information */}
              <div className="bg-white border border-[#C49A45]/15 rounded-lg p-5 space-y-3 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <User className="w-4 h-4 text-[#C49A45]" /> Recipient Delivery Details
                </h4>
                {isOrderPending ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C49A45]" />
                    <span className="text-[10px] text-indianInk/50 italic">
                      Retrieving customer database records...
                    </span>
                  </div>
                ) : orderDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                          Customer Name
                        </span>
                        <span className="font-bold text-indianInk">
                          {orderDetails.customer_snapshot.first_name || ""}{" "}
                          {orderDetails.customer_snapshot.last_name || ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                          Email
                        </span>
                        <span className="font-mono text-indianInk">
                          {orderDetails.customer_snapshot.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                          Phone
                        </span>
                        <span className="font-sans text-indianInk">
                          {orderDetails.customer_snapshot.phone || "Not listed"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">
                        Shipping Address
                      </span>
                      <p className="font-bold text-indianInk">
                        {orderDetails.shipping_address_snapshot.full_name}
                      </p>
                      <p className="text-indianInk mt-0.5 leading-relaxed">
                        {orderDetails.shipping_address_snapshot.address_line1}
                        {orderDetails.shipping_address_snapshot.address_line2 &&
                          `, ${orderDetails.shipping_address_snapshot.address_line2}`}
                      </p>
                      <p className="text-indianInk font-medium">
                        {orderDetails.shipping_address_snapshot.city},{" "}
                        {orderDetails.shipping_address_snapshot.state} -{" "}
                        {orderDetails.shipping_address_snapshot.pincode}
                      </p>
                      <p className="text-[10px] text-indianInk/40 mt-0.5">
                        {orderDetails.shipping_address_snapshot.country}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-xs italic flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Failed to sync order details.
                  </div>
                )}
              </div>

              {/* Administrative Actions */}
              {isAdmin && (
                <div className="border-t border-[#C49A45]/15 pt-4 flex justify-between gap-3">
                  <button
                    onClick={handleDeleteShipment}
                    disabled={deleteShipmentMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400 hover:bg-red-50 text-red-700 font-sans text-[10px] font-bold uppercase tracking-widest rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </button>
                  {selectedShipment.status !== "cancelled" && (
                    <button
                      onClick={handleCancelShipment}
                      disabled={cancelShipmentMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C62828] hover:bg-red-800 text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded transition shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel Dispatch
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Shipment Creation Dispatch Modal */}
      {isCreateModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-indianInk/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsCreateModalOpen(false);
              setCreateError("");
            }}
          />

          {/* Modal overlay */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="bg-white border border-[#C49A45]/20 shadow-2xl rounded-lg max-w-xl sm:max-w-2xl w-full overflow-hidden animate-fade-up">
              {/* Header */}
              <div className="bg-[#1E352F] text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C89B3C]" /> Dispatch Shipment (New)
                </h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError("");
                    setOrderSearchQuery("");
                  }}
                  className="p-1 hover:bg-white/10 rounded transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleCreateShipment}
                className="p-6 space-y-5 font-sans text-xs text-indianInk max-h-[85vh] overflow-y-auto"
              >
                {/* 1. High-Volume Searchable Order Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block">
                    1. Select Customer Order (Paid & Confirmed) <span className="text-red-500">*</span>
                  </label>

                  {selectedTargetOrder ? (
                    <div className="bg-[#FAF9F6] border-2 border-[#C89B3C] rounded-lg p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                          <span className="font-serif font-bold text-sm text-[#0F3D2E]">
                            Order #{selectedTargetOrder.order_number}
                          </span>
                          <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                            Paid & Confirmed
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, orderId: "" })}
                          className="text-[11px] font-sans font-bold text-[#C49A45] hover:text-[#0F3D2E] underline transition"
                        >
                          Change Order
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indianInk/80 pt-1 border-t border-[#C49A45]/20">
                        <div>
                          <span className="font-semibold text-indianInk block">
                            👤 {selectedTargetOrder.customer_snapshot.first_name || ""}{" "}
                            {selectedTargetOrder.customer_snapshot.last_name || ""}
                          </span>
                          <span className="text-indianInk/60 text-[10px] block truncate">
                            ✉️ {selectedTargetOrder.customer_snapshot.email}
                          </span>
                          <span className="text-indianInk/70 text-[10px] block">
                            📞{" "}
                            {selectedTargetOrder.customer_snapshot.phone ||
                              selectedTargetOrder.shipping_address_snapshot.phone}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-indianInk block">
                            📍 {selectedTargetOrder.shipping_address_snapshot.city},{" "}
                            {selectedTargetOrder.shipping_address_snapshot.state}
                          </span>
                          <span className="text-indianInk/60 text-[10px] block">
                            Pincode: {selectedTargetOrder.shipping_address_snapshot.pincode}
                          </span>
                          <span className="font-bold text-[#0F3D2E] text-xs block mt-0.5">
                            Total: {formatCurrency(selectedTargetOrder.pricing.grand_total)}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="pt-2 border-t border-[#C49A45]/15">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indianInk/50 block mb-1">
                          Items to Pack ({selectedTargetOrder.items?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTargetOrder.items?.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-medium bg-white border border-[#C49A45]/30 px-2 py-0.5 rounded text-indianInk"
                            >
                              <span>{item.product_name}</span>
                              <span className="text-indianInk/50">
                                ({item.variant_title || item.volume_weight || "Default"})
                              </span>
                              <strong className="text-[#0F3D2E]">x{item.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indianInk/40" />
                        <input
                          type="text"
                          placeholder="Search order #, customer name, phone, city, or product..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs border border-indianInk/20 rounded-md bg-[#FAF9F6]/40 focus:border-[#C49A45] focus:outline-none text-indianInk placeholder:text-indianInk/40"
                        />
                        {orderSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setOrderSearchQuery("")}
                            className="absolute right-2.5 top-2.5 text-indianInk/40 hover:text-indianInk"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Helper Counter */}
                      <div className="flex items-center justify-between text-[10px] text-indianInk/50 px-1 font-semibold uppercase tracking-wider">
                        <span>
                          Pending Orders: {filteredPendingOrders.length}{" "}
                          {filteredPendingOrders.length === 1 ? "order" : "orders"}
                        </span>
                        {orderSearchQuery && (
                          <span>Filtered by: &quot;{orderSearchQuery}&quot;</span>
                        )}
                      </div>

                      {/* Scrollable Order Cards List */}
                      {filteredPendingOrders.length > 0 ? (
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-indianInk/10 rounded-md p-1.5 bg-[#FAF9F6]/20">
                          {filteredPendingOrders.map((o) => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setCreateForm({ ...createForm, orderId: o.id });
                                setOrderSearchQuery("");
                              }}
                              className="p-2.5 bg-white border border-indianInk/10 hover:border-[#C89B3C] rounded-md cursor-pointer transition shadow-xs hover:shadow-sm space-y-1.5 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-serif font-bold text-xs text-[#0F3D2E] group-hover:text-[#C89B3C] transition">
                                    #{o.order_number}
                                  </span>
                                  <span className="text-[10px] text-indianInk/50">
                                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                <span className="font-bold text-xs text-[#0F3D2E]">
                                  {formatCurrency(o.pricing.grand_total)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-indianInk/70">
                                <span className="font-semibold text-indianInk truncate max-w-[200px]">
                                  👤 {o.customer_snapshot.first_name || ""}{" "}
                                  {o.customer_snapshot.last_name || ""}
                                </span>
                                <span className="text-[10px] text-indianInk/50">
                                  📍 {o.shipping_address_snapshot.city},{" "}
                                  {o.shipping_address_snapshot.state}
                                </span>
                              </div>

                              <div className="text-[10px] text-indianInk/60 truncate border-t border-indianInk/5 pt-1">
                                🛍️{" "}
                                {o.items
                                  ?.map((item) => `${item.product_name} x${item.quantity}`)
                                  .join(", ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center border border-dashed border-indianInk/20 rounded-md bg-[#FAF9F6]/50 text-xs text-indianInk/50">
                          {orderSearchQuery ? (
                            <span>No pending orders match &quot;{orderSearchQuery}&quot;.</span>
                          ) : (
                            <span>No confirmed &amp; paid orders waiting for dispatch.</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Courier Service Select (Interactive Cards) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block">
                    2. Courier Service <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COURIER_SERVICES.map((c) => {
                      const isSelected = createForm.carrierName === c.name;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setCreateForm({ ...createForm, carrierName: c.name })}
                          className={`p-3 border rounded-lg cursor-pointer transition flex items-start justify-between ${
                            isSelected
                              ? "bg-[#FAF9F6] border-[#0F3D2E] shadow-sm ring-1 ring-[#0F3D2E]"
                              : "bg-white border-indianInk/15 hover:border-[#C49A45]/60 hover:bg-[#FAF9F6]/40"
                          }`}
                        >
                          <div>
                            <span className="font-serif font-bold text-xs text-[#0F3D2E] block uppercase tracking-wide">
                              {c.name}
                            </span>
                            <span className="font-sans text-[10px] text-indianInk/50 block truncate max-w-[180px] mt-0.5">
                              {c.trackingUrl.replace("https://", "")}
                            </span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-[#0F3D2E] border-[#0F3D2E] text-white"
                                : "border-indianInk/30"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Tracking Number / ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block">
                    3. Tracking Number / Consignment ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tracking / consignment ID from courier..."
                    required
                    value={createForm.trackingNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, trackingNumber: e.target.value })
                    }
                    className="w-full text-xs border border-indianInk/20 focus:border-[#C49A45] rounded p-2.5 focus:outline-none bg-[#FAF9F6]/20 font-mono font-bold text-indianInk"
                  />
                </div>

                {createError && (
                  <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {createError}
                  </p>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-3 border-t border-indianInk/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateError("");
                      setOrderSearchQuery("");
                    }}
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider border border-indianInk/15 hover:bg-[#FAF9F6] text-indianInk rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createShipmentMutation.isPending ||
                      !createForm.orderId ||
                      !createForm.trackingNumber.trim()
                    }
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider bg-[#0F3D2E] hover:bg-[#15543F] text-richCream rounded transition shadow-md disabled:opacity-50 font-semibold"
                  >
                    {createShipmentMutation.isPending ? "Registering..." : "Register Dispatch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
