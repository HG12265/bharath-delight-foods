"use client";

import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useCart } from "@/hooks/use-cart";
import { useMe } from "@/hooks/use-auth";
import { usePublicSettings } from "@/hooks/use-settings";
import { useInitiateCheckout, useCompleteCheckout } from "@/hooks/use-checkout";
import { useCreateOrderFromCheckout } from "@/hooks/use-orders";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import { ArrowLeft, Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { ShippingAddress } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cartData, isPending: isCartPending } = useCart();
  const { data: meData } = useMe();
  const initiateCheckoutMutation = useInitiateCheckout();
  const completeCheckoutMutation = useCompleteCheckout();
  const createOrderMutation = useCreateOrderFromCheckout();

  const cart = cartData?.data;
  const items = cart?.items || [];
  const summary = cart?.summary;

  const { data: settingsData } = usePublicSettings();
  const publicSettings = settingsData?.data;

  const subtotal = parseFloat(String(summary?.subtotal ?? 0)) || 0;
  const taxRate = publicSettings?.tax_percentage !== undefined ? parseFloat(String(publicSettings.tax_percentage)) : 0;
  const standardShipping = publicSettings?.shipping_fee !== undefined ? parseFloat(String(publicSettings.shipping_fee)) : 0;

  const taxTotal = subtotal > 0 ? Math.round((subtotal * taxRate) / 100) : 0;
  const shippingTotal = subtotal > 0 ? standardShipping : 0;
  const grandTotal = subtotal + taxTotal + shippingTotal;

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Autofill authenticated user details
  useEffect(() => {
    const me = meData?.data;
    if (me) {
      if (me.email) setEmail(me.email);
      if (me.phone) {
        // Strip country code if it matches +91 to make it 10-digit editable
        const displayPhone = me.phone.startsWith("+91") ? me.phone.slice(3) : me.phone;
        setPhone(displayPhone);
      }
      if (me.personal_details) {
        const first = me.personal_details.first_name || "";
        const last = me.personal_details.last_name || "";
        setFullName(`${first} ${last}`.trim());
      }
    }
  }, [meData]);

  // Client-side validations
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address";
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (!(/^[6-9]\d{9}$/.test(cleanPhone) || /^\+91[6-9]\d{9}$/.test(cleanPhone))) {
      errors.phone = "Please enter a valid 10-digit Indian phone number";
    }

    if (!addressLine1.trim()) {
      errors.addressLine1 = "Address Line 1 is required";
    }

    if (!city.trim()) {
      errors.city = "City is required";
    }

    if (!state.trim()) {
      errors.state = "State is required";
    }

    const cleanPincode = pincode.trim().replace(/\s+/g, "");
    if (!cleanPincode) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(cleanPincode)) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
    switch (field) {
      case "fullName": setFullName(value); break;
      case "phone": setPhone(value); break;
      case "addressLine1": setAddressLine1(value); break;
      case "addressLine2": setAddressLine2(value); break;
      case "city": setCity(value); break;
      case "state": setState(value); break;
      case "pincode": setPincode(value); break;
      case "email": setEmail(value); break;
    }
  };

  const isSubmitting = initiateCheckoutMutation.isPending || completeCheckoutMutation.isPending || createOrderMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!agreedToTerms) {
      setApiError("You must agree to the Terms & Conditions, Privacy Policy, and Refund Policy to place an order.");
      return;
    }

    if (!validateForm()) return;
    if (!cart) {
      setApiError("No active shopping cart session found.");
      return;
    }

    // Normalize phone to E.164 format for India (+91)
    const rawPhone = phone.trim().replace(/\s+/g, "");
    const normalizedPhone = /^[6-9]\d{9}$/.test(rawPhone) ? `+91${rawPhone}` : rawPhone;

    const shippingAddress: ShippingAddress = {
      full_name: fullName.trim(),
      phone: normalizedPhone,
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: "India",
    };

    // Generate unique idempotency key
    const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const initiatePayload = {
      cart_id: cart.id,
      email: email.trim(),
      shipping_address: shippingAddress,
      idempotency_key: idempotencyKey,
    };

    initiateCheckoutMutation.mutate(initiatePayload, {
      onSuccess: (checkoutRes) => {
        if (checkoutRes.success && checkoutRes.data) {
          const checkoutId = checkoutRes.data.id;
          
          // Step 2: Complete the checkout session (transitions status to 'completed')
          completeCheckoutMutation.mutate(checkoutId, {
            onSuccess: (completeRes) => {
              if (completeRes.success && completeRes.data) {
                // Step 3: Create order from the completed checkout session
                createOrderMutation.mutate(checkoutId, {
                  onSuccess: (orderRes) => {
                    if (orderRes.success && orderRes.data) {
                      const orderId = orderRes.data.id;
                      router.push(`/order/${orderId}`);
                    } else {
                      setApiError(orderRes.message || "Failed to construct order details from checkout.");
                    }
                  },
                  onError: (err: any) => {
                    setApiError(
                      err.response?.data?.message || 
                      err.message || 
                      "An error occurred while finalizing your order."
                    );
                  }
                });
              } else {
                setApiError(completeRes.message || "Failed to complete checkout session.");
              }
            },
            onError: (err: any) => {
              setApiError(
                err.response?.data?.message || 
                err.message || 
                "An error occurred while completing the checkout."
              );
            }
          });
        } else {
          setApiError(checkoutRes.message || "Failed to initialize checkout session.");
        }
      },
      onError: (err: any) => {
        setApiError(
          err.response?.data?.message || 
          err.message || 
          "An error occurred while initiating your checkout details."
        );
      }
    });
  };

  return (
    <PublicLayout>
      <div 
        className="min-h-screen text-indianInk py-12 md:py-20 border-b border-burnishedGold/15"
        style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <Link 
              href="/cart"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-colors duration-150 mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-deodharForest">
              Checkout
            </h1>
            <p className="text-sm font-sans text-indianInk/60 mt-1">
              Please enter your delivery details to complete your order.
            </p>
          </div>

          {isCartPending ? (
            <div className="h-[400px] bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center gap-3 shadow-sm animate-fade-up">
              <Loader2 className="w-10 h-10 text-burnishedGold animate-spin" />
              <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
                Loading checkout details...
              </p>
            </div>
          ) : !cart || items.length === 0 ? (
            <div className="h-[350px] bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center text-center gap-6 shadow-sm animate-fade-up">
              <h3 className="font-serif text-xl font-bold text-deodharForest">Your cart is empty</h3>
              <p className="text-xs text-indianInk/60 max-w-[280px] leading-relaxed">
                Add products to your cart before proceeding to checkout.
              </p>
              <Link
                href="/shop"
                className="px-6 py-3 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:border-gheeGold border border-transparent transition-all duration-300 shadow-md"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
              
              {/* Form Section */}
              <div className="lg:col-span-7 space-y-6 animate-fade-up">
                {apiError && (
                  <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] font-medium leading-relaxed">
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="font-serif text-xl font-bold text-deodharForest border-b border-burnishedGold/10 pb-3 mb-4">
                    Delivery Address
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={fullName}
                        onChange={(e) => handleFieldChange("fullName", e.target.value)}
                        placeholder="Recipient's Name"
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.fullName ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.fullName && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.fullName}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        disabled={isSubmitting}
                        value={email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder="email@example.com"
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.email ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.email && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.email}
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Phone Number *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-sm font-sans font-semibold text-indianInk/40 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          disabled={isSubmitting}
                          value={phone}
                          onChange={(e) => handleFieldChange("phone", e.target.value)}
                          placeholder="98765 43210"
                          className={`w-full pl-12 pr-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                            validationErrors.phone ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                          }`}
                        />
                      </div>
                      {validationErrors.phone && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.phone}
                        </span>
                      )}
                    </div>

                    {/* Address Line 1 */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={addressLine1}
                        onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
                        placeholder="House / Flat No., Street, Area"
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.addressLine1 ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.addressLine1 && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.addressLine1}
                        </span>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={addressLine2}
                        onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
                        placeholder="Landmark, Apartment Name"
                        className="w-full px-4 py-3 bg-white text-indianInk border border-indianInk/15 rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold"
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        City *
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        placeholder="City name"
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.city ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.city && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.city}
                        </span>
                      )}
                    </div>

                    {/* State */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        State *
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={state}
                        onChange={(e) => handleFieldChange("state", e.target.value)}
                        placeholder="State name"
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.state ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.state && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.state}
                        </span>
                      )}
                    </div>

                    {/* Pincode */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={pincode}
                        onChange={(e) => handleFieldChange("pincode", e.target.value)}
                        placeholder="600001"
                        maxLength={6}
                        className={`w-full px-4 py-3 bg-white text-indianInk border rounded-[4px] font-sans text-base transition-colors duration-200 focus-visible:outline-none focus-visible:border-burnishedGold focus-visible:ring-1 focus-visible:ring-burnishedGold ${
                          validationErrors.pincode ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "border-indianInk/15"
                        }`}
                      />
                      {validationErrors.pincode && (
                        <span className="text-xs text-destructive font-sans font-medium">
                          {validationErrors.pincode}
                        </span>
                      )}
                    </div>

                    {/* Country - Fixed Display */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans font-bold uppercase tracking-wider text-indianInk/70">
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value="India"
                        className="w-full px-4 py-3 bg-[#FAF9F6] text-indianInk/60 border border-indianInk/10 rounded-[4px] font-sans text-base select-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Checkout agreement checkbox */}
                  <div className="flex items-start gap-2.5 pt-4 border-t border-burnishedGold/10">
                    <input
                      type="checkbox"
                      id="checkoutTermsAgreement"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={isSubmitting}
                      required
                      className="w-4 h-4 rounded text-deodharForest border-burnishedGold/30 focus:ring-0 outline-none mt-0.5 cursor-pointer shrink-0"
                    />
                    <label htmlFor="checkoutTermsAgreement" className="text-[11px] font-sans text-indianInk/70 leading-relaxed cursor-pointer select-none">
                      I understand and agree to the{" "}
                      <Link href="/terms-and-conditions" target="_blank" className="text-deodharForest font-bold underline hover:text-burnishedGold transition-colors">
                        Terms & Conditions
                      </Link>
                      ,{" "}
                      <Link href="/privacy-policy" target="_blank" className="text-deodharForest font-bold underline hover:text-burnishedGold transition-colors">
                        Privacy Policy
                      </Link>
                      , and{" "}
                      <Link href="/refund-cancellation-policy" target="_blank" className="text-deodharForest font-bold underline hover:text-burnishedGold transition-colors">
                        Refund & Cancellation Policy
                      </Link>
                      . *
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !agreedToTerms}
                    className="w-full relative overflow-hidden py-4 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-transparent hover:border-gheeGold hover:shadow-[0_6px_20px_rgba(15,61,46,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent text-center flex items-center justify-center mt-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        <span>Place Order & Pay</span>
                      </>
                    )}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gheeGold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  </button>
                </form>
              </div>

              {/* Order Summary Panel */}
              <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 shadow-sm space-y-6">
                  <h3 className="font-serif text-lg font-bold text-deodharForest border-b border-burnishedGold/10 pb-3">
                    Order Summary
                  </h3>

                  {/* Items List */}
                  <div className="divide-y divide-burnishedGold/10 max-h-[280px] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const productName = item.product_summary?.name || "Product";
                      const rawImage = item.product_summary?.media_urls?.[0] || item.product_summary?.image_url;
                      const fallbackImage = getProductFallbackImage(item.product_summary?.slug || productName);
                      const imageSrc = rawImage || fallbackImage;
                      const variantTitle = item.product_summary?.variant_title || item.product_summary?.volume_weight || "Standard";
                      const itemPrice = parseFloat(String(item.unit_price_snapshot ?? 0)) || 0;
                      const originalPrice = parseFloat(String(item.original_price ?? item.product_summary?.original_price ?? itemPrice)) || itemPrice;
                      const hasOffer = Boolean(item.has_offer || (originalPrice > itemPrice));
                      const itemTotal = itemPrice * item.quantity;

                      return (
                        <div key={item.variant_id} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center">
                          <div className="relative w-12 h-12 rounded border border-burnishedGold/10 overflow-hidden bg-richCream/10 shrink-0">
                            <Image
                              src={imageSrc}
                              alt={productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-serif text-sm font-bold text-deodharForest truncate">
                              {productName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-[10px] text-indianInk/60 font-sans tracking-wide uppercase">
                                Size: {variantTitle} × {item.quantity}
                              </p>
                              {hasOffer && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                                  Offer
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="font-sans text-right shrink-0">
                            <div className="text-sm font-semibold text-[#0F3D2E]">
                              {formatINR(itemTotal)}
                            </div>
                            {hasOffer && originalPrice > itemPrice && (
                              <div className="text-[10px] text-indianInk/40 line-through">
                                {formatINR(originalPrice * item.quantity)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing breakdown */}
                  <div className="space-y-3 font-sans text-xs border-t border-burnishedGold/10 pt-4">
                    {parseFloat(String(cart?.summary?.total_discount ?? 0)) > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
                        <span className="font-semibold flex items-center gap-1">
                          🎉 Offer Savings
                        </span>
                        <span className="font-bold">
                          -{formatINR(parseFloat(String(cart?.summary?.total_discount)))}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatINR(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>{taxRate > 0 ? `Estimated GST (${taxRate}%)` : "Estimated GST"}</span>
                      <span className="font-semibold">{formatINR(taxTotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>Shipping Fee</span>
                      <span className="font-semibold">
                        {shippingTotal === 0 ? "FREE" : formatINR(shippingTotal)}
                      </span>
                    </div>

                    <div className="w-full h-px bg-burnishedGold/10 my-2" />

                    <div className="flex justify-between items-center text-sm font-bold text-deodharForest">
                      <span>Grand Total</span>
                      <span>{formatINR(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded p-3 flex gap-2.5 items-start">
                    <CreditCard className="w-4 h-4 text-burnishedGold mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-sans font-bold text-deodharForest uppercase tracking-wider">
                        Manual UPI Transfer Only
                      </p>
                      <p className="text-[10px] font-sans text-indianInk/60 leading-normal">
                        Place order now and make payment via UPI QR code or link on the next page to confirm your purchase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}