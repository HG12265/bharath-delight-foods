"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminOffers,
  useCreateOffer,
  useUpdateOffer,
  useUpdateOfferStatus,
  useDeleteOffer,
} from "@/hooks/use-offers";
import { useAdminProducts } from "@/hooks/use-products";
import {
  BadgePercent,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Play,
  Pause,
  Ban,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Layers,
  Sparkles,
  Info,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Offer, OfferItem, Product, ProductVariant } from "@/types";

interface SelectedVariantConfig {
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_id: string;
  variant_sku: string;
  variant_title: string;
  original_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  offer_price: number;
}

export default function AdminOffersPage() {
  // Query offers
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: offersRes, isPending: isOffersPending, refetch } = useAdminOffers({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  // Query products for offer creation
  const { data: productsRes, isPending: isProductsPending } = useAdminProducts();
  const allProducts: Product[] = useMemo(() => productsRes?.data || [], [productsRes]);

  // Mutations
  const createOfferMutation = useCreateOffer();
  const updateOfferMutation = useUpdateOffer();
  const updateStatusMutation = useUpdateOfferStatus();
  const deleteOfferMutation = useDeleteOffer();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formBadgeText, setFormBadgeText] = useState("SPECIAL OFFER");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "draft">("active");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariantConfig>>({});
  const [formError, setFormError] = useState("");

  // Product picker in modal
  const [pickerSearch, setPickerSearch] = useState("");
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Bulk discount tool in modal
  const [bulkDiscountType, setBulkDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [bulkDiscountValue, setBulkDiscountValue] = useState<number>(10);

  const offers = useMemo(() => offersRes?.data?.offers || [], [offersRes]);
  const stats = useMemo(
    () =>
      offersRes?.data?.stats || {
        total: 0,
        active: 0,
        disabled: 0,
        draft: 0,
        cancelled: 0,
      },
    [offersRes],
  );

  // Filter products in picker
  const filteredProducts = useMemo(() => {
    if (!pickerSearch.trim()) return allProducts;
    const q = pickerSearch.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.title.toLowerCase().includes(q) ||
            v.volume_weight.toLowerCase().includes(q),
        ),
    );
  }, [allProducts, pickerSearch]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setFormTitle("");
    setFormBadgeText("SPECIAL OFFER");
    setFormDescription("");
    setFormStatus("active");
    setSelectedVariants({});
    setFormError("");
    setPickerSearch("");
    setExpandedProductIds(new Set());
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setFormTitle(offer.title);
    setFormBadgeText(offer.badge_text || "SPECIAL OFFER");
    setFormDescription(offer.description || "");
    setFormStatus(offer.status === "active" ? "active" : "draft");

    const mapped: Record<string, SelectedVariantConfig> = {};
    for (const item of offer.items || []) {
      mapped[item.variant_id] = {
        product_id: item.product_id,
        product_name: item.product_name,
        product_slug: item.product_slug || "",
        variant_id: item.variant_id,
        variant_sku: item.variant_sku,
        variant_title: item.variant_title,
        original_price: item.original_price,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        offer_price: item.offer_price,
      };
    }
    setSelectedVariants(mapped);
    setFormError("");
    setPickerSearch("");
    setExpandedProductIds(new Set(offer.items?.map((i) => i.product_id) || []));
    setIsModalOpen(true);
  };

  // Calculate offer price helper
  const calculateOfferPrice = (
    origPrice: number,
    type: "percentage" | "fixed",
    val: number,
  ) => {
    if (isNaN(val) || val <= 0) return origPrice;
    let finalPrice = origPrice;
    if (type === "percentage") {
      const discount = (origPrice * val) / 100;
      finalPrice = Math.max(1, origPrice - discount);
    } else {
      finalPrice = Math.max(1, origPrice - val);
    }
    return Math.round(finalPrice * 100) / 100;
  };

  // Toggle single variant selection
  const handleToggleVariant = (product: Product, variant: ProductVariant) => {
    setSelectedVariants((prev) => {
      const next = { ...prev };
      if (next[variant.variant_id]) {
        delete next[variant.variant_id];
      } else {
        const origPrice = Number(variant.price);
        const discountType = bulkDiscountType;
        const discountValue = bulkDiscountValue;
        const offerPrice = calculateOfferPrice(origPrice, discountType, discountValue);

        next[variant.variant_id] = {
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug,
          variant_id: variant.variant_id,
          variant_sku: variant.sku,
          variant_title: variant.title || variant.volume_weight || "Standard",
          original_price: origPrice,
          discount_type: discountType,
          discount_value: discountValue,
          offer_price: offerPrice,
        };
      }
      return next;
    });
  };

  // Select / Deselect all variants of a product
  const handleToggleAllProductVariants = (product: Product) => {
    const variants = product.variants || [];
    const allSelected = variants.every((v) => selectedVariants[v.variant_id]);

    setSelectedVariants((prev) => {
      const next = { ...prev };
      if (allSelected) {
        variants.forEach((v) => delete next[v.variant_id]);
      } else {
        variants.forEach((v) => {
          const origPrice = Number(v.price);
          const discountType = bulkDiscountType;
          const discountValue = bulkDiscountValue;
          const offerPrice = calculateOfferPrice(origPrice, discountType, discountValue);

          next[v.variant_id] = {
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            variant_id: v.variant_id,
            variant_sku: v.sku,
            variant_title: v.title || v.volume_weight || "Standard",
            original_price: origPrice,
            discount_type: discountType,
            discount_value: discountValue,
            offer_price: offerPrice,
          };
        });
      }
      return next;
    });
  };

  // Update discount config for a specific variant
  const handleUpdateVariantDiscount = (
    variantId: string,
    field: "discount_type" | "discount_value",
    val: any,
  ) => {
    setSelectedVariants((prev) => {
      const current = prev[variantId];
      if (!current) return prev;

      const newType = field === "discount_type" ? val : current.discount_type;
      const newVal = field === "discount_value" ? Number(val) : current.discount_value;
      const newOfferPrice = calculateOfferPrice(current.original_price, newType, newVal);

      return {
        ...prev,
        [variantId]: {
          ...current,
          discount_type: newType,
          discount_value: newVal,
          offer_price: newOfferPrice,
        },
      };
    });
  };

  // Apply bulk discount to all currently selected variants
  const handleApplyBulkDiscount = () => {
    setSelectedVariants((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((vId) => {
        const item = next[vId];
        const newOfferPrice = calculateOfferPrice(
          item.original_price,
          bulkDiscountType,
          bulkDiscountValue,
        );
        next[vId] = {
          ...item,
          discount_type: bulkDiscountType,
          discount_value: bulkDiscountValue,
          offer_price: newOfferPrice,
        };
      });
      return next;
    });
  };

  // Toggle product expansion in picker
  const toggleProductExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // Submit Offer (Create or Edit)
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Offer title is required.");
      return;
    }

    const itemsList = Object.values(selectedVariants);
    if (itemsList.length === 0) {
      setFormError("Please select at least one product variant to apply the offer.");
      return;
    }

    // Verify all discount values
    for (const item of itemsList) {
      if (item.discount_value <= 0) {
        setFormError(`Discount value must be greater than zero for "${item.product_name} - ${item.variant_title}".`);
        return;
      }
      if (item.discount_type === "percentage" && item.discount_value >= 100) {
        setFormError(`Percentage discount must be less than 100% for "${item.product_name} - ${item.variant_title}".`);
        return;
      }
      if (item.discount_type === "fixed" && item.discount_value >= item.original_price) {
        setFormError(
          `Fixed discount (₹${item.discount_value}) cannot exceed or equal original price (₹${item.original_price}) for "${item.product_name} - ${item.variant_title}".`,
        );
        return;
      }
    }

    const payload = {
      title: formTitle.trim(),
      badge_text: formBadgeText.trim() || "SPECIAL OFFER",
      description: formDescription.trim(),
      status: formStatus,
      items: itemsList.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_slug: i.product_slug,
        variant_id: i.variant_id,
        variant_sku: i.variant_sku,
        variant_title: i.variant_title,
        discount_type: i.discount_type,
        discount_value: i.discount_value,
      })),
    };

    try {
      if (editingOfferId) {
        await updateOfferMutation.mutateAsync({
          id: editingOfferId,
          payload,
        });
      } else {
        await createOfferMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to save offer. Please check all fields.");
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (offer: Offer) => {
    const nextStatus = offer.status === "active" ? "disabled" : "active";
    const label = nextStatus === "active" ? "Publish / Activate" : "Pause / Disable";
    if (!confirm(`Are you sure you want to ${label} this offer ("${offer.title}")?`)) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: offer.id,
        status: nextStatus,
      });
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update offer status.");
    }
  };

  // Quick Cancel
  const handleCancelOffer = async (offer: Offer) => {
    if (!confirm(`Cancel offer "${offer.title}"? The offer will stop applying immediately across the store.`)) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: offer.id,
        status: "cancelled",
      });
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel offer.");
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (offer: Offer) => {
    if (!confirm(`Permanently remove offer "${offer.title}"? This cannot be undone.`)) return;
    try {
      await deleteOfferMutation.mutateAsync(offer.id);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete offer.");
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        );
      case "disabled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <Pause className="w-2.5 h-2.5 text-amber-600" />
            Paused
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
            <Ban className="w-2.5 h-2.5 text-red-600" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C49A45]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1E352F] flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-[#C89B3C]" />
            Product Offer Management
          </h1>
          <p className="font-sans text-xs text-indianInk/60 mt-1">
            Total Admin Control: Create, publish, edit, pause, and cancel variant-level product offers. Offers remain active until manually changed.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream font-sans text-xs font-bold uppercase tracking-wider rounded transition shadow-md"
        >
          <Plus className="w-4 h-4 text-[#C89B3C]" />
          Create New Offer
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-[#C49A45]/20 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 block">Total Offers</span>
          <span className="font-serif text-xl font-bold text-[#1E352F] mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white border border-emerald-300/50 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/70 block">Active &amp; Live</span>
          <span className="font-serif text-xl font-bold text-emerald-700 mt-1 block">{stats.active}</span>
        </div>
        <div className="bg-white border border-amber-300/50 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block">Paused / Disabled</span>
          <span className="font-serif text-xl font-bold text-amber-700 mt-1 block">{stats.disabled}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Drafts</span>
          <span className="font-serif text-xl font-bold text-slate-700 mt-1 block">{stats.draft}</span>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">Cancelled</span>
          <span className="font-serif text-xl font-bold text-red-700 mt-1 block">{stats.cancelled}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#C49A45]/15 rounded-lg p-3 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between font-sans text-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "disabled", label: "Paused" },
            { id: "draft", label: "Drafts" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === tab.id
                  ? "bg-[#0F3D2E] text-white shadow-xs font-bold"
                  : "bg-[#FAF9F6] text-indianInk/70 hover:bg-[#FAF9F6]/80 hover:text-indianInk border border-[#C49A45]/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indianInk/40" />
          <input
            type="text"
            placeholder="Search offers or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-indianInk/20 rounded focus:border-[#C49A45] focus:outline-none bg-[#FAF9F6]/30 text-indianInk"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-indianInk/40 hover:text-indianInk"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Offers List */}
      {isOffersPending ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-[#C89B3C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-indianInk/60 font-sans uppercase font-bold tracking-wider">
            Loading Offers...
          </p>
        </div>
      ) : offers.length > 0 ? (
        <div className="space-y-3 font-sans">
          {offers.map((offer) => {
            const isExpanded = expandedOfferId === offer.id;
            const itemsCount = offer.items?.length || 0;
            const uniqueProductNames = [
              ...new Set(offer.items?.map((i) => i.product_name) || []),
            ];

            return (
              <div
                key={offer.id}
                className="bg-white border border-[#C49A45]/20 rounded-lg shadow-xs hover:border-[#C89B3C] transition overflow-hidden"
              >
                {/* Main Offer Card Header */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-base font-bold text-[#0F3D2E]">
                        {offer.title}
                      </span>
                      {offer.badge_text && (
                        <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#C89B3C] text-[#0F3D2E] text-[10px] font-bold uppercase tracking-wider rounded">
                          🏷️ {offer.badge_text}
                        </span>
                      )}
                      {renderStatusBadge(offer.status)}
                    </div>

                    {offer.description && (
                      <p className="text-xs text-indianInk/70 leading-relaxed max-w-2xl">
                        {offer.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-indianInk/60 pt-1">
                      <span>
                        🛍️ <strong>{uniqueProductNames.join(", ") || "No products"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        📦 <strong>{itemsCount} {itemsCount === 1 ? "variant on offer" : "variants on offer"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Created: {new Date(offer.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-indianInk/5">
                    {/* 1-Click Status Toggle */}
                    {offer.status !== "cancelled" && (
                      <button
                        onClick={() => handleToggleStatus(offer)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition ${
                          offer.status === "active"
                            ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                            : "bg-[#0F3D2E] text-white hover:bg-[#15543F]"
                        }`}
                        title={offer.status === "active" ? "Pause Offer" : "Publish Offer"}
                      >
                        {offer.status === "active" ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* View/Hide Variant Details Toggle */}
                    <button
                      onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-indianInk/15 hover:bg-[#FAF9F6] text-indianInk rounded text-xs font-semibold transition"
                    >
                      <span>{isExpanded ? "Hide Variants" : "View Variants"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(offer)}
                      className="p-1.5 text-deodharForest hover:bg-[#FAF9F6] border border-[#C49A45]/30 rounded transition"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Cancel Offer Button */}
                    {offer.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelOffer(offer)}
                        className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded transition"
                        title="Cancel Offer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Offer Button */}
                    <button
                      onClick={() => handleDeleteOffer(offer)}
                      className="p-1.5 text-indianInk/40 hover:text-red-700 hover:bg-red-50 border border-indianInk/10 rounded transition"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Variant Breakdown Table */}
                {isExpanded && (
                  <div className="border-t border-[#C49A45]/15 bg-[#FAF9F6]/40 p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 mb-2">
                      Variant-Level Offer Breakdown
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-indianInk/10 text-indianInk/50 text-[10px] font-bold uppercase tracking-widest">
                            <th className="py-2 px-3">Product Name</th>
                            <th className="py-2 px-3">Variant / Volume</th>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3">Original MRP</th>
                            <th className="py-2 px-3">Discount</th>
                            <th className="py-2 px-3">Offer Price</th>
                            <th className="py-2 px-3 text-right">Unit Savings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indianInk/5">
                          {offer.items?.map((item, idx) => {
                            const savings = item.original_price - item.offer_price;
                            return (
                              <tr key={idx} className="hover:bg-white/60 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-indianInk">
                                  {item.product_name}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-indianInk">
                                  <span className="px-2 py-0.5 bg-white border border-[#C49A45]/20 rounded text-[11px]">
                                    {item.variant_title}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[10px] text-indianInk/60">
                                  {item.variant_sku}
                                </td>
                                <td className="py-2.5 px-3 line-through text-indianInk/40">
                                  {formatINR(item.original_price)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px]">
                                    {item.discount_type === "percentage"
                                      ? `${item.discount_value}% OFF`
                                      : `₹${item.discount_value} OFF`}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-[#0F3D2E]">
                                  {formatINR(item.offer_price)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                  Save {formatINR(savings)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-[#C49A45]/20 rounded-lg p-12 text-center shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#FAF9F6] border border-[#C49A45]/20 rounded-full flex items-center justify-center mx-auto text-[#0F3D2E]">
            <BadgePercent className="w-8 h-8 text-[#C89B3C]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1E352F]">No Offers Found</h3>
          <p className="font-sans text-xs text-indianInk/60 max-w-sm mx-auto leading-relaxed">
            {statusFilter !== "all" || searchQuery
              ? "No offers match your current filter. Try clearing your search or status filter."
              : "No product offers created yet. Click Create New Offer to launch promotional deals."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-[#0F3D2E] text-white text-xs font-bold uppercase tracking-wider rounded shadow-md hover:bg-[#15543F]"
          >
            Create First Offer
          </button>
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-indianInk/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white border border-[#C49A45]/20 shadow-2xl rounded-lg max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="bg-[#1E352F] text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-[#C89B3C]" />
                  <h3 className="font-serif text-lg font-bold">
                    {editingOfferId ? "Edit Product Offer" : "Create Fully Admin-Controlled Offer"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitOffer} className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-xs text-indianInk">
                {/* 1. Basic Information */}
                <div className="space-y-4 bg-[#FAF9F6]/50 border border-[#C49A45]/15 p-4 rounded-lg">
                  <h4 className="font-serif text-sm font-bold text-[#0F3D2E] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#C89B3C]" /> 1. Offer Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block mb-1">
                        Offer Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Traditional Cow Ghee Festival Sale"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full text-xs border border-indianInk/20 rounded p-2 focus:border-[#C49A45] focus:outline-none bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block mb-1">
                        Badge Text (Appears on Product &amp; Cart)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SPECIAL OFFER, 15% OFF, FESTIVE DEAL"
                        value={formBadgeText}
                        onChange={(e) => setFormBadgeText(e.target.value)}
                        className="w-full text-xs border border-indianInk/20 rounded p-2 focus:border-[#C49A45] focus:outline-none bg-white font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block mb-1">
                        Description / Terms (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Save up to ₹150 on authentic bilona cow ghee variants."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full text-xs border border-indianInk/20 rounded p-2 focus:border-[#C49A45] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60 block mb-1">
                        Initial Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as "active" | "draft")}
                        className="w-full text-xs border border-indianInk/20 rounded p-2 focus:border-[#C49A45] focus:outline-none bg-white font-semibold"
                      >
                        <option value="active">Publish Immediately (Active in Store)</option>
                        <option value="draft">Save as Draft (Not Live)</option>
                      </select>
                      <p className="text-[10px] text-indianInk/50 mt-1">
                        💡 Once active, it remains live until you manually pause or cancel it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Variant-Level Selection & Discount Controls */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C49A45]/15 pb-2">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#0F3D2E] flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#C89B3C]" /> 2. Select Products &amp; Individual Variants
                      </h4>
                      <p className="text-[11px] text-indianInk/60">
                        Choose which variants of each product receive the offer. You can configure individual discounts for each variant independently.
                      </p>
                    </div>

                    {/* Quick Bulk Tool */}
                    <div className="flex items-center gap-2 bg-[#FAF9F6] border border-[#C49A45]/20 p-2 rounded-lg">
                      <span className="text-[10px] font-bold uppercase text-indianInk/60 whitespace-nowrap">
                        Quick Tool:
                      </span>
                      <select
                        value={bulkDiscountType}
                        onChange={(e) => setBulkDiscountType(e.target.value as "percentage" | "fixed")}
                        className="text-xs border border-indianInk/20 rounded px-2 py-1 bg-white font-medium"
                      >
                        <option value="percentage">% Off</option>
                        <option value="fixed">₹ Flat Off</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={bulkDiscountValue}
                        onChange={(e) => setBulkDiscountValue(Number(e.target.value))}
                        className="w-16 text-xs border border-indianInk/20 rounded px-2 py-1 bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkDiscount}
                        disabled={Object.keys(selectedVariants).length === 0}
                        className="px-2.5 py-1 bg-[#0F3D2E] text-white rounded text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-[#15543F]"
                        title="Apply this discount to all currently selected variants"
                      >
                        Apply to Selected
                      </button>
                    </div>
                  </div>

                  {/* Product Search inside Modal */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indianInk/40" />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-indianInk/20 rounded-md bg-[#FAF9F6]/30 focus:border-[#C49A45] focus:outline-none text-indianInk"
                    />
                  </div>

                  {/* Products & Variants Tree */}
                  <div className="border border-indianInk/15 rounded-lg max-h-64 overflow-y-auto divide-y divide-indianInk/10 bg-[#FAF9F6]/20">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        const variants = product.variants || [];
                        const isExpanded = expandedProductIds.has(product.id);
                        const selectedCount = variants.filter((v) => selectedVariants[v.variant_id]).length;
                        const isAllSelected = variants.length > 0 && selectedCount === variants.length;

                        return (
                          <div key={product.id} className="p-3 bg-white">
                            {/* Product Row */}
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => toggleProductExpand(product.id)}
                                className="flex items-center gap-2.5 cursor-pointer flex-1"
                              >
                                <button type="button" className="text-indianInk/50">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <div>
                                  <span className="font-serif font-bold text-xs text-[#0F3D2E] block">
                                    {product.name}
                                  </span>
                                  <span className="text-[10px] text-indianInk/50 block">
                                    {variants.length} {variants.length === 1 ? "variant" : "variants"} • Base MRP: {formatINR(product.min_price || 0)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    {selectedCount}/{variants.length} selected
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAllProductVariants(product)}
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition border ${
                                    isAllSelected
                                      ? "bg-[#0F3D2E] text-white border-[#0F3D2E]"
                                      : "bg-white text-indianInk border-indianInk/20 hover:border-[#C49A45]"
                                  }`}
                                >
                                  {isAllSelected ? "Deselect All" : "Select All Variants"}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Variants List */}
                            {isExpanded && (
                              <div className="mt-2.5 pt-2 border-t border-indianInk/5 pl-6 space-y-2">
                                {variants.map((v) => {
                                  const isSelected = !!selectedVariants[v.variant_id];
                                  return (
                                    <div
                                      key={v.variant_id}
                                      onClick={() => handleToggleVariant(product, v)}
                                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition border ${
                                        isSelected
                                          ? "bg-[#FFFDF0] border-[#C89B3C]"
                                          : "bg-[#FAF9F6]/40 border-transparent hover:border-indianInk/20"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                            isSelected
                                              ? "bg-[#0F3D2E] border-[#0F3D2E] text-white"
                                              : "border-indianInk/30 bg-white"
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-indianInk text-xs">
                                            {v.title || v.volume_weight || "Standard"}
                                          </span>
                                          <span className="font-mono text-[10px] text-indianInk/50 ml-2">
                                            SKU: {v.sku}
                                          </span>
                                        </div>
                                      </div>

                                      <span className="font-bold text-xs text-[#0F3D2E]">
                                        MRP: {formatINR(v.price)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-4 text-center text-indianInk/50 italic text-xs">
                        No products found matching &quot;{pickerSearch}&quot;.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Selected Variants Pricing Configuration Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-[#0F3D2E] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C89B3C]" /> 3. Configured Offer Prices ({Object.keys(selectedVariants).length} Variants)
                    </h4>
                    {Object.keys(selectedVariants).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedVariants({})}
                        className="text-[10px] font-bold uppercase text-red-600 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {Object.keys(selectedVariants).length > 0 ? (
                    <div className="border border-[#C89B3C]/30 rounded-lg overflow-x-auto bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#FAF9F6] border-b border-[#C89B3C]/20 text-indianInk/60 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Product &amp; Variant</th>
                            <th className="py-2.5 px-3">Original MRP</th>
                            <th className="py-2.5 px-3 w-44">Discount Type &amp; Value</th>
                            <th className="py-2.5 px-3">Calculated Offer Price</th>
                            <th className="py-2.5 px-3">Savings</th>
                            <th className="py-2.5 px-3 text-right">Remove</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indianInk/5">
                          {Object.values(selectedVariants).map((item) => {
                            const savings = item.original_price - item.offer_price;
                            return (
                              <tr key={item.variant_id} className="hover:bg-[#FAF9F6]/40 transition">
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-[#0F3D2E] block">
                                    {item.product_name}
                                  </span>
                                  <span className="text-[10px] text-indianInk/60 block">
                                    {item.variant_title} • {item.variant_sku}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 font-semibold text-indianInk/70">
                                  {formatINR(item.original_price)}
                                </td>

                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={item.discount_type}
                                      onChange={(e) =>
                                        handleUpdateVariantDiscount(
                                          item.variant_id,
                                          "discount_type",
                                          e.target.value,
                                        )
                                      }
                                      className="text-xs border border-indianInk/20 rounded px-1.5 py-1 bg-white font-medium"
                                    >
                                      <option value="percentage">% Off</option>
                                      <option value="fixed">₹ Flat Off</option>
                                    </select>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.discount_value}
                                      onChange={(e) =>
                                        handleUpdateVariantDiscount(
                                          item.variant_id,
                                          "discount_value",
                                          e.target.value,
                                        )
                                      }
                                      className="w-16 text-xs border border-indianInk/20 rounded px-2 py-1 bg-white font-bold"
                                    />
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 font-bold text-sm text-[#0F3D2E]">
                                  {formatINR(item.offer_price)}
                                </td>

                                <td className="py-2.5 px-3 font-semibold text-emerald-700">
                                  Save {formatINR(savings)}
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariants((prev) => {
                                        const next = { ...prev };
                                        delete next[item.variant_id];
                                        return next;
                                      });
                                    }}
                                    className="p-1 text-indianInk/40 hover:text-red-600 rounded transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-indianInk/20 rounded-lg bg-[#FAF9F6]/50 space-y-1">
                      <p className="text-xs font-bold text-indianInk/60">No variants selected yet.</p>
                      <p className="text-[11px] text-indianInk/40">
                        Expand products in Step 2 above and check the variants you wish to include in this offer.
                      </p>
                    </div>
                  )}
                </div>

                {formError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 bg-red-50 p-2.5 rounded border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </p>
                )}

                {/* Modal Footer */}
                <div className="flex gap-3 pt-3 border-t border-indianInk/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider border border-indianInk/20 hover:bg-[#FAF9F6] text-indianInk rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createOfferMutation.isPending ||
                      updateOfferMutation.isPending ||
                      Object.keys(selectedVariants).length === 0
                    }
                    className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-wider bg-[#0F3D2E] hover:bg-[#15543F] text-richCream rounded transition shadow-md disabled:opacity-50"
                  >
                    {createOfferMutation.isPending || updateOfferMutation.isPending
                      ? "Saving Offer..."
                      : editingOfferId
                      ? "Save Offer Changes"
                      : "Create & Publish Offer"}
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

