"use client";

import React, { useState } from "react";
import { useAdminClaims, useUpdateClaimStatus } from "@/hooks/use-claims";
import { DamageClaim } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  ExternalLink,
  RotateCcw,
  IndianRupee,
  Package,
  Search,
  Filter,
  Loader2,
  Eye,
  X,
  Send,
} from "lucide-react";

export default function AdminClaimsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Action Modal State
  const [activeClaimForAction, setActiveClaimForAction] = useState<DamageClaim | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | "resolved" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  const { data: claimsData, isPending, refetch } = useAdminClaims({
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const updateStatusMutation = useUpdateClaimStatus();

  const claims = claimsData?.data?.claims || [];
  const stats = claimsData?.data?.stats || {
    total: 0,
    pending: 0,
    approved: 0,
    resolved: 0,
  };

  // Filter claims by search query (Order #, Claim ID, Customer Name, Phone)
  const filteredClaims = claims.filter((claim) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      claim.claim_id?.toLowerCase().includes(q) ||
      claim.order_number?.toLowerCase().includes(q) ||
      claim.customer_name?.toLowerCase().includes(q) ||
      claim.customer_phone?.includes(q) ||
      claim.product_name?.toLowerCase().includes(q)
    );
  });

  const getIssueLabel = (type: string) => {
    switch (type) {
      case "broken_jar":
        return "🫙 Bottle / Jar Broken";
      case "leaked":
        return "💧 Ghee / Oil Leaked";
      case "seal_tampered":
        return "❌ Seal Tampered / Opened";
      case "package_damaged":
        return "📦 Packaging Crushed";
      case "wrong_item":
        return "❓ Wrong Item";
      case "quality_issue":
        return "⚠️ Quality / Smell Concern";
      default:
        return "📝 Other Issue";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} />
            <span>Pending Review</span>
          </span>
        );
      case "approved":
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Approved</span>
          </span>
        );
      case "resolved":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Resolved</span>
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <XCircle size={12} />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleOpenActionModal = (claim: DamageClaim, type: "approved" | "rejected" | "resolved") => {
    setActiveClaimForAction(claim);
    setActionType(type);
    setActionNotes(claim.admin_notes || "");
    setResolutionDetails("");
  };

  const handleConfirmAction = () => {
    if (!activeClaimForAction || !actionType) return;

    updateStatusMutation.mutate(
      {
        id: activeClaimForAction._id,
        payload: {
          status: actionType,
          admin_notes: actionNotes.trim() || undefined,
          resolution_details: resolutionDetails.trim()
            ? { details: resolutionDetails.trim() }
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setActiveClaimForAction(null);
          setActionType(null);
          setActionNotes("");
          setResolutionDetails("");
          refetch();
        },
      }
    );
  };

  const getWhatsAppLink = (claim: DamageClaim) => {
    const rawPhone = (claim.customer_phone || "").replace(/[^0-9]/g, "");
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = `வணக்கம் ${claim.customer_name}, Bharath Delight Foods-லிருந்து தொடர்பு கொள்கிறோம். உங்கள் Order #${claim.order_number} (${claim.product_name}) சேதமடைந்ததாக நீங்கள் அளித்த புகார் (Claim #${claim.claim_id}) குறித்து பரிசீலித்து வருகிறோம்.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-burnishedGold/15 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest flex items-center gap-2.5">
            <AlertTriangle className="text-amber-600 w-7 h-7" />
            <span>Damage & Replacement Claims</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-indianInk/60 mt-1">
            Review customer reports for broken jars, leaks, and damaged products with proof photos.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-sans">
        <div className="bg-white p-4 rounded-lg border border-burnishedGold/15 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indianInk/50">Total Claims</span>
          <p className="text-2xl font-bold text-deodharForest mt-1">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-300 shadow-xs bg-amber-50/20">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Pending Review</span>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800">Approved</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.approved || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Resolved</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.resolved || 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-burnishedGold/15 rounded-lg">
          {["all", "pending", "approved", "resolved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`px-3 py-1.5 rounded-[4px] font-sans text-xs font-semibold capitalize tracking-wide transition-colors ${
                selectedStatus === tab
                  ? "bg-deodharForest text-white shadow-xs"
                  : "text-indianInk/70 hover:bg-richCream/60"
              }`}
            >
              {tab === "all" ? "All Claims" : tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indianInk/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, Claim ID, Name..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
          />
        </div>
      </div>

      {/* Claims List */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-lg border border-burnishedGold/15">
          <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
          <p className="text-xs font-sans text-indianInk/60">Loading claims...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-burnishedGold/15 space-y-2">
          <CheckCircle2 size={40} className="mx-auto text-emerald-600/50" />
          <h3 className="font-serif text-lg font-bold text-deodharForest">No Claims Found</h3>
          <p className="text-xs font-sans text-indianInk/60 max-w-sm mx-auto">
            {selectedStatus !== "all"
              ? `There are currently no claims with status "${selectedStatus}".`
              : "No customer damage or replacement claims have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim._id}
              className="bg-white rounded-lg border border-burnishedGold/20 shadow-xs p-5 space-y-4 transition-all hover:border-burnishedGold/40"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-burnishedGold/10 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-deodharForest bg-burnishedGold/10 px-2 py-0.5 rounded">
                    {claim.claim_id}
                  </span>
                  <span className="text-xs font-sans text-indianInk/60">
                    Order #{claim.order_number}
                  </span>
                  <span className="text-xs font-sans text-indianInk/40">•</span>
                  <span className="text-xs font-sans text-indianInk/60">
                    {new Date(claim.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>{getStatusBadge(claim.status)}</div>
              </div>

              {/* Main Info Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Customer Info */}
                <div className="space-y-2 bg-[#FAF9F6] p-3.5 rounded border border-burnishedGold/15">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indianInk/50 font-sans block">
                    Customer Information
                  </span>
                  <div className="space-y-1 font-sans text-xs">
                    <p className="font-bold text-deodharForest text-sm">{claim.customer_name}</p>
                    <p className="text-indianInk/70">{claim.customer_email || "No email"}</p>
                    <p className="text-indianInk/70">Phone: {claim.customer_phone || "Not provided"}</p>
                  </div>

                  {claim.customer_phone && (
                    <a
                      href={getWhatsAppLink(claim)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded text-[11px] font-sans font-semibold tracking-wider transition-colors shadow-xs"
                    >
                      <MessageCircle size={14} />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* 2. Product & Damage Info */}
                <div className="space-y-2 bg-[#FAF9F6] p-3.5 rounded border border-burnishedGold/15">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indianInk/50 font-sans block">
                    Damaged Product Details
                  </span>
                  <div className="space-y-1.5 font-sans text-xs">
                    <div className="font-bold text-deodharForest text-sm flex items-center gap-1.5">
                      <Package size={16} className="text-burnishedGold shrink-0" />
                      <span>{claim.product_name} ({claim.variant_title})</span>
                    </div>
                    <p className="text-indianInk/70">
                      Damaged Qty: <strong className="text-deodharForest">{claim.quantity}</strong> unit(s)
                    </p>
                    <div className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold text-[11px]">
                      {getIssueLabel(claim.issue_type)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-indianInk/80 pt-1">
                      <span className="font-semibold">Desired Action:</span>
                      <span className="uppercase font-bold text-deodharForest">
                        {claim.preferred_resolution === "refund" ? "💰 Refund" : "🔄 Replacement"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Description & Notes */}
                <div className="space-y-2 bg-[#FAF9F6] p-3.5 rounded border border-burnishedGold/15 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indianInk/50 font-sans block">
                      Customer Description
                    </span>
                    <p className="text-xs font-sans text-indianInk/80 mt-1 leading-relaxed italic bg-white p-2.5 rounded border border-burnishedGold/10">
                      "{claim.description}"
                    </p>
                  </div>

                  {claim.admin_notes && (
                    <div className="mt-2 pt-2 border-t border-burnishedGold/10 text-[11px] font-sans">
                      <strong className="text-deodharForest">Admin Notes: </strong>
                      <span className="text-indianInk/70">{claim.admin_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof Photos Gallery */}
              {claim.images && claim.images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indianInk/50 font-sans block">
                    Proof Photos ({claim.images.length}) — Click to Zoom
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {claim.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImage(imgUrl)}
                        className="relative w-20 h-20 rounded border border-burnishedGold/25 overflow-hidden group hover:border-burnishedGold shadow-xs"
                      >
                        <img src={imgUrl} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-burnishedGold/10">
                <div className="text-xs font-sans text-indianInk/50">
                  Current Status: <strong className="capitalize text-deodharForest">{claim.status}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {claim.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(claim, "approved")}
                        className="px-3.5 py-1.5 bg-deodharForest text-white hover:bg-deodharForest/90 rounded text-xs font-sans font-semibold tracking-wider uppercase transition-colors shadow-xs"
                      >
                        Approve Claim
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(claim, "rejected")}
                        className="px-3.5 py-1.5 border border-rose-300 text-rose-800 hover:bg-rose-50 rounded text-xs font-sans font-semibold tracking-wider uppercase transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {claim.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => handleOpenActionModal(claim, "resolved")}
                      className="px-3.5 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded text-xs font-sans font-semibold tracking-wider uppercase transition-colors shadow-xs"
                    >
                      Mark Resolved (Shipped / Refunded)
                    </button>
                  )}

                  {claim.status === "resolved" && (
                    <span className="text-xs font-sans text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 size={16} /> Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-black text-white rounded-full hover:bg-destructive transition-colors shadow-lg"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="High resolution proof"
              className="max-h-[85vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {activeClaimForAction && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-burnishedGold/25 overflow-hidden">
            <div className="bg-deodharForest text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold capitalize">
                {actionType === "approved"
                  ? "Approve Damage Claim"
                  : actionType === "rejected"
                  ? "Reject Damage Claim"
                  : "Resolve Damage Claim"}
              </h3>
              <button
                onClick={() => setActiveClaimForAction(null)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs font-sans text-indianInk/80 space-y-1 bg-[#FAF9F6] p-3 rounded border border-burnishedGold/15">
                <p>
                  Claim: <strong>{activeClaimForAction.claim_id}</strong>
                </p>
                <p>
                  Customer: <strong>{activeClaimForAction.customer_name}</strong>
                </p>
                <p>
                  Product: <strong>{activeClaimForAction.product_name}</strong>
                </p>
                <p>
                  Requested: <strong className="uppercase">{activeClaimForAction.preferred_resolution}</strong>
                </p>
              </div>

              {actionType === "approved" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                    Resolution / Dispatch Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="e.g. Dispatched replacement via ST Courier Trk #83910"
                    className="w-full px-3 py-2 bg-white border border-indianInk/20 rounded font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Notes for records or follow up..."
                  className="w-full px-3 py-2 bg-white border border-indianInk/20 rounded font-sans text-xs text-indianInk focus:border-burnishedGold outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveClaimForAction(null)}
                  className="px-4 py-2 border border-indianInk/20 text-indianInk hover:bg-indianInk/5 rounded font-sans text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={updateStatusMutation.isPending}
                  className={`px-5 py-2 text-white rounded font-sans text-xs font-semibold uppercase flex items-center gap-1.5 ${
                    actionType === "rejected"
                      ? "bg-rose-700 hover:bg-rose-800"
                      : "bg-deodharForest hover:bg-deodharForest/90"
                  }`}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm {actionType}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

