"use client";

import React, { useState } from "react";
import { Order, OrderItem, ClaimIssueType, ClaimResolution } from "@/types";
import { useCreateClaim } from "@/hooks/use-claims";
import { mediaService } from "@/services/media-service";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Camera,
  Package,
  RotateCcw,
  IndianRupee,
} from "lucide-react";

interface ReportDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  initialItem?: any;
}

export const ReportDamageModal: React.FC<ReportDamageModalProps> = ({
  isOpen,
  onClose,
  order,
  initialItem,
}) => {
  const createClaimMutation = useCreateClaim();

  const items = order?.items || [];
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(() => {
    if (initialItem && items.length > 0) {
      const idx = items.findIndex((i: any) => (i.item_id || i.product_id) === (initialItem.item_id || initialItem.product_id));
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const selectedItem = items[selectedItemIndex] || items[0] || null;

  const [issueType, setIssueType] = useState<ClaimIssueType>("broken_jar");
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [preferredResolution, setPreferredResolution] = useState<ClaimResolution>("replacement");
  const [contactPhone, setContactPhone] = useState(order?.shipping_address_snapshot?.phone || "");

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);

  if (!isOpen || !order) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setUploadError("You can upload a maximum of 4 photos.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Max size is 8MB.`);
        }
        const uploadedAsset = await mediaService.uploadFile(file, "damage_proof");
        if (uploadedAsset?.public_url) {
          newUrls.push(uploadedAsset.public_url);
        }
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload one or more photos. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedItem) {
      setFormError("Please select the product that was damaged.");
      return;
    }

    if (!description.trim()) {
      setFormError("Please describe the issue or damage.");
      return;
    }

    if (images.length === 0) {
      setFormError("Please upload at least 1 photo showing the damage or issue.");
      return;
    }

    const productName = selectedItem.product_name || selectedItem.product_summary?.name || "Bharath Delight Product";
    const variantTitle = selectedItem.variant_title || selectedItem.product_summary?.variant_title || "Standard";

    createClaimMutation.mutate(
      {
        order_id: String(order._id || order.id),
        product_id: selectedItem.product_id || null,
        product_name: productName,
        variant_title: variantTitle,
        quantity: Number(quantity) || 1,
        issue_type: issueType,
        description: description.trim(),
        images,
        preferred_resolution: preferredResolution,
        contact_phone: contactPhone.trim(),
      },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            setSubmittedClaim(res.data);
          } else {
            setFormError(res.message || "Unable to submit claim. Please try again.");
          }
        },
        onError: (err: any) => {
          setFormError(err.response?.data?.message || err.message || "Failed to submit damage report.");
        },
      }
    );
  };

  const isPending = createClaimMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-burnishedGold/20 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-deodharForest text-white px-6 py-4 flex items-center justify-between border-b border-burnishedGold/20">
          <div>
            <h3 className="font-serif text-lg font-bold text-richCream flex items-center gap-2">
              <span>Report Damaged Product</span>
            </h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">
              Order #{order.invoice_number || String(order._id || order.id).slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submittedClaim ? (
            /* Success View */
            <div className="flex flex-col items-center text-center py-6 space-y-4 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-serif text-2xl font-bold text-deodharForest">
                  Damage Report Submitted!
                </h4>
                <div className="inline-block px-3 py-1 bg-burnishedGold/15 text-deodharForest rounded-full font-mono text-xs font-bold mt-1">
                  Claim ID: {submittedClaim.claim_id}
                </div>
                <p className="text-sm font-sans text-indianInk/80 max-w-md mx-auto pt-2 leading-relaxed">
                  We apologize for the inconvenience. Our customer care team has received your report with proof photos and will inspect it promptly.
                </p>
              </div>

              <div className="w-full bg-[#FFFDF0] border border-burnishedGold/30 p-4 rounded text-left text-xs font-sans text-indianInk/80 space-y-1.5 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-deodharForest">Product:</span>
                  <span>{submittedClaim.product_name} ({submittedClaim.variant_title})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-deodharForest">Preferred Action:</span>
                  <span className="uppercase font-bold text-emerald-800">{submittedClaim.preferred_resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-deodharForest">Status:</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold uppercase text-[10px]">
                    Pending Review
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-4 py-3 bg-deodharForest text-white hover:bg-deodharForest/90 transition-colors rounded-[4px] font-sans text-xs font-semibold uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-destructive-foreground border border-destructive/20 text-destructive text-xs font-sans rounded-[4px] flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Item Selector (if multiple items) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                  Select Damaged Product
                </label>
                {items.length > 1 ? (
                  <select
                    value={selectedItemIndex}
                    onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
                  >
                    {items.map((item: any, idx: number) => {
                      const name = item.product_name || item.product_summary?.name || `Item ${idx + 1}`;
                      const variant = item.variant_title || item.product_summary?.variant_title || "";
                      return (
                        <option key={idx} value={idx}>
                          {name} {variant ? `(${variant})` : ""} — Qty: {item.quantity || 1}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-2.5 bg-richCream/60 border border-burnishedGold/20 rounded-[4px] text-xs font-sans font-semibold text-deodharForest flex items-center gap-2">
                    <Package size={16} className="text-burnishedGold" />
                    <span>
                      {selectedItem?.product_name || selectedItem?.product_summary?.name || "Ordered Product"}
                      {selectedItem?.variant_title ? ` (${selectedItem.variant_title})` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Issue Type & Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                    Issue Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as ClaimIssueType)}
                    className="w-full px-3 py-2.5 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
                  >
                    <option value="broken_jar">🫙 Bottle / Jar Broken</option>
                    <option value="leaked">💧 Ghee / Oil Leaked</option>
                    <option value="seal_tampered">❌ Seal Broken / Tampered</option>
                    <option value="package_damaged">📦 Outer Package Crushed</option>
                    <option value="wrong_item">❓ Wrong Item Received</option>
                    <option value="quality_issue">⚠️ Quality / Smell Concern</option>
                    <option value="other">📝 Other Issue</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                    Damaged Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItem?.quantity || 10}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
                  />
                </div>
              </div>

              {/* 3. Photo Upload Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans">
                    Proof Photos (Max 4) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-indianInk/50 font-sans">
                    {images.length}/4 uploaded
                  </span>
                </div>

                {/* Upload Thumbnails */}
                <div className="grid grid-cols-4 gap-2.5">
                  {images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-[4px] border border-burnishedGold/30 overflow-hidden bg-richCream/40 group shadow-sm"
                    >
                      <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {images.length < 4 && (
                    <label className={`relative aspect-square rounded-[4px] border-2 border-dashed border-burnishedGold/40 hover:border-burnishedGold flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-richCream/20 hover:bg-richCream/50 transition-colors ${
                      isUploading ? "pointer-events-none opacity-50" : ""
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-burnishedGold animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-burnishedGold mb-1" />
                          <span className="text-[9px] font-sans font-semibold text-deodharForest uppercase tracking-wider">
                            Add Photo
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[11px] text-destructive font-sans">{uploadError}</p>
                )}
                <p className="text-[10px] text-indianInk/60 font-sans">
                  Tip: Upload photos showing the damaged product, the packaging box, and the batch code label.
                </p>
              </div>

              {/* 4. Preferred Resolution */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                  Preferred Resolution
                </label>
                <div className="grid grid-cols-2 gap-3 font-sans">
                  <label className={`flex items-center gap-2 p-3 rounded-[4px] border cursor-pointer transition-all ${
                    preferredResolution === "replacement"
                      ? "border-deodharForest bg-deodharForest/5 text-deodharForest font-bold"
                      : "border-indianInk/20 hover:border-burnishedGold/50 text-indianInk/80"
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      value="replacement"
                      checked={preferredResolution === "replacement"}
                      onChange={() => setPreferredResolution("replacement")}
                      className="hidden"
                    />
                    <RotateCcw size={16} className={preferredResolution === "replacement" ? "text-deodharForest" : "text-indianInk/50"} />
                    <div className="text-xs">
                      <div>Replacement</div>
                      <div className="text-[9px] font-normal text-indianInk/60">Send fresh product</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-[4px] border cursor-pointer transition-all ${
                    preferredResolution === "refund"
                      ? "border-deodharForest bg-deodharForest/5 text-deodharForest font-bold"
                      : "border-indianInk/20 hover:border-burnishedGold/50 text-indianInk/80"
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      value="refund"
                      checked={preferredResolution === "refund"}
                      onChange={() => setPreferredResolution("refund")}
                      className="hidden"
                    />
                    <IndianRupee size={16} className={preferredResolution === "refund" ? "text-deodharForest" : "text-indianInk/50"} />
                    <div className="text-xs">
                      <div>Refund</div>
                      <div className="text-[9px] font-normal text-indianInk/60">Money back</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2.5 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none"
                />
              </div>

              {/* 6. Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-indianInk/80 font-sans block">
                  Explain the Damage / Issue <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Received package today, but the ghee jar lid was broken and ghee leaked inside the bubble wrap..."
                  className="w-full px-3 py-2 bg-white border border-indianInk/20 rounded-[4px] font-sans text-xs text-indianInk focus:border-burnishedGold outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending || isUploading}
                  className="px-4 py-2.5 border border-indianInk/20 text-indianInk hover:bg-indianInk/5 rounded-[4px] font-sans text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="px-6 py-2.5 bg-deodharForest text-white hover:bg-deodharForest/90 transition-colors rounded-[4px] font-sans text-xs font-semibold tracking-wider uppercase disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Claim...</span>
                    </>
                  ) : (
                    <span>Submit Damage Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDamageModal;

