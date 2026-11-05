"use client";

import React, { useState, useMemo } from "react";
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
  MapPin,
  Clipboard,
  Eye,
  X,
  Edit2,
  AlertCircle,
  Calendar,
  Trash2,
  Lock,
  User,
  Info,
  Check,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FolderOpen
} from "lucide-react";

export default function AdminShipmentsPage() {
  const { data: meData } = useMe();
  const user = meData?.data;
  const role = user?.role;
  const isAdmin = role === "admin";
  const isWarehouse = role === "warehouse";

  // Page States
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Data fetching
  const { data: shipmentsRes, isPending: isShipmentsPending, refetch, isRefetching } = useAdminShipments();
  const { data: ordersRes } = useAdminOrders(undefined, { enabled: isCreateModalOpen });

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
    carrierName: "",
    trackingNumber: "",
    awbNumber: "",
    estimatedDeliveryDate: ""
  });
  const [createError, setCreateError] = useState("");

  // Edit Carrier Info States
  const [isEditingCarrier, setIsEditingCarrier] = useState(false);
  const [editForm, setEditForm] = useState({
    carrierName: "",
    trackingNumber: "",
    awbNumber: "",
    estimatedDeliveryDate: ""
  });

  // Timeline Milestone States
  const [milestoneStatus, setMilestoneStatus] = useState("packed");
  const [milestoneLocation, setMilestoneLocation] = useState("");
  const [milestoneMessage, setMilestoneMessage] = useState("");

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
    { enabled: !!selectedShipmentId }
  );
  const orderDetails = orderDetailsRes?.data;

  // Filter orders that are confirmed, paid, and have no active shipment
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.order_status === "confirmed" &&
        order.payment_status === "paid" &&
        !shipments.some((s) => s.order_id === order.id)
    );
  }, [orders, shipments]);

  // Handle syncing edit fields when editing carrier info is opened
  const startEditingCarrier = () => {
    if (!selectedShipment) return;
    setEditForm({
      carrierName: selectedShipment.carrier_name,
      trackingNumber: selectedShipment.tracking_number,
      awbNumber: selectedShipment.awb_number || "",
      estimatedDeliveryDate: selectedShipment.estimated_delivery_date
        ? new Date(selectedShipment.estimated_delivery_date).toISOString().split("T")[0]
        : ""
    });
    setIsEditingCarrier(true);
  };

  const handleSaveCarrierEdit = async () => {
    if (!selectedShipment) return;
    if (!editForm.carrierName.trim() || !editForm.trackingNumber.trim()) {
      alert("Carrier Name and Tracking Number are required.");
      return;
    }

    try {
      const payload: any = {
        carrier_name: editForm.carrierName.trim(),
        tracking_number: editForm.trackingNumber.trim(),
        awb_number: editForm.awbNumber.trim() || null,
        estimated_delivery_date: editForm.estimatedDeliveryDate
          ? new Date(editForm.estimatedDeliveryDate).toISOString()
          : null
      };

      await editShipmentMutation.mutateAsync({
        id: selectedShipment.id,
        payload
      });
      setIsEditingCarrier(false);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update shipment carrier info.");
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
      setCreateError("Carrier Name is required.");
      return;
    }
    if (!createForm.trackingNumber.trim()) {
      setCreateError("Tracking Number is required.");
      return;
    }

    try {
      const payload: any = {
        carrier_name: createForm.carrierName.trim(),
        tracking_number: createForm.trackingNumber.trim(),
        awb_number: createForm.awbNumber.trim() || undefined
      };

      if (createForm.estimatedDeliveryDate) {
        payload.estimated_delivery_date = new Date(createForm.estimatedDeliveryDate).toISOString();
      }

      await createShipmentMutation.mutateAsync({
        orderId: createForm.orderId,
        payload
      });

      // Clear form and close
      setCreateForm({
        orderId: "",
        carrierName: "",
        trackingNumber: "",
        awbNumber: "",
        estimatedDeliveryDate: ""
      });
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Failed to create shipment dispatch.");
    }
  };

  // Add timeline milestone transit log
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    if (!milestoneMessage.trim()) {
      alert("Milestone message log is required.");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedShipment.id,
        payload: {
          status: milestoneStatus as any,
          message: milestoneMessage.trim(),
          location: milestoneLocation.trim() || undefined
        }
      });
      setMilestoneMessage("");
      setMilestoneLocation("");
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to log milestone stop.");
    }
  };

  // Cancel shipment status overrides (Admin only)
  const handleCancelShipment = async () => {
    if (!selectedShipment) return;
    if (!confirm("Are you sure you want to administratively CANCEL this shipment? This will set fulfillment status to cancelled.")) {
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
    if (!confirm("CRITICAL: Are you sure you want to DELETE this shipment record from the active registry? This soft-deletes the shipment doc.")) {
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
      if (statusFilter !== "all" && shipment.status !== statusFilter) {
        return false;
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

      // Search by Customer Email (We look up using cached order info snapshot or customer details if loaded)
      if (searchEmail.trim()) {
        const eQuery = searchEmail.toLowerCase().trim();
        // Since we retrieve orders to check customer emails
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
      currency: "INR"
    }).format(val);
  };

  const getShipmentBadge = (status: string) => {
    let classes = "inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ";
    switch (status) {
      case "delivered":
        classes += "bg-green-50 text-[#2E7D32] border-[#2E7D32]/20";
        break;
      case "shipped":
        classes += "bg-blue-50 text-[#1565C0] border-[#1565C0]/20";
        break;
      case "reached_hub":
        classes += "bg-purple-50 text-purple-700 border-purple-250/20";
        break;
      case "out_for_delivery":
        classes += "bg-indigo-50 text-indigo-700 border-indigo-200";
        break;
      case "packed":
        classes += "bg-amber-50 text-[#C49A45] border-[#C49A45]/20";
        break;
      case "cancelled":
        classes += "bg-red-50 text-[#C62828] border-[#C62828]/20";
        break;
      case "returned":
        classes += "bg-gray-50 text-gray-700 border-gray-200";
        break;
      default:
        classes += "bg-yellow-50 text-yellow-800 border-yellow-200";
    }
    return <span className={classes}>{status.replace(/_/g, " ")}</span>;
  };

  const formatDateTime = (val?: string) => {
    if (!val) return "Not recorded";
    return new Date(val).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isShipmentsPending) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C49A45]" />
        <p className="font-sans text-xs text-indianInk/50 tracking-widest uppercase">Loading logistics registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Dispatch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C49A45]/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1E352F]">
            Shipments & Logistics
          </h1>
          <p className="font-sans text-xs text-indianInk/60 mt-1">
            {isWarehouse
              ? "Operations: Dispatch manual couriers, log sorting milestones, and update order transits."
              : "Administration: Monitor dispatches, cancel labels, edit carrier records, and oversee logistics timelines."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-[#C49A45]/30 hover:border-[#C49A45] bg-white text-[#1E352F] font-sans text-xs font-bold uppercase tracking-widest rounded transition disabled:opacity-50 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E352F] hover:bg-[#1E352F]/90 text-white font-sans text-xs font-bold uppercase tracking-widest rounded transition shadow-md font-semibold"
          >
            <Plus className="w-4 h-4" />
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
              { status: "all", label: "All Shipments" },
              { status: "packed", label: "Packed" },
              { status: "shipped", label: "Shipped" },
              { status: "out_for_delivery", label: "Out For Delivery" },
              { status: "delivered", label: "Delivered" },
              { status: "returned", label: "Returned" },
              { status: "cancelled", label: "Cancelled" }
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
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[140px]">Shipment ID</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[110px]">Order No</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[160px]">Customer</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[130px]">Carrier</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[160px]">Tracking Number</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[120px]">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[120px]">Dispatched At</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-widest w-[80px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indianInk/5">
                  {filteredShipments.map((shipment, index) => {
                    const matchedOrder = orders.find((o) => o.id === shipment.order_id);
                    const customerName = matchedOrder
                      ? `${matchedOrder.customer_snapshot.first_name || ""} ${matchedOrder.customer_snapshot.last_name || ""}`.trim()
                      : "Guest Customer";

                    return (
                      <tr
                        key={shipment.id}
                        onClick={() => setSelectedShipmentId(shipment.id)}
                        className={`transition-colors cursor-pointer ${
                          index % 2 === 1 ? "bg-indianInk/[0.015]" : "bg-white"
                        } hover:bg-[#F2ECE4]/40`}
                      >
                        <td className="px-4 py-3.5 font-mono text-[10px] text-indianInk/60">
                          {shipment.id.substring(0, 10)}...
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#1E352F]">
                          #{shipment.order_number}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-indianInk">
                          {customerName}
                        </td>
                        <td className="px-4 py-3.5 text-indianInk/80 uppercase font-medium">
                          {shipment.carrier_name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-indianInk">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Clipboard className="w-3.5 h-3.5 text-[#C49A45]/70" />
                            <span>{shipment.tracking_number}</span>
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
                            className="p-1 text-deodharForest hover:bg-[#FAF9F6] border border-[#C49A45]/20 hover:border-[#C49A45] rounded transition"
                            title="Open Logistics Details"
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
                : "Guest Customer";

              return (
                <div
                  key={shipment.id}
                  onClick={() => setSelectedShipmentId(shipment.id)}
                  className="bg-white border border-[#C49A45]/15 rounded p-4 shadow-sm hover:border-[#C49A45] transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-xs text-[#1E352F]">#{shipment.order_number}</span>
                    <span className="font-mono text-[9px] text-indianInk/40">ID: {shipment.id.substring(0, 10)}</span>
                  </div>

                  <div className="text-[11px] space-y-1 text-indianInk/70">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-semibold text-indianInk">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carrier:</span>
                      <span className="font-bold text-indianInk uppercase">{shipment.carrier_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tracking:</span>
                      <span className="font-mono font-bold text-indianInk">{shipment.tracking_number}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#C49A45]/10 pt-2 flex justify-between items-center">
                    {getShipmentBadge(shipment.status)}
                    <span className="text-[9px] text-indianInk/40">{new Date(shipment.created_at).toLocaleDateString("en-IN")}</span>
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
            There are no logistics shipments in the registry matching your parameters. Clear search or dispatch a new order.
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
                  Shipment Details
                </h2>
                <p className="font-sans text-[10px] uppercase tracking-wider text-white/60 mt-0.5 font-bold">
                  Order #{selectedShipment.order_number} | Status: {selectedShipment.status.replace(/_/g, " ").toUpperCase()}
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
              
              {/* Visual Timeline Stepper */}
              {!["cancelled", "returned", "failed"].includes(selectedShipment.status) && (
                <div className="bg-white border border-[#C49A45]/15 rounded p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    {["packed", "shipped", "out_for_delivery", "delivered"].map((step, idx, arr) => {
                      const stepLabels: Record<string, string> = {
                        packed: "Packed",
                        shipped: "Shipped",
                        out_for_delivery: "Out For Delivery",
                        delivered: "Delivered",
                      };

                      const statusIndex = arr.indexOf(selectedShipment.status);
                      const isCompleted = idx <= statusIndex && statusIndex !== -1;
                      const isCurrent = idx === statusIndex;

                      return (
                        <React.Fragment key={step}>
                          {/* Step Circle */}
                          <div className="flex flex-col items-center flex-1 relative">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                              isCompleted 
                                ? "bg-[#1E352F] border-[#1E352F] text-white" 
                                : "bg-white border-indianInk/20 text-indianInk/40"
                            } ${isCurrent ? "ring-4 ring-[#C49A45]/20 font-bold" : ""}`}>
                              {isCompleted && !isCurrent ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span className="text-[10px]">{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-[10px] mt-2 font-semibold text-center uppercase tracking-wider ${
                              isCurrent 
                                ? "text-[#1E352F] font-bold" 
                                : isCompleted 
                                  ? "text-indianInk font-medium" 
                                  : "text-indianInk/40"
                            }`}>
                              {stepLabels[step]}
                            </span>
                          </div>

                          {/* Line between steps */}
                          {idx < arr.length - 1 && (
                            <div className={`h-0.5 flex-1 self-start mt-3.5 -mx-4 transition-all ${
                              (statusIndex !== -1 && idx < statusIndex) ? "bg-[#1E352F]" : "bg-indianInk/10"
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Info Section */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-3 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <User className="w-4 h-4 text-[#C49A45]" /> Recipient Delivery Information
                </h4>
                {isOrderPending ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C49A45]" />
                    <span className="text-[10px] text-indianInk/50 italic">Retrieving customer database records...</span>
                  </div>
                ) : orderDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Customer Name</span>
                        <span className="font-bold text-indianInk">
                          {orderDetails.customer_snapshot.first_name || ""} {orderDetails.customer_snapshot.last_name || ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Email</span>
                        <span className="font-mono text-indianInk">{orderDetails.customer_snapshot.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Phone</span>
                        <span className="font-sans text-indianInk">{orderDetails.customer_snapshot.phone || "Not listed"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Shipping Destination</span>
                      <p className="font-bold text-indianInk">{orderDetails.shipping_address_snapshot.full_name}</p>
                      <p className="text-indianInk mt-0.5 leading-relaxed">
                        {orderDetails.shipping_address_snapshot.address_line1}
                        {orderDetails.shipping_address_snapshot.address_line2 && `, ${orderDetails.shipping_address_snapshot.address_line2}`}
                      </p>
                      <p className="text-indianInk font-medium">
                        {orderDetails.shipping_address_snapshot.city}, {orderDetails.shipping_address_snapshot.state} - {orderDetails.shipping_address_snapshot.pincode}
                      </p>
                      <p className="text-[10px] text-indianInk/40 mt-0.5">{orderDetails.shipping_address_snapshot.country}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-xs italic flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Failed to sync database order details. Order snapshot might have been archived.
                  </div>
                )}
              </div>

              {/* Carrier Info Section */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-indianInk/5 pb-2">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#C49A45]" /> Carrier & Tracking Routing
                  </h4>
                  {isAdmin && !isEditingCarrier && (
                    <button
                      onClick={startEditingCarrier}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#C49A45] hover:underline"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Info
                    </button>
                  )}
                </div>

                {isEditingCarrier ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">Carrier Name</label>
                        <input
                          type="text"
                          value={editForm.carrierName}
                          onChange={(e) => setEditForm({ ...editForm, carrierName: e.target.value })}
                          className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs bg-[#FAF9F6]/30"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">Tracking Number</label>
                        <input
                          type="text"
                          value={editForm.trackingNumber}
                          onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                          className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs bg-[#FAF9F6]/30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">AWB Number (Optional)</label>
                        <input
                          type="text"
                          value={editForm.awbNumber}
                          onChange={(e) => setEditForm({ ...editForm, awbNumber: e.target.value })}
                          className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs bg-[#FAF9F6]/30"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">Estimated Delivery Date</label>
                        <input
                          type="date"
                          value={editForm.estimatedDeliveryDate}
                          onChange={(e) => setEditForm({ ...editForm, estimatedDeliveryDate: e.target.value })}
                          className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs bg-[#FAF9F6]/30"
                        />
                      </div>
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
                        className="px-3.5 py-1.5 bg-[#1E352F] hover:bg-[#1E352F]/90 text-white rounded font-bold uppercase text-[10px] tracking-wide"
                      >
                        {editShipmentMutation.isPending ? "Saving..." : "Save Edits"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Courier Carrier</span>
                        <span className="font-bold text-[#1E352F] uppercase tracking-wide">{selectedShipment.carrier_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">AWB Waybill</span>
                        <span className="font-mono font-medium text-indianInk">
                          {selectedShipment.awb_number || "Not assigned"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Tracking Number ID</span>
                        <code className="font-mono text-indianInk font-semibold bg-[#FAF9F6] border border-[#C49A45]/20 p-1.5 rounded inline-block text-[10px] select-all">
                          {selectedShipment.tracking_number}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-indianInk/50 block font-semibold uppercase">Estimated Delivery</span>
                        <span className="font-sans font-semibold text-indianInk flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C49A45]" />
                          {selectedShipment.estimated_delivery_date
                            ? formatDateTime(selectedShipment.estimated_delivery_date).split(",")[0]
                            : "Not Scheduled"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Section */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-4 shadow-sm">
                <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5 border-b border-indianInk/5 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C49A45]" /> Shipment Logistics Timeline
                </h4>

                <div className="relative border-l border-burnishedGold/25 ml-3 pl-5 space-y-4 py-2">
                  {selectedShipment.timeline && selectedShipment.timeline.length > 0 ? (
                    selectedShipment.timeline.map((event, index) => {
                      const isLatest = index === selectedShipment.timeline.length - 1;
                      return (
                        <div key={index} className="relative">
                          <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full border bg-white ${
                            isLatest ? "border-[#C49A45] text-[#C49A45]" : "border-indianInk/20"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-[#C49A45] animate-ping" : "bg-indianInk/30"}`} />
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className={`font-serif text-[11px] font-bold uppercase ${isLatest ? "text-deodharForest" : "text-indianInk/60"}`}>
                                {(event.status || "").replace(/_/g, " ")}
                              </span>
                              <span className="text-[9px] text-indianInk/40">
                                {formatDateTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="text-indianInk/70">{event.message}</p>
                            {event.location && (
                              <p className="text-[9px] text-indianInk/50 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-red-500" /> Location: {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-indianInk/40 italic">No events logged for this transit registry.</span>
                  )}
                </div>

                {/* Timeline update form (Warehouse/Admin) */}
                {selectedShipment.status !== "cancelled" && selectedShipment.status !== "delivered" && (
                  <form onSubmit={handleAddMilestone} className="border-t border-[#C49A45]/15 pt-3 space-y-3">
                    <h5 className="font-serif text-xs font-bold text-deodharForest flex items-center gap-1.5">
                      Log Transit Stop Update
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">Status Milestone</label>
                        <select
                          value={milestoneStatus}
                          onChange={(e) => setMilestoneStatus(e.target.value)}
                          className="w-full mt-1 bg-white border border-indianInk/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C49A45] font-semibold text-indianInk uppercase"
                        >
                          <option value="packed">packed</option>
                          <option value="shipped">shipped</option>
                          <option value="out_for_delivery">out_for_delivery</option>
                          <option value="delivered">delivered</option>
                          <option value="failed">failed</option>
                          <option value="returned">returned</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-indianInk/50">Transit Location (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Salem sorting hub, Transit Point..."
                          value={milestoneLocation}
                          onChange={(e) => setMilestoneLocation(e.target.value)}
                          className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C49A45] bg-white text-indianInk"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-indianInk/50">Activity Message log</label>
                      <input
                        type="text"
                        placeholder="e.g. Dispatched from transit sorting office..."
                        value={milestoneMessage}
                        required
                        onChange={(e) => setMilestoneMessage(e.target.value)}
                        className="w-full mt-1 border border-indianInk/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C49A45] bg-white text-indianInk"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updateStatusMutation.isPending}
                        className="px-3.5 py-1.5 bg-[#1E352F] hover:bg-[#1E352F]/90 text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded transition disabled:opacity-50"
                      >
                        Log Status Stop
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Delivery Proof Section (Future Ready UI Only) */}
              <div className="bg-white border border-[#C49A45]/15 rounded p-4 space-y-3 shadow-sm relative opacity-60">
                <div className="flex justify-between items-center border-b border-indianInk/5 pb-2">
                  <h4 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C49A45]" /> Delivery Proof Verification
                  </h4>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-[#C49A45] border border-[#C49A45]/30 px-1.5 py-0.5 rounded bg-[#FAF9F6]">
                    Future Feature
                  </span>
                </div>
                <p className="text-[10px] text-indianInk/50 italic leading-relaxed">
                  Placeholder UI for delivery logs verification. Digital signatures and geo-tracking uploads will populate here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="border border-dashed border-indianInk/15 rounded p-2.5 text-center bg-[#FAF9F6]/20">
                    <span className="text-[9px] font-bold block text-indianInk/40 uppercase">Delivery Proof Doc</span>
                    <button disabled className="mt-2 text-[9px] font-bold text-deodharForest bg-indianInk/5 px-2 py-1 rounded cursor-not-allowed uppercase border border-indianInk/10">
                      Upload PDF
                    </button>
                  </div>
                  <div className="border border-dashed border-indianInk/15 rounded p-2.5 text-center bg-[#FAF9F6]/20">
                    <span className="text-[9px] font-bold block text-indianInk/40 uppercase">Signature Pad</span>
                    <div className="h-10 border border-indianInk/10 bg-indianInk/[0.02] rounded mt-1.5 flex items-center justify-center text-[8px] text-indianInk/30 italic">
                      Draw Signature
                    </div>
                  </div>
                  <div className="border border-dashed border-indianInk/15 rounded p-2.5 text-center bg-[#FAF9F6]/20">
                    <span className="text-[9px] font-bold block text-indianInk/40 uppercase">Delivery Photo</span>
                    <button disabled className="mt-2 text-[9px] font-bold text-deodharForest bg-indianInk/5 px-2 py-1 rounded cursor-not-allowed uppercase border border-indianInk/10">
                      Capture Image
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Override / Soft-Delete (Admin only) */}
              {isAdmin && (
                <div className="border-t border-[#C49A45]/15 pt-4 flex justify-between gap-3">
                  <button
                    onClick={handleDeleteShipment}
                    disabled={deleteShipmentMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500 hover:bg-red-50 text-red-700 font-sans text-[10px] font-bold uppercase tracking-widest rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Shipment
                  </button>
                  {selectedShipment.status !== "cancelled" && (
                    <button
                      onClick={handleCancelShipment}
                      disabled={cancelShipmentMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C62828] hover:bg-red-800 text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded transition shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel Label
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
            <div className="bg-white border border-[#C49A45]/20 shadow-2xl rounded-lg max-w-lg w-full overflow-hidden animate-fade-up">
              {/* Header */}
              <div className="bg-[#1E352F] text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C49A45]" /> Dispatch Shipment (New)
                </h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError("");
                  }}
                  className="p-1 hover:bg-white/10 rounded transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateShipment} className="p-6 space-y-4 font-sans text-xs text-indianInk">
                
                {/* Order Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                    Select Customer Order (Paid & Confirmed)
                  </label>
                  {pendingOrders.length > 0 ? (
                    <select
                      value={createForm.orderId}
                      onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })}
                      className="w-full text-xs border border-indianInk/15 focus:border-[#C49A45] rounded p-2.5 focus:outline-none bg-[#FAF9F6]/20 font-semibold"
                    >
                      <option value="">-- Choose Order --</option>
                      {pendingOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order #{o.order_number} — {o.customer_snapshot.first_name || ""} ({formatCurrency(o.pricing.grand_total)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded font-semibold italic flex items-center gap-1.5 leading-relaxed text-[10px]">
                      <Info className="w-4 h-4 text-yellow-600 shrink-0" />
                      No confirmed & paid orders are waiting for shipment dispatch in database.
                    </div>
                  )}
                </div>

                {/* Carrier & Tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                      Carrier Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhivery, Professional Couriers..."
                      required
                      value={createForm.carrierName}
                      onChange={(e) => setCreateForm({ ...createForm, carrierName: e.target.value })}
                      className="w-full text-xs border border-indianInk/15 focus:border-[#C49A45] rounded p-2 focus:outline-none bg-[#FAF9F6]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                      Tracking Number / Consignment ID <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DX99382109IN..."
                      required
                      value={createForm.trackingNumber}
                      onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
                      className="w-full text-xs border border-indianInk/15 focus:border-[#C49A45] rounded p-2 focus:outline-none bg-[#FAF9F6]/20 font-mono"
                    />
                  </div>
                </div>

                {/* AWB Number & Estimated Delivery Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                      Air Waybill (AWB) Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWB-100203..."
                      value={createForm.awbNumber}
                      onChange={(e) => setCreateForm({ ...createForm, awbNumber: e.target.value })}
                      className="w-full text-xs border border-indianInk/15 focus:border-[#C49A45] rounded p-2 focus:outline-none bg-[#FAF9F6]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                      Estimated Delivery Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={createForm.estimatedDeliveryDate}
                      onChange={(e) => setCreateForm({ ...createForm, estimatedDeliveryDate: e.target.value })}
                      className="w-full text-xs border border-indianInk/15 focus:border-[#C49A45] rounded p-2 focus:outline-none bg-[#FAF9F6]/20"
                    />
                  </div>
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
                    }}
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider border border-indianInk/15 hover:bg-[#FAF9F6] text-indianInk rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createShipmentMutation.isPending || pendingOrders.length === 0}
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider bg-[#1E352F] hover:bg-[#1E352F]/90 text-white rounded transition shadow-md disabled:opacity-50 font-semibold"
                  >
                    {createShipmentMutation.isPending ? "Dispatched..." : "Register Dispatch"}
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
