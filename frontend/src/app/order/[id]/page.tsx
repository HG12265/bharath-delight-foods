"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useParams } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useOrderDetails } from "@/hooks/use-orders";
import { useInitiateUpiPayment, useSubmitUpiProof } from "@/hooks/use-payments";
import { useClearCart } from "@/hooks/use-cart";
import mediaService from "@/services/media-service";
import orderService from "@/services/order-service";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  UploadCloud,
  FileText,
  Clock,
  ExternalLink,
  Package,
  Truck,
  X
} from "lucide-react";
import { InitiatePaymentResponse } from "@/services/payment-service";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: orderData, isPending: isOrderPending, isError: isOrderError, refetch: refetchOrder } = useOrderDetails(orderId);

  const order = orderData?.data;

  const initiateMutation = useInitiateUpiPayment();
  const submitProofMutation = useSubmitUpiProof();
  const clearCartMutation = useClearCart();

  // Component states
  const [paymentInfo, setPaymentInfo] = useState<InitiatePaymentResponse | null>(null);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success alert state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Invoice Download states
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadInvoiceError, setDownloadInvoiceError] = useState<string | null>(null);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloadingInvoice(true);
    setDownloadInvoiceError(null);
    try {
      const blob = await orderService.getInvoiceBlob(order.id, "download");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${order.invoice_number || order.order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      let errorMessage = "Failed to download invoice. Please try again.";
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) errorMessage = json.message;
        } catch {
          // fallback
        }
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setDownloadInvoiceError(errorMessage);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const hasAttemptedRef = useRef(false);

  // Rejection reason lookup
  const rejectionReason = paymentInfo?.rejection_reason || null;

  // Guard payment initiation: run only once when order is pending_payment and payment info is not loaded
  useEffect(() => {
    if (!order) return;

    const shouldInitiate =
      order.order_status === "pending_payment" &&
      order.payment_status !== "paid" &&
      !paymentInfo &&
      !hasAttemptedRef.current;

    if (shouldInitiate) {
      hasAttemptedRef.current = true;
      initiateMutation.mutate(order.id, {
        onSuccess: (res) => {
          if (res.success && res.data) {
            setPaymentInfo(res.data);
          } else {
            setInitiateError(res.message || "Failed to generate UPI payment details.");
          }
        },
        onError: (err: any) => {
          setInitiateError(
            err.response?.data?.message ||
            err.message ||
            "Failed to connect to payment services."
          );
        }
      });
    }
  }, [order, paymentInfo, initiateMutation]);

  // Handle clipboard copy
  const handleCopyUPI = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Handle screenshot file validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: png, jpg, jpeg, webp
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Invalid image format. Only PNG, JPG, JPEG, and WEBP formats are supported.");
      setSelectedFile(null);
      return;
    }

    // Validate size: max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("File exceeds the maximum size limit of 5MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Handle Screenshot Upload & Proof Submission
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !order) return;

    setIsUploading(true);
    setSubmitError(null);
    setUploadProgressMsg("Requesting secure upload channel...");

    try {
      // Step 1 & 2 & 3: Presign, PUT upload, and Complete registration in media service helper
      setUploadProgressMsg("Uploading proof screenshot to R2 storage...");
      const mediaAsset = await mediaService.uploadFile(selectedFile, "payment_proof");

      setUploadProgressMsg("Registering payment proof on your order...");
      submitProofMutation.mutate(
        {
          orderId: order.id,
          payload: { screenshot_media_id: mediaAsset.id }
        },
        {
          onSuccess: (submitRes) => {
            if (submitRes.success) {
              setUploadProgressMsg("Proof registered successfully!");
              setSelectedFile(null);

              // Update local state status to "proof_submitted"
              if (submitRes.data) {
                setPaymentInfo(prev => prev ? { ...prev, status: submitRes.data.status } : null);
              } else {
                setPaymentInfo(prev => prev ? { ...prev, status: "proof_submitted" } : null);
              }

              // Clear cart so badge resets to 0
              clearCartMutation.mutate(undefined);

              // Show success message
              setShowSuccessBanner(true);

              // Refetch order details to update status display
              refetchOrder();
            } else {
              setSubmitError(submitRes.message || "Failed to submit payment proof details.");
            }
            setIsUploading(false);
          },
          onError: (err: any) => {
            setSubmitError(
              err.response?.data?.message ||
              err.message ||
              "Failed to register proof screenshot with the order."
            );
            setIsUploading(false);
          }
        }
      );
    } catch (error: any) {
      setSubmitError(error.message || "An error occurred during file upload. Please try again.");
      setIsUploading(false);
    }
  };

  // Loading Screen
  if (isOrderPending) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-richCream flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-10 h-10 text-burnishedGold animate-spin" />
          <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
            Retrieving order information...
          </p>
        </div>
      </PublicLayout>
    );
  }

  // Error Screen
  if (isOrderError || !order) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-richCream flex flex-col justify-center items-center text-center gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-warmSaffron" />
          <h2 className="font-serif text-2xl font-bold text-deodharForest">Order Not Found</h2>
          <p className="text-sm text-indianInk/60 max-w-md">
            We couldn't locate the order details you requested. It might not exist or you may not have permission to view it.
          </p>
          <Link
            href="/shop"
            className="px-5 py-2.5 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:bg-deodharForest/95 shadow-sm"
          >
            Shop Ghee
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const isConfirmed = order.order_status === "confirmed" || order.payment_status === "paid";
  const isProofSubmitted = paymentInfo?.status === "proof_submitted";
  const isPendingPayment = order.order_status === "pending_payment" && !isConfirmed && !isProofSubmitted;

  return (
    <PublicLayout>
      <div
        className="min-h-screen text-indianInk py-12 md:py-20 border-b border-burnishedGold/15"
        style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          {/* Back link */}
          <div className="mb-8 animate-fade-up">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Shop
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left/Main Column */}
            <div className="lg:col-span-7 space-y-6 animate-fade-up">

              {/* SUCCESS BANNER */}
              {showSuccessBanner && (
                <div className="bg-[#EAF5EC] border border-[#2E7D32]/30 rounded-lg p-5 shadow-sm flex items-start gap-3.5 relative animate-fade-up">
                  <div className="w-10 h-10 bg-[#2E7D32]/10 rounded-full flex items-center justify-center border border-[#2E7D32]/20 shrink-0 text-[#2E7D32]">
                    <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-grow pr-6">
                    <h4 className="font-serif text-base font-bold text-[#1E352F]">
                      Thank You! Your Order Has Been Placed Successfully!
                    </h4>
                    <p className="text-xs font-sans text-[#1E352F]/80 mt-1 leading-relaxed">
                      We have received your payment details. Our team is carefully preparing your authentic delights, and your package will be delivered to your doorstep soon!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuccessBanner(false)}
                    className="absolute right-2.5 top-2.5 p-1 text-[#1E352F]/60 hover:text-[#1E352F] hover:bg-[#2E7D32]/10 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STATUS CARD */}
              {(isConfirmed || isProofSubmitted) ? (
                <div className="bg-white border-2 border-[#2E7D32]/25 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-up">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2E7D32]/10 rounded-full flex items-center justify-center border border-[#2E7D32]/20 shrink-0 text-[#2E7D32]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-2xl font-bold text-deodharForest">
                          Thank You! Your Order is Placed!
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {order.payment_status === "paid" ? "Confirmed & Paid" : "Order Placed • Preparing"}
                        </span>
                      </div>
                      <p className="text-sm font-sans text-indianInk/75 mt-2 leading-relaxed">
                        Thank you for choosing <span className="font-semibold text-deodharForest">Bharath Delight Foods</span>! We have received your payment details for order <span className="font-bold text-deodharForest">#{order.order_number}</span>. Our team is carefully packaging your authentic delights fresh, and your shipment will be delivered right to your doorstep soon.
                      </p>
                    </div>
                  </div>

                  {/* Delightful delivery highlights / steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold font-sans text-deodharForest uppercase tracking-wider">Payment Recorded</p>
                        <p className="text-[10px] font-sans text-indianInk/60">Screenshot received</p>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold font-sans text-deodharForest uppercase tracking-wider">Fresh Packaging</p>
                        <p className="text-[10px] font-sans text-indianInk/60">Hygienic traditional prep</p>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold font-sans text-deodharForest uppercase tracking-wider">Doorstep Delivery</p>
                        <p className="text-[10px] font-sans text-indianInk/60">Dispatched soon</p>
                      </div>
                    </div>
                  </div>

                  {order.payment_status === "paid" && (
                    <div className="pt-2 border-t border-burnishedGold/10">
                      <button
                        onClick={handleDownloadInvoice}
                        disabled={isDownloadingInvoice}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-deodharForest text-richCream border border-transparent hover:border-burnishedGold hover:shadow-[0_4px_12px_rgba(15,61,46,0.15)] rounded-[4px] font-sans text-xs font-semibold tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                      >
                        {isDownloadingInvoice ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Downloading Invoice...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 text-gheeGold" />
                            <span>Download Invoice</span>
                          </>
                        )}
                      </button>
                      {downloadInvoiceError && (
                        <p className="text-xs text-destructive font-semibold font-sans mt-2">{downloadInvoiceError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-8 shadow-sm space-y-6">

                  {/* Rejection alert */}
                  {rejectionReason && (
                    <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] font-medium flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Previous Payment Proof Rejected</p>
                        <p className="text-xs leading-relaxed opacity-90">
                          Reason given: "{rejectionReason}". Please re-check your transfer transaction details and submit a correct proof screenshot below.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-b border-burnishedGold/10 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-deodharForest">
                      Complete Your Payment
                    </h2>
                    <p className="text-xs font-sans uppercase tracking-wider text-indianInk/55 mt-1">
                      Order #{order.order_number} • Amount: {formatINR(order.pricing.grand_total)}
                    </p>
                  </div>

                  {initiateError ? (
                    <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px]">
                      {initiateError}
                    </div>
                  ) : !paymentInfo ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="w-7 h-7 text-burnishedGold animate-spin" />
                      <p className="text-xs text-indianInk/50 tracking-widest uppercase font-semibold">
                        Generating payment channel...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">

                      {/* Payment Instructions */}
                      <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-burnishedGold/10 pb-2">
                          <span className="text-xs font-sans font-bold text-indianInk/60 uppercase tracking-wider">
                            Transfer Details
                          </span>
                          <span className="text-xs font-sans font-bold text-deodharForest">
                            UPI ONLY
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-indianInk/70 font-sans">Amount to Pay</span>
                          <span className="text-xl font-bold font-sans text-deodharForest">
                            {formatINR(paymentInfo.amount)}
                          </span>
                        </div>

                        {/* UPI ID */}
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-sm text-indianInk/70 font-sans">UPI ID</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white border border-burnishedGold/10 px-2.5 py-1 rounded text-sm font-semibold text-indianInk font-mono select-all">
                              {paymentInfo.upi_id}
                            </code>
                            <button
                              onClick={() => handleCopyUPI(paymentInfo.upi_id)}
                              className="p-1.5 border border-burnishedGold/20 rounded hover:bg-richCream text-burnishedGold transition-colors"
                              title="Copy UPI ID"
                            >
                              {copiedText ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Transaction reference note */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-indianInk/70 font-sans">Transaction Description</span>
                          <span className="text-sm font-mono font-semibold text-indianInk bg-white border border-burnishedGold/10 px-2 py-0.5 rounded">
                            Order {order.order_number}
                          </span>
                        </div>
                      </div>

                      {/* QR & Deep link details */}
                      <div className="flex flex-col sm:flex-row gap-6 items-center bg-white border border-burnishedGold/10 p-5 rounded-lg">

                        {/* QR Code Container */}
                        <div className="w-40 h-40 relative flex items-center justify-center border border-burnishedGold/15 rounded bg-richCream/5 shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentInfo.upi_link)}&color=0f3d2e`}
                            alt="Payment QR Code"
                            className="w-36 h-36 object-contain"
                          />
                        </div>

                        {/* Help Text / CTA */}
                        <div className="space-y-3 flex-grow text-center sm:text-left">
                          <h4 className="font-serif text-base font-bold text-deodharForest flex items-center justify-center sm:justify-start gap-1.5">
                            <QrCode className="w-4.5 h-4.5 text-burnishedGold" /> Scan to Pay
                          </h4>
                          <p className="text-xs text-indianInk/60 font-sans leading-relaxed">
                            Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) to complete the payment.
                          </p>
                          {/* Pay via UPI App button temporarily hidden as requested. Uncomment to re-enable anytime */}
                          {/*
                          <a
                            href={paymentInfo.upi_link}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-deodharForest text-richCream rounded font-sans text-xs font-bold tracking-widest uppercase hover:border-gheeGold border border-transparent shadow-sm transition-all duration-200 mt-1 hover:translate-y-[-1px]"
                          >
                            Pay via UPI App <ExternalLink className="w-3 h-3" />
                          </a>
                          */}
                        </div>
                      </div>

                      {/* SCREENSHOT UPLOAD FORM */}
                      <form onSubmit={handleProofSubmit} className="space-y-4 pt-4 border-t border-burnishedGold/10">
                        <h4 className="font-serif text-base font-bold text-deodharForest">
                          Upload Payment Screenshot
                        </h4>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-burnishedGold/20 rounded-lg p-6 bg-[#FAF9F6] text-center relative hover:border-burnishedGold/45 transition-colors">
                          <input
                            type="file"
                            accept=".png, .jpg, .jpeg, .webp"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />

                          <UploadCloud className="w-10 h-10 text-burnishedGold/60 mb-2" />
                          <p className="text-sm font-sans font-semibold text-indianInk">
                            {selectedFile ? selectedFile.name : "Select your screenshot file"}
                          </p>
                          <p className="text-[10px] text-indianInk/50 font-sans mt-1">
                            Supported: PNG, JPG, JPEG, WEBP (Max 5MB)
                          </p>
                        </div>

                        {fileError && (
                          <div className="text-xs font-sans text-destructive font-semibold">
                            {fileError}
                          </div>
                        )}

                        {submitError && (
                          <div className="p-3 bg-destructive-foreground border border-destructive/20 text-destructive text-xs font-sans rounded">
                            {submitError}
                          </div>
                        )}

                        {selectedFile && (
                          <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full relative overflow-hidden py-3 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-transparent hover:border-gheeGold disabled:opacity-50 text-center flex items-center justify-center"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>{uploadProgressMsg}</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                <span>Submit Screenshot Proof</span>
                              </>
                            )}
                          </button>
                        )}
                      </form>

                    </div>
                  )}

                </div>
              )}

              {/* Delivery and Customer Snapshots */}
              <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-bold text-deodharForest border-b border-burnishedGold/10 pb-2">
                  Delivery Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indianInk/55 uppercase tracking-wider">
                      Customer Profile
                    </p>
                    <p className="font-medium text-indianInk">
                      {order.customer_snapshot.first_name || ""} {order.customer_snapshot.last_name || ""}
                    </p>
                    <p className="text-xs text-indianInk/60 truncate">
                      {order.customer_snapshot.email}
                    </p>
                    {order.customer_snapshot.phone && (
                      <p className="text-xs text-indianInk/60">
                        {order.customer_snapshot.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indianInk/55 uppercase tracking-wider">
                      Shipping Address
                    </p>
                    <p className="font-medium text-indianInk">
                      {order.shipping_address_snapshot.full_name}
                    </p>
                    <p className="text-xs text-indianInk/70 leading-relaxed">
                      {order.shipping_address_snapshot.address_line1}
                      {order.shipping_address_snapshot.address_line2 && `, ${order.shipping_address_snapshot.address_line2}`}
                      <br />
                      {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} - {order.shipping_address_snapshot.pincode}
                      <br />
                      {order.shipping_address_snapshot.country}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right/Summary Column */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 shadow-sm space-y-6">

                <div className="border-b border-burnishedGold/10 pb-3 flex justify-between items-center">
                  <h3 className="font-serif text-lg font-bold text-deodharForest">
                    Order Details
                  </h3>
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isConfirmed ? "bg-success/10 text-success border border-success/20" : "bg-warning/15 text-warning-foreground border border-warning/20"
                    }`}>
                    {order.order_status.replace("_", " ")}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-burnishedGold/10 max-h-[280px] overflow-y-auto pr-1">
                  {order.items.map((item) => {
                    const rawImage = (item as any).image_url || (item as any).media_urls?.[0];
                    const fallbackImage = getProductFallbackImage((item as any).product_slug || item.product_name);
                    const imageSrc = rawImage || fallbackImage;

                    return (
                      <div key={item.variant_id} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center">
                        <div className="relative w-12 h-12 rounded border border-burnishedGold/10 overflow-hidden bg-richCream/10 shrink-0">
                          <Image
                            src={imageSrc}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-serif text-sm font-bold text-deodharForest truncate">
                            {item.product_name}
                          </h4>
                          <p className="text-[10px] text-indianInk/60 font-sans tracking-wide uppercase">
                            Size: {item.variant_title} × {item.quantity}
                          </p>
                        </div>
                        <div className="font-sans text-sm font-semibold text-indianInk shrink-0">
                          {formatINR(item.line_total)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-3 font-sans text-xs border-t border-burnishedGold/10 pt-4">
                  <div className="flex justify-between items-center text-indianInk/70">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatINR(order.pricing.subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-indianInk/70">
                    <span>Estimated GST (5%)</span>
                    <span className="font-semibold">{formatINR(order.pricing.tax_total)}</span>
                  </div>

                  <div className="flex justify-between items-center text-indianInk/70">
                    <span>Shipping Fee</span>
                    <span className="font-semibold">
                      {order.pricing.shipping_fee === 0 ? "FREE" : formatINR(order.pricing.shipping_fee)}
                    </span>
                  </div>

                  <div className="w-full h-px bg-burnishedGold/10 my-2" />

                  <div className="flex justify-between items-center text-sm font-bold text-deodharForest">
                    <span>Total Amount</span>
                    <span>{formatINR(order.pricing.grand_total)}</span>
                  </div>
                </div>

                <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded p-3 text-[10px] font-sans text-indianInk/55 leading-normal space-y-1">
                  <p className="font-bold uppercase tracking-wider text-deodharForest">
                    Quality Sealed Shipments
                  </p>
                  <p>
                    All items undergo strict lab test certifications before sealing. Standard shipping takes 3-5 business days from payment verification.
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </PublicLayout>
  );
}