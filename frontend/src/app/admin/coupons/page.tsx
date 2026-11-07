"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useToggleCouponStatus,
  useDeleteCoupon,
} from "@/hooks/use-coupons";
import {
  Ticket,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Copy,
  Calendar,
  Percent,
  IndianRupee,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Coupon, CreateCouponPayload, UpdateCouponPayload } from "@/types";

export default function AdminCouponsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: couponsRes, isPending, refetch } = useAdminCoupons({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const toggleStatusMutation = useToggleCouponStatus();
  const deleteCouponMutation = useDeleteCoupon();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"flat" | "percentage">("flat");
  const [formDiscountValue, setFormDiscountValue] = useState<string>("");
  const [formMinOrder, setFormMinOrder] = useState<string>("0");
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formUsageLimit, setFormUsageLimit] = useState<string>("");
  const [formValidUntil, setFormValidUntil] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formError, setFormError] = useState("");

  const coupons = useMemo(() => couponsRes?.data?.coupons || [], [couponsRes]);
  const stats = useMemo(
    () =>
      couponsRes?.data?.stats || {
        total: 0,
        active: 0,
        inactive: 0,
        total_used: 0,
      },
    [couponsRes],
  );

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormDiscountType("flat");
    setFormDiscountValue("");
    setFormMinOrder("0");
    setFormMaxDiscount("");
    setFormUsageLimit("");
    setFormValidUntil("");
    setFormStatus("active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormName(coupon.name);
    setFormDescription(coupon.description || "");
    setFormDiscountType(coupon.discount_type);
    setFormDiscountValue(String(coupon.discount_value));
    setFormMinOrder(String(coupon.min_order_amount || 0));
    setFormMaxDiscount(coupon.max_discount_amount ? String(coupon.max_discount_amount) : "");
    setFormUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : "");
    setFormValidUntil(coupon.valid_until ? coupon.valid_until.substring(0, 10) : "");
    setFormStatus(coupon.status);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError("Coupon code is required.");
      return;
    }
    if (!/^[A-Z0-9_-]{3,25}$/.test(cleanCode)) {
      setFormError("Code must be 3-25 alphanumeric characters (e.g. SAVE100).");
      return;
    }

    if (!formName.trim()) {
      setFormError("Coupon name is required.");
      return;
    }

    const discountVal = parseFloat(formDiscountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      setFormError("Please enter a valid discount amount greater than 0.");
      return;
    }
    if (formDiscountType === "percentage" && discountVal > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    const minOrderVal = parseFloat(formMinOrder) || 0;
    const maxDiscountVal = formMaxDiscount ? parseFloat(formMaxDiscount) : null;
    const usageLimitVal = formUsageLimit ? parseInt(formUsageLimit, 10) : null;
    const validUntilVal = formValidUntil ? new Date(formValidUntil).toISOString() : null;

    if (editingCoupon) {
      const payload: UpdateCouponPayload = {
        name: formName.trim(),
        description: formDescription.trim(),
        discount_type: formDiscountType,
        discount_value: discountVal,
        min_order_amount: minOrderVal,
        max_discount_amount: maxDiscountVal,
        usage_limit: usageLimitVal,
        status: formStatus,
        valid_until: validUntilVal,
      };

      updateCouponMutation.mutate(
        { id: editingCoupon._id || editingCoupon.id || "", payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            refetch();
          },
          onError: (err: any) => {
            setFormError(err.response?.data?.message || err.message || "Failed to update coupon.");
          },
        },
      );
    } else {
      const payload: CreateCouponPayload = {
        code: cleanCode,
        name: formName.trim(),
        description: formDescription.trim(),
        discount_type: formDiscountType,
        discount_value: discountVal,
        min_order_amount: minOrderVal,
        max_discount_amount: maxDiscountVal,
        usage_limit: usageLimitVal,
        status: formStatus,
        valid_until: validUntilVal,
      };

      createCouponMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
          refetch();
        },
        onError: (err: any) => {
          setFormError(err.response?.data?.message || err.message || "Failed to create coupon.");
        },
      });
    }
  };

  const handleDeleteCoupon = (id: string) => {
    deleteCouponMutation.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        refetch();
      },
    });
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-burnishedGold/15 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-6 h-6 text-burnishedGold" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-deodharForest">
              Coupon Management
            </h1>
          </div>
          <p className="text-xs text-indianInk/60">
            Create discount codes, set flat amount or percentage discounts, and distribute to customers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-wider uppercase hover:border-gheeGold border border-transparent transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm">
          <p className="text-[11px] font-sans font-semibold tracking-wider uppercase text-indianInk/50">
            Total Coupons
          </p>
          <p className="font-serif text-2xl font-bold text-deodharForest mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm">
          <p className="text-[11px] font-sans font-semibold tracking-wider uppercase text-emerald-700">
            Active Coupons
          </p>
          <p className="font-serif text-2xl font-bold text-emerald-700 mt-1">
            {stats.active}
          </p>
        </div>

        <div className="bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm">
          <p className="text-[11px] font-sans font-semibold tracking-wider uppercase text-indianInk/40">
            Inactive Coupons
          </p>
          <p className="font-serif text-2xl font-bold text-indianInk/60 mt-1">
            {stats.inactive}
          </p>
        </div>

        <div className="bg-white border border-burnishedGold/15 rounded-lg p-5 shadow-sm">
          <p className="text-[11px] font-sans font-semibold tracking-wider uppercase text-[#5f259f]">
            Times Used
          </p>
          <p className="font-serif text-2xl font-bold text-[#5f259f] mt-1">
            {stats.total_used}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 border border-burnishedGold/15 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-indianInk/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by coupon code, name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/20 rounded focus:outline-none focus:border-deodharForest font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                statusFilter === status
                  ? "bg-deodharForest text-richCream"
                  : "bg-[#FAF9F6] text-indianInk/70 hover:bg-richCream/60 border border-burnishedGold/15"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {isPending ? (
        <div className="h-64 bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
          <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
            Loading Coupons...
          </p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-burnishedGold/15 rounded-lg p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-burnishedGold/10 rounded-full flex items-center justify-center mx-auto text-burnishedGold">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-deodharForest">No coupons found</h3>
            <p className="text-xs text-indianInk/60 mt-1 max-w-md mx-auto">
              Create your first promotional discount coupon to share with special customers.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-deodharForest text-richCream rounded text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Coupon Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((coupon) => {
            const couponId = coupon._id || coupon.id || "";
            const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
            const isActive = coupon.status === "active" && !isExpired;

            return (
              <div
                key={couponId}
                className="bg-white border border-burnishedGold/15 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Coupon Top Header */}
                <div className="p-5 border-b border-burnishedGold/10 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-deodharForest tracking-wider bg-burnishedGold/10 px-2.5 py-0.5 rounded border border-burnishedGold/25">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="p-1 text-indianInk/40 hover:text-deodharForest transition-colors rounded"
                          title="Copy Code"
                        >
                          {copiedCode === coupon.code ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-deodharForest pt-1">
                        {coupon.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isExpired
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                    >
                      {isExpired ? "Expired" : coupon.status}
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="text-xs text-indianInk/65 leading-relaxed">
                      {coupon.description}
                    </p>
                  )}
                </div>

                {/* Coupon Details */}
                <div className="p-5 space-y-3 text-xs bg-[#FAF9F6]/50">
                  <div className="flex justify-between items-center">
                    <span className="text-indianInk/60 font-medium">Discount:</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}% OFF`
                        : `${formatINR(coupon.discount_value)} FLAT OFF`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-indianInk/60 font-medium">Minimum Order:</span>
                    <span className="font-semibold text-indianInk">
                      {coupon.min_order_amount > 0 ? formatINR(coupon.min_order_amount) : "No Minimum"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-indianInk/60 font-medium">Times Used:</span>
                    <span className="font-semibold text-[#5f259f]">
                      {coupon.used_count || 0} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : "times"}
                    </span>
                  </div>

                  {coupon.valid_until && (
                    <div className="flex justify-between items-center">
                      <span className="text-indianInk/60 font-medium">Valid Until:</span>
                      <span className="font-semibold text-indianInk/80 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-burnishedGold" />
                        {new Date(coupon.valid_until).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-burnishedGold/15 bg-white flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(couponId)}
                    disabled={toggleStatusMutation.isPending}
                    className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                      coupon.status === "active"
                        ? "text-amber-800 hover:bg-amber-50"
                        : "text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    {coupon.status === "active" ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-1.5 text-indianInk/60 hover:text-deodharForest hover:bg-richCream/60 rounded transition-colors"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(couponId)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-indianInk/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-burnishedGold/20 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-burnishedGold/15 flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-deodharForest" />
                <h3 className="font-serif text-lg font-bold text-deodharForest">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-richCream rounded-full text-indianInk/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME100, FESTIVE50"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  disabled={!!editingCoupon}
                  required
                  className="w-full px-3 py-2 text-xs uppercase font-mono tracking-wider bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest disabled:opacity-60"
                />
                <p className="text-[10px] text-indianInk/50">
                  Customers enter this code at checkout to claim the discount.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Inaugural ₹100 Off"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief note or conditions for this coupon"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Discount Type *
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as "flat" | "percentage")}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Discount Amount / % *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={formDiscountType === "flat" ? "e.g. 100" : "e.g. 15"}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest font-mono"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indianInk/50 text-xs">
                      {formDiscountType === "flat" ? "₹" : "%"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-deodharForest uppercase tracking-wider">
                    Initial Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-burnishedGold/25 rounded focus:outline-none focus:border-deodharForest"
                  >
                    <option value="active">Active (Usable now)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-burnishedGold/15 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-burnishedGold/25 text-indianInk/70 text-xs font-semibold rounded hover:bg-richCream/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                  className="px-5 py-2 bg-deodharForest text-richCream text-xs font-bold uppercase tracking-wider rounded hover:bg-deodharForest/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {(createCouponMutation.isPending || updateCouponMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingCoupon ? "Save Changes" : "Create Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-indianInk/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-burnishedGold/20 rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-deodharForest">
                Delete Coupon?
              </h3>
            </div>
            <p className="text-xs text-indianInk/70 leading-relaxed">
              Are you sure you want to delete this coupon? Once deleted, it will immediately stop working and customers will no longer be able to use it.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-burnishedGold/25 text-indianInk/70 text-xs font-semibold rounded hover:bg-richCream/60"
              >
                Keep Coupon
              </button>
              <button
                onClick={() => handleDeleteCoupon(deleteConfirmId)}
                disabled={deleteCouponMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteCouponMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
