"use client";

import React, { useState, useRef, useEffect } from "react";
import { Order, OrderItem, ClaimIssueType, ClaimResolution } from "@/types";
import { useCreateClaim } from "@/hooks/use-claims";
import { mediaService } from "@/services/media-service";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Camera,
  Package,
  RotateCcw,
  IndianRupee,
  ShieldCheck,
  Video,
  Sparkles,
  RefreshCw,
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

  // In-app live camera states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraActive(false);
    setCameraError(null);
  };

  // Close camera on modal close
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
  }, [isOpen]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Start in-app live camera
  const startLiveCamera = async (facing: "environment" | "user" = facingMode) => {
    setCameraError(null);
    setIsLiveCameraActive(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WEBRTC_UNSUPPORTED");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      // If WebRTC fails or denied, fallback directly to native device camera capture input
      console.warn("Live camera stream error, using native camera trigger:", err);
      setIsLiveCameraActive(false);
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        setCameraError("Camera access could not be initialized. Please check camera permissions in your browser.");
      }
    }
  };

  // Switch between front/back camera
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    startLiveCamera(nextFacing);
  };

  // Capture snapshot from live video stream
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    if (images.length >= 4) {
      setUploadError("You can capture a maximum of 4 live photos.");
      stopCameraStream();
      return;
    }

    setIsCapturingSnapshot(true);
    setUploadError(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas capture context.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
      );

      if (!blob) throw new Error("Failed to capture image snapshot.");

      const file = new File([blob], `live_proof_${Date.now()}.jpg`, { type: "image/jpeg" });

      setIsUploading(true);
      const uploadedAsset = await mediaService.uploadFile(file, "damage_proof");
      if (uploadedAsset?.public_url) {
        setImages((prev) => [...prev, uploadedAsset.public_url]);
      }

      // If reached 4, close camera automatically; else keep open for next snap
      if (images.length + 1 >= 4) {
        stopCameraStream();
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to save captured photo. Please try again.");
    } finally {
      setIsCapturingSnapshot(false);
      setIsUploading(false);
    }
  };

  // Handle native camera capture input (mobile native rear camera via capture="environment")
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setUploadError("You can capture a maximum of 4 photos.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 15 * 1024 * 1024) {
          throw new Error(`Photo ${file.name} is too large. Max size is 15MB.`);
        }
        const uploadedAsset = await mediaService.uploadFile(file, "damage_proof");
        if (uploadedAsset?.public_url) {
          newUrls.push(uploadedAsset.public_url);
        }
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload live photo. Please try again.");
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
      setFormError("Please capture at least 1 live camera photo of the damaged product.");
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

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-burnishedGold/20 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-deodharForest text-white px-6 py-4 flex items-center justify-between border-b border-burnishedGold/20">
          <div>
            <h3 className="font-serif text-lg font-bold text-richCream flex items-center gap-2">
              <Camera size={18} className="text-gheeGold" />
              <span>Report Damaged Product</span>
            </h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">
              Order #{order.invoice_number || String(order._id || order.id).slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
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
                  Thank you for submitting live camera verification photos. Our customer support team will inspect the proof and process your replacement or refund within 24 hours.
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

              {/* 1. Item Selector */}
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

              {/* 3. REAL-TIME CAMERA CAPTURE SECTION (STRICT LIVE CAMERA ONLY) */}
              <div className="space-y-3 bg-[#FFFDF0] border border-burnishedGold/30 p-4 rounded-lg">
                <div className="flex items-center justify-between border-b border-burnishedGold/15 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-deodharForest font-sans">
                      Real-Time Live Camera Capture
                    </span>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-deodharForest">
                    {images.length}/4 Photos
                  </span>
                </div>

                <div className="flex items-start gap-2 text-[11px] font-sans text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Camera Verification Only:</strong> To prevent fraudulent claims, gallery file uploads are disabled. Please snap fresh photos of the damaged product and box right now.
                  </span>
                </div>

                {/* Captured Photos Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5 pt-1">
                    {images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-[4px] border border-emerald-600/40 overflow-hidden bg-black/5 group shadow-sm"
                      >
                        <img src={url} alt={`Live Capture ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 text-emerald-400 font-mono text-[9px] rounded font-bold">
                          Live #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors"
                          title="Remove & retake"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Primary Camera Action Button */}
                {images.length < 4 && (
                  <div className="pt-1">
                    {/* Hidden native camera input configured with capture="environment" */}
                    <input
                      ref={nativeCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleNativeCameraCapture}
                      className="hidden"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Button 1: In-App Live Camera Viewfinder */}
                      <button
                        type="button"
                        onClick={() => startLiveCamera("environment")}
                        disabled={isUploading}
                        className="py-3 px-4 bg-deodharForest hover:bg-deodharForest/95 text-white rounded-[4px] font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Video size={16} className="text-gheeGold" />
                        <span>Open Live Viewfinder</span>
                      </button>

                      {/* Button 2: Direct Phone Camera App */}
                      <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        disabled={isUploading}
                        className="py-3 px-4 bg-white border-2 border-deodharForest hover:bg-deodharForest/5 text-deodharForest rounded-[4px] font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Camera size={16} />
                        <span>Launch Phone Camera</span>
                      </button>
                    </div>

                    {isUploading && (
                      <div className="flex items-center justify-center gap-2 text-xs text-deodharForest font-sans pt-2">
                        <Loader2 className="w-4 h-4 animate-spin text-burnishedGold" />
                        <span>Uploading live captured photo...</span>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <p className="text-[11px] text-destructive font-sans font-medium">{uploadError}</p>
                )}
                {cameraError && (
                  <p className="text-[11px] text-destructive font-sans font-medium">{cameraError}</p>
                )}
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
                      <div className="text-[9px] font-normal text-indianInk/60">Send fresh piece</div>
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
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  disabled={isPending || isUploading}
                  className="px-4 py-2.5 border border-indianInk/20 text-indianInk hover:bg-indianInk/5 rounded-[4px] font-sans text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading || images.length === 0}
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

      {/* IN-APP LIVE CAMERA VIEWFINDER MODAL */}
      {isLiveCameraActive && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#111] rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col">
            {/* Camera Viewfinder Header */}
            <div className="p-4 bg-black/60 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="font-sans text-xs font-bold uppercase tracking-wider">
                  Live Camera Viewfinder
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Switch front/back camera"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Grid Overlay */}
              <div className="absolute inset-4 border border-white/25 rounded-lg pointer-events-none flex flex-col justify-between">
                <div className="flex justify-between p-2">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-gheeGold" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-gheeGold" />
                </div>
                <div className="text-center text-[10px] text-white/80 font-mono tracking-wider bg-black/40 py-1 px-2 mx-auto rounded">
                  Align damaged product inside box
                </div>
                <div className="flex justify-between p-2">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-gheeGold" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-gheeGold" />
                </div>
              </div>

              {isCapturingSnapshot && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-deodharForest font-bold text-sm">
                  <Loader2 className="w-6 h-6 animate-spin mr-2 text-deodharForest" />
                  Processing photo...
                </div>
              )}
            </div>

            {/* Shutter Controls */}
            <div className="p-5 bg-black flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={isCapturingSnapshot || isUploading}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl bg-white/20"
                title="Click to take snapshot"
              >
                <div className="w-11 h-11 rounded-full bg-white hover:bg-gheeGold transition-colors shadow-md" />
              </button>
              <span className="text-[11px] font-sans text-white/70">
                Tap to snap photo ({images.length}/4 captured)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDamageModal;
