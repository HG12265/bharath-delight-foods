"use client";

import React from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@/hooks/use-cart";
import { usePublicSettings } from "@/hooks/use-settings";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import { Plus, Minus, Trash2, ShoppingBag, Loader2, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { data: cartData, isPending, isError } = useCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

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

  const handleQtyChange = (variantId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    updateItemMutation.mutate({
      variantId,
      payload: { quantity: newQty },
    });
  };

  const handleRemoveItem = (variantId: string) => {
    removeItemMutation.mutate({ variantId });
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCartMutation.mutate(undefined);
    }
  };

  const isMutating = 
    updateItemMutation.isPending || 
    removeItemMutation.isPending || 
    clearCartMutation.isPending;

  return (
    <PublicLayout>
      <div 
        className="min-h-screen text-indianInk py-12 md:py-20 border-b border-burnishedGold/15"
        style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header Area */}
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
            <div>
              <Link 
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-colors duration-150 mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </Link>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-deodharForest">
                Your Shopping Cart
              </h1>
            </div>

            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                disabled={isMutating}
                className="px-4 py-2 border border-warmSaffron/30 hover:border-warmSaffron text-warmSaffron bg-white/50 rounded-[4px] font-sans text-xs font-semibold tracking-wider uppercase transition-colors duration-150 outline-none disabled:opacity-40"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Page Grid */}
          {isPending ? (
            <div className="h-[400px] bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center gap-3 shadow-sm animate-fade-up">
              <Loader2 className="w-10 h-10 text-burnishedGold animate-spin" />
              <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
                Retrieving your items...
              </p>
            </div>
          ) : isError ? (
            <div className="h-[400px] bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center text-center gap-4 shadow-sm animate-fade-up">
              <p className="text-sm text-warmSaffron font-medium">
                We encountered an error loading your cart. Please try again.
              </p>
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:bg-deodharForest/95 shadow-sm"
              >
                Shop Ghee
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="h-[400px] bg-white border border-burnishedGold/15 rounded-lg flex flex-col justify-center items-center text-center gap-6 shadow-sm animate-fade-up">
              <div className="w-16 h-16 bg-burnishedGold/5 rounded-full flex items-center justify-center border border-burnishedGold/15">
                <ShoppingBag className="w-8 h-8 text-burnishedGold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-deodharForest">Your cart is currently empty</h3>
                <p className="text-xs text-indianInk/60 max-w-[280px] mx-auto leading-relaxed">
                  Fill it with our premium regional ghee choices to enjoy pure health.
                </p>
              </div>
              <Link
                href="/shop"
                className="px-6 py-3 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:border-gheeGold border border-transparent transition-all duration-300 shadow-md"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
              
              {/* Left Column: Cart Items List */}
              <div className="lg:col-span-8 space-y-4 animate-fade-up">
                {items.map((item) => {
                  const productName = item.product_summary?.name || "Product";
                  const rawImage = item.product_summary?.media_urls?.[0] || item.product_summary?.image_url;
                  const fallbackImage = getProductFallbackImage(item.product_summary?.slug || productName);
                  const imageSrc = rawImage || fallbackImage;
                  const variantName = item.product_summary?.variant_title || item.product_summary?.volume_weight || "Standard";
                  const itemPrice = parseFloat(String(item.unit_price_snapshot ?? 0)) || 0;
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div 
                      key={item.variant_id}
                      className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-burnishedGold/15 rounded-lg shadow-sm hover:border-burnishedGold/25 hover:shadow-md transition-all duration-200"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-20 rounded border border-burnishedGold/10 overflow-hidden bg-richCream/10 shrink-0 select-none mx-auto sm:mx-0">
                        <Image
                          src={imageSrc}
                          alt={productName}
                          fill
                          className="object-cover object-center select-none pointer-events-none"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-grow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-left">
                        
                        <div className="space-y-1 sm:max-w-xs">
                          <h3 className="font-serif text-base font-bold text-deodharForest leading-tight">
                            {productName}
                          </h3>
                          <p className="text-[10px] text-indianInk/60 font-sans tracking-wider uppercase font-semibold">
                            Size: {variantName}
                          </p>
                        </div>

                        {/* Qty Selector & Price controls in row */}
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-6 sm:gap-10">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-burnishedGold/25 rounded-[4px] bg-[#FAF9F6] h-[34px] overflow-hidden shadow-sm">
                            <button
                              onClick={() => handleQtyChange(item.variant_id, item.quantity, -1)}
                              disabled={isMutating || item.quantity <= 1}
                              className="p-1 hover:bg-richCream text-indianInk/65 disabled:opacity-30 transition-colors w-8 flex items-center justify-center border-r border-burnishedGold/15 h-full"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-sans font-bold text-indianInk min-w-[24px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.variant_id, item.quantity, 1)}
                              disabled={isMutating}
                              className="p-1 hover:bg-richCream text-indianInk/65 disabled:opacity-30 transition-colors w-8 flex items-center justify-center border-l border-burnishedGold/15 h-full"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Unit / Total Price */}
                          <div className="text-right font-sans text-sm font-bold text-indianInk min-w-[80px]">
                            {formatINR(itemTotal)}
                          </div>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleRemoveItem(item.variant_id)}
                            disabled={isMutating}
                            className="p-2 text-indianInk/40 hover:text-warmSaffron transition-colors rounded hover:bg-warmSaffron/5 disabled:opacity-40 outline-none"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Order Summary Panel */}
              <div className="lg:col-span-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 shadow-sm flex flex-col gap-6">
                  <h3 className="font-serif text-lg font-bold text-deodharForest border-b border-burnishedGold/10 pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-3 font-sans text-xs">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatINR(subtotal)}</span>
                    </div>

                    {/* GST */}
                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>{taxRate > 0 ? `Estimated GST (${taxRate}%)` : "Estimated GST"}</span>
                      <span className="font-semibold">{formatINR(taxTotal)}</span>
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between items-center text-indianInk/70">
                      <span>Shipping Fee</span>
                      <span className="font-semibold">
                        {shippingTotal === 0 ? "FREE" : formatINR(shippingTotal)}
                      </span>
                    </div>

                    <div className="w-full h-px bg-burnishedGold/10 my-2" />

                    {/* Grand Total */}
                    <div className="flex justify-between items-center text-sm font-bold text-deodharForest">
                      <span>Total Amount</span>
                      <span>{formatINR(grandTotal)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-indianInk/55 leading-relaxed font-sans border-t border-burnishedGold/10 pt-4">
                    Bharath Delight Foods complies strictly with FSSAI packing guidelines. Orders are dispatched trace-sealed.
                  </p>

                  <button
                    onClick={() => router.push("/checkout")}
                    disabled={isMutating}
                    className="w-full relative overflow-hidden py-4 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-transparent hover:border-gheeGold hover:shadow-[0_6px_20px_rgba(15,61,46,0.2)] disabled:opacity-50 text-center flex items-center justify-center mt-2"
                  >
                    <span>Proceed to Checkout</span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gheeGold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
