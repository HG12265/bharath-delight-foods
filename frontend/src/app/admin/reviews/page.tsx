"use client";

import React, { useState, useMemo } from "react";
import { useMe } from "@/hooks/use-auth";
import {
  useAdminReviews,
  useAdminApproveReview,
  useAdminRejectReview,
  useAdminReopenReview,
  useAdminReviewsSummary,
} from "@/hooks/use-reviews";
import {
  Loader2,
  Search,
  RefreshCw,
  Star,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter,
  User,
  Package,
  Mail,
  Calendar,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { ReviewModerationDetail } from "@/types";

// ─────────────────────────────────────────────
// Date Formatter
// ─────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────
// Star Rating Component
// ─────────────────────────────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < rating ? "fill-gheeGold text-gheeGold" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Moderation Status Badge
// ─────────────────────────────────────────────
function ModerationBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white border border-burnishedGold/15 rounded-xl p-4 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-serif text-2xl font-bold text-deodharForest leading-tight">
          {value}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Detail Drawer
// ─────────────────────────────────────────────
function ReviewDetailDrawer({
  review,
  isAdmin,
  onClose,
  onApprove,
  onReject,
  onReopen,
  isMutating,
}: {
  review: ReviewModerationDetail;
  isAdmin: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReopen: (id: string) => void;
  isMutating: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-burnishedGold/15 bg-[#FAF9F6]">
          <div>
            <div className="font-serif text-lg font-bold text-deodharForest">
              Review Details
            </div>
            <div className="text-xs text-indianInk/60 mt-0.5">
              <ModerationBadge status={review.moderation_status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-burnishedGold/10 text-indianInk/60 hover:text-indianInk transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Product Info */}
          <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-burnishedGold" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                Product
              </span>
            </div>
            <div className="font-bold text-sm text-deodharForest">
              {review.product_name}
            </div>
            <div className="text-[10px] text-indianInk/40 font-mono uppercase mt-0.5">
              ID: {review.product_id}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-burnishedGold" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                Customer
              </span>
            </div>
            <div className="font-bold text-sm text-deodharForest">
              {review.customer_name || "Unknown Customer"}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="w-3 h-3 text-indianInk/40" />
              <span className="text-[10px] text-indianInk/60">
                {review.customer_email || "—"}
              </span>
            </div>
            <div className="text-[10px] text-indianInk/40 font-mono uppercase mt-0.5">
              ID: {review.customer_id}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-gheeGold fill-gheeGold" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">
                Rating
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StarRating rating={review.rating} size="md" />
              <span className="font-serif text-xl font-bold text-deodharForest">
                {review.rating}/5
              </span>
            </div>
            {review.is_verified_purchase && (
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Verified Purchase
                </span>
              </div>
            )}
          </div>

          {/* Full Review Content */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 mb-2">
              Review Title
            </div>
            <div className="font-bold text-sm text-indianInk">
              &ldquo;{review.title}&rdquo;
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 mb-2">
              Review Content
            </div>
            <div className="text-xs text-indianInk/80 leading-relaxed whitespace-pre-line bg-white border border-burnishedGold/10 rounded-lg p-4">
              {review.comment}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-2 text-[10px] text-indianInk/40">
            <Calendar className="w-3 h-3" />
            <span>
              Submitted: {formatDate(review.created_at)}
            </span>
          </div>

          {/* Order Reference */}
          <div className="text-[10px] text-indianInk/40 font-mono uppercase">
            Order: {review.order_id}
          </div>
        </div>

        {/* Action Footer — ADMIN only */}
        {isAdmin && (
          <div className="p-4 border-t border-burnishedGold/15 bg-[#FAF9F6] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 mb-2">
              Moderation Actions
            </div>
            <div className="flex gap-2">
              {review.moderation_status !== "approved" && (
                <button
                  onClick={() => onApprove(review.id)}
                  disabled={isMutating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </button>
              )}
              {review.moderation_status !== "rejected" && (
                <button
                  onClick={() => onReject(review.id)}
                  disabled={isMutating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
              )}
              {review.moderation_status === "rejected" && (
                <button
                  onClick={() => onReopen(review.id)}
                  disabled={isMutating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-burnishedGold hover:bg-burnishedGold/90 text-deodharForest font-bold uppercase tracking-wider text-[10px] rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-open
                </button>
              )}
            </div>
            {isMutating && (
              <div className="flex items-center justify-center gap-2 text-[10px] text-indianInk/50 pt-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing moderation action...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AdminReviewsPage() {
  const { data: meData } = useMe();
  const user = meData?.data;
  const isAdmin = user?.role === "admin";

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] =
    useState<ReviewModerationDetail | null>(null);

  // Debounced search state for API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const queryParams = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: debouncedSearch || undefined,
    }),
    [statusFilter, debouncedSearch]
  );

  const {
    data: reviewsRes,
    isPending,
    error,
    refetch,
    isRefetching,
  } = useAdminReviews(queryParams);
  const { data: summaryRes } = useAdminReviewsSummary();

  const approveMutation = useAdminApproveReview();
  const rejectMutation = useAdminRejectReview();
  const reopenMutation = useAdminReopenReview();

  const reviews: ReviewModerationDetail[] = reviewsRes?.data || [];
  const summary = summaryRes?.data;

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    reopenMutation.isPending;

  const handleApprove = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to APPROVE this review? It will be published to the product details page."
      )
    ) {
      await approveMutation.mutateAsync(id);
      setSelectedReview(null);
    }
  };

  const handleReject = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to REJECT this review? It will be removed from the public display."
      )
    ) {
      await rejectMutation.mutateAsync(id);
      setSelectedReview(null);
    }
  };

  const handleReopen = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to RE-OPEN this review? It will go back to pending status for re-evaluation."
      )
    ) {
      await reopenMutation.mutateAsync(id);
      setSelectedReview(null);
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldAlert className="w-10 h-10 text-red-400" />
        <p className="text-sm text-indianInk/60">
          Failed to load review data.
        </p>
        <button
          onClick={() => refetch()}
          className="text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 px-4 py-2 rounded hover:bg-richCream/5 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="border-b border-burnishedGold/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Review Moderation
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
            Moderate customer feedback. Approved reviews are displayed publicly
            on the storefront product detail pages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh"
            className="p-2 border border-burnishedGold/25 rounded-lg hover:bg-richCream/10 text-indianInk/60 hover:text-indianInk transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total Reviews"
          value={summary?.total ?? 0}
          icon={MessageSquare}
          accent="bg-deodharForest/10 text-deodharForest"
        />
        <KpiCard
          label="Pending"
          value={summary?.pending ?? 0}
          icon={Clock}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Approved"
          value={summary?.approved ?? 0}
          icon={CheckCircle}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Rejected"
          value={summary?.rejected ?? 0}
          icon={XCircle}
          accent="bg-red-50 text-red-600"
        />
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indianInk/40">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search product, customer, review..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-sans text-xs border border-burnishedGold/30 focus:border-burnishedGold bg-white rounded-lg focus:outline-none placeholder-indianInk/40"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indianInk/40" />
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition ${
                statusFilter === s
                  ? s === "all"
                    ? "bg-deodharForest text-richCream border-deodharForest"
                    : s === "pending"
                    ? "bg-amber-500 text-white border-amber-500"
                    : s === "approved"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-red-600 text-white border-red-600"
                  : "bg-white text-indianInk/60 border-burnishedGold/20 hover:bg-richCream/10"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Reviews Table ─── */}
      <div className="bg-white border border-burnishedGold/15 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-sans text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-burnishedGold/10 text-indianInk/60">
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[200px]">
                  Product
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[180px]">
                  Customer
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[100px]">
                  Rating
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[240px]">
                  Review
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[110px]">
                  Date
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[110px]">
                  Status
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-right w-[130px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burnishedGold/8">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className={`hover:bg-richCream/5 transition-colors cursor-pointer ${
                      review.moderation_status === "rejected"
                        ? "bg-red-50/20"
                        : review.moderation_status === "pending"
                        ? "bg-amber-50/15"
                        : ""
                    }`}
                    onClick={() => setSelectedReview(review)}
                  >
                    {/* Product */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-indianInk truncate max-w-[190px]">
                        {review.product_name}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-indianInk truncate max-w-[170px]">
                        {review.customer_name || "—"}
                      </div>
                      <div className="text-[10px] text-indianInk/50 mt-0.5 truncate max-w-[170px]">
                        {review.customer_email || "—"}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3.5">
                      <StarRating rating={review.rating} />
                      <span className="text-[10px] font-bold text-indianInk/50 mt-0.5 block">
                        {review.rating}/5
                      </span>
                    </td>

                    {/* Review Title/Snippet */}
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <div className="font-bold text-indianInk text-xs truncate">
                        &ldquo;{review.title}&rdquo;
                      </div>
                      <p className="text-indianInk/60 text-[10px] mt-0.5 line-clamp-2 leading-relaxed">
                        {review.comment}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-[10px] text-indianInk/60">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <ModerationBadge status={review.moderation_status} />
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1.5">
                        {isAdmin && review.moderation_status !== "approved" && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={isMutating}
                            title="Approve"
                            className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        {isAdmin && review.moderation_status !== "rejected" && (
                          <button
                            onClick={() => handleReject(review.id)}
                            disabled={isMutating}
                            title="Reject"
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {isAdmin &&
                          review.moderation_status === "rejected" && (
                            <button
                              onClick={() => handleReopen(review.id)}
                              disabled={isMutating}
                              title="Re-open"
                              className="p-1.5 bg-burnishedGold hover:bg-burnishedGold/90 text-deodharForest rounded-lg transition shadow-sm disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        {/* View Detail button for all users */}
                        <button
                          onClick={() => setSelectedReview(review)}
                          title="View Details"
                          className="p-1.5 border border-burnishedGold/20 hover:border-burnishedGold bg-white hover:bg-richCream/10 rounded-lg text-indianInk/60 hover:text-indianInk transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-indianInk/40 italic text-xs"
                  >
                    {debouncedSearch || statusFilter !== "all"
                      ? "No reviews match the current search/filter criteria."
                      : "No reviews found in the system yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {reviews.length > 0 && (
          <div className="px-4 py-2.5 bg-[#FAF9F6] border-t border-burnishedGold/10 text-[10px] text-indianInk/50 font-sans flex items-center justify-between">
            <span>
              Showing <strong>{reviews.length}</strong> review
              {reviews.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && (
                <span className="ml-1">
                  ({statusFilter})
                </span>
              )}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-indianInk/30">
              Live data · Refreshed on load
            </span>
          </div>
        )}
      </div>

      {/* ─── Detail Drawer ─── */}
      {selectedReview && (
        <ReviewDetailDrawer
          review={selectedReview}
          isAdmin={isAdmin}
          onClose={() => setSelectedReview(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onReopen={handleReopen}
          isMutating={isMutating}
        />
      )}
    </div>
  );
}
