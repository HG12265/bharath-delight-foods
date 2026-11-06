"use client";

import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useParams, useSearchParams } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useOrderDetails } from "@/hooks/use-orders";
import {
  useInitiatePhonePePayment,
  usePhonePeStatus,
} from "@/hooks/use-payments";
import { useClearCart } from "@/hooks/use-cart";
import orderService from "@/services/order-service";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  FileText,
  Package,
  Truck,
  X,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;

  const { data: orderData, isPending: isOrderPending, isError: isOrderError, refetch: refetchOrder } = useOrderDetails(orderId);

  const order = orderData?.data;

  const clearCartMutation = useClearCart();
  const initiatePhonePeMutation = useInitiatePhonePePayment();

  // PhonePe status check
  const isFromPhonePe = searchParams?.get("status") === "check" || searchParams?.get("from") === "phonepe";
  const { data: phonePeStatusData } = usePhonePeStatus(orderId, {
    enabled: !!order && order.payment_status !== "paid" && isFromPhonePe,
    refetchInterval: 2500,
  });

  const isPaid = order?.payment_status === "paid" || phonePeStatusData?.data?.state === "COMPLETED";
  const isConfirmed = order?.order_status === "confirmed" || isPaid;

  // Component states
  const [phonePeError, setPhonePeError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Invoice Download states
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadInvoiceError, setDownloadInvoiceError] = useState<string | null>(null);

  // When PhonePe status is detected COMPLETED
  useEffect(() => {
    if (phonePeStatusData?.data?.state === "COMPLETED") {
      clearCartMutation.mutate(undefined);
      setShowSuccessBanner(true);
      refetchOrder();
    }
  }, [phonePeStatusData, refetchOrder, clearCartMutation]);

  // When order is paid / confirmed (especially after returning from PhonePe or on success)
  useEffect(() => {
    if (isConfirmed && (isFromPhonePe || showSuccessBanner)) {
      clearCartMutation.mutate(undefined);
      setShowSuccessBanner(true);
    }
  }, [isConfirmed, isFromPhonePe, showSuccessBanner, clearCartMutation]);

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

  // Handle PhonePe Payment Gateway Initiation
  const handlePhonePePay = () => {
    if (!order) return;
    setPhonePeError(null);
    initiatePhonePeMutation.mutate(
      { orderId: order.id },
      {
        onSuccess: (res) => {
          if (res?.data?.redirect_url) {
            window.location.href = res.data.redirect_url;
          } else {
            setPhonePeError("Could not retrieve PhonePe payment URL.");
          }
        },
        onError: (err: any) => {
          setPhonePeError(
            err.response?.data?.message || err.message || "Failed to start PhonePe payment session."
          );
        },
      }
    );
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
              {(showSuccessBanner || isConfirmed) && (
                <div className="bg-[#EAF5EC] border-2 border-[#2E7D32]/40 rounded-xl p-5 shadow-sm flex items-start gap-3.5 relative animate-fade-up">
                  <div className="w-10 h-10 bg-[#2E7D32]/10 rounded-full flex items-center justify-center border border-[#2E7D32]/20 shrink-0 text-[#2E7D32]">
                    <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-grow pr-6">
                    <h4 className="font-serif text-base font-bold text-[#1E352F]">
                      Thank You! Your Order Has Been Placed Successfully!
                    </h4>
                    <p className="text-xs font-sans text-[#1E352F]/85 mt-1 leading-relaxed">
                      We have received your payment via PhonePe Payment Gateway. Our team is carefully preparing your authentic delights, and your package will be delivered to your doorstep soon!
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2E7D32] hover:bg-[#1E352F] text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessBanner(false)}
                    className="absolute right-2.5 top-2.5 p-1 text-[#1E352F]/60 hover:text-[#1E352F] hover:bg-[#2E7D32]/10 rounded transition"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STATUS CARD OR PAYMENT FORM */}
              {isConfirmed ? (
                <div className="bg-white border-2 border-[#2E7D32]/25 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-up">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2E7D32]/10 rounded-full flex items-center justify-center border border-[#2E7D32]/20 shrink-0 text-[#2E7D32]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-2xl font-bold text-deodharForest">
                          Order Confirmed & Paid!
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Confirmed & Paid
                        </span>
                      </div>
                      <p className="text-sm font-sans text-indianInk/75 mt-2 leading-relaxed">
                        Thank you for choosing <span className="font-semibold text-deodharForest">Bharath Delight Foods</span>! We have received your payment for order <span className="font-bold text-deodharForest">#{order.order_number}</span>. Our team is carefully packaging your authentic delights fresh, and your shipment will be delivered right to your doorstep soon.
                      </p>
                    </div>
                  </div>

                  {/* Highlights / steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold font-sans text-deodharForest uppercase tracking-wider">Payment Verified</p>
                        <p className="text-[10px] font-sans text-indianInk/60">PhonePe Gateway</p>
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
                    <div className="pt-2 border-t border-burnishedGold/10 flex flex-wrap items-center justify-between gap-3">
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

                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF9F6] text-deodharForest border border-burnishedGold/30 hover:border-deodharForest rounded-[4px] font-sans text-xs font-semibold tracking-widest uppercase transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
                      </Link>

                      {downloadInvoiceError && (
                        <p className="w-full text-xs text-destructive font-semibold font-sans mt-2">{downloadInvoiceError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-burnishedGold/15 rounded-xl p-6 md:p-8 shadow-sm space-y-6">

                  <div className="border-b border-burnishedGold/10 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-deodharForest">
                      Complete Your Payment
                    </h2>
                    <p className="text-xs font-sans uppercase tracking-wider text-indianInk/55 mt-1">
                      Order #{order.order_number} • Amount: {formatINR(order.pricing.grand_total)}
                    </p>
                  </div>

                  {/* PhonePe Payment Gateway Box */}
                  <div className="bg-gradient-to-r from-[#5f259f]/10 via-[#5f259f]/5 to-transparent border-2 border-[#5f259f]/30 rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                          पे
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-deodharForest">
                              Pay via PhonePe Payment Gateway
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-200">
                              Instant
                            </span>
                          </div>
                          <p className="text-xs text-indianInk/70 font-sans mt-0.5">
                            UPI (Google Pay, PhonePe, Paytm, BHIM), Cards & NetBanking with 100% automated instant confirmation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePhonePePay}
                      disabled={initiatePhonePeMutation.isPending}
                      className="w-full py-4 px-6 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-lg font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      {initiatePhonePeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting to PhonePe Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay {formatINR(order.pricing.grand_total)} via PhonePe</span>
                        </>
                      )}
                    </button>

                    {phonePeError && (
                      <p className="text-xs text-destructive font-semibold font-sans text-center">
                        {phonePeError}
                      </p>
                    )}

                    {/* Trust badges */}
                    <div className="pt-3 border-t border-[#5f259f]/15 flex flex-wrap items-center justify-center gap-3 text-[11px] font-sans text-indianInk/60 font-medium">
                      <span className="inline-flex items-center gap-1 text-[#2E7D32]">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe & Secure
                      </span>
                      <span>•</span>
                      <span>Instant Automatic Approval</span>
                      <span>•</span>
                      <span>Google Pay • PhonePe • Paytm • Cards</span>
                    </div>
                  </div>

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
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isConfirmed 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                      : "bg-warning/15 text-warning-foreground border border-warning/20"
                  }`}>
                    {isConfirmed ? "PAID & CONFIRMED" : order.order_status.replace("_", " ")}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-burnishedGold/10 max-h-[280px] overflow-y-auto pr-1">
                  {order.items.map((item) => {
                    const rawImage = (item as any).image_url || (item as any).media_urls?.[0];
                    const isUrl = Boolean(rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://") || rawImage.startsWith("/")));
                    const fallbackImage = getProductFallbackImage((item as any).product_slug || item.product_name);
                    const imageSrc = isUrl ? rawImage : fallbackImage;

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
