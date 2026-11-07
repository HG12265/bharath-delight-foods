"use client";

import React, { useEffect, useRef } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter } from "@/platform/navigation";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { useMe } from "@/hooks/use-auth";
import { useCartDrawer } from "@/providers/cart-drawer-provider";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2 } from "lucide-react";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { isCartOpen, closeCart } = useCartDrawer();
  const drawerRef = useRef<HTMLDivElement>(null);

  const { data: cartData, isPending, isError } = useCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();
  const { data: meData } = useMe();
  const isAuthenticated = !!meData?.success && !!meData?.data;

  const cart = cartData?.data;
  const items = cart?.items || [];
  const subtotal = cart?.summary?.subtotal || 0;

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

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

  const handleCheckoutRedirect = () => {
    closeCart();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
    } else {
      router.push("/checkout");
    }
  };

  const handleShopRedirect = () => {
    closeCart();
    router.push("/shop");
  };

  const isMutating = updateItemMutation.isPending || removeItemMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-indianInk/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className="relative w-[90vw] sm:max-w-[450px] h-full bg-warmIvory text-indianInk shadow-2xl flex flex-col justify-between z-10 border-l border-burnishedGold/15 animate-slide-in overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-burnishedGold/15 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-deodharForest" />
            <h2 className="font-serif text-lg font-bold text-deodharForest">
              Your Cart
            </h2>
          </div>
          <button 
            onClick={closeCart}
            className="p-1.5 hover:bg-richCream text-deodharForest rounded-full transition-colors outline-none"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {isPending ? (
            <div className="h-full flex flex-col justify-center items-center gap-3">
              <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
              <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
                Loading Cart...
              </p>
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col justify-center items-center text-center gap-3">
              <p className="text-sm text-warmSaffron font-medium">
                Unable to load cart. Please try again.
              </p>
              <button 
                onClick={handleShopRedirect}
                className="px-4 py-2 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:bg-deodharForest/95"
              >
                Back to Shop
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center gap-6">
              <div className="w-16 h-16 bg-burnishedGold/5 rounded-full flex items-center justify-center border border-burnishedGold/15">
                <ShoppingBag className="w-8 h-8 text-burnishedGold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-deodharForest">Your cart is empty</h3>
                <p className="text-xs text-indianInk/60 max-w-[240px] mx-auto leading-relaxed">
                  Carefully select from our regional pure ghee collections.
                </p>
              </div>
              <button 
                onClick={handleShopRedirect}
                className="px-6 py-3 bg-deodharForest text-richCream text-xs font-semibold rounded-[4px] tracking-widest uppercase hover:border-gheeGold border border-transparent transition-all duration-300"
              >
                Shop Ghee
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const productName = item.product_summary?.name || "Product";
                const rawImage = item.product_summary?.media_urls?.[0] || item.product_summary?.image_url;
                const fallbackImage = getProductFallbackImage(item.product_summary?.slug || productName);
                const imageSrc = rawImage || fallbackImage;
                const variantName = item.product_summary?.variant_title || item.product_summary?.volume_weight || "Standard";
                const itemPrice = item.unit_price_snapshot || 0;
                const originalPrice = item.original_price || item.product_summary?.original_price || itemPrice;
                const hasOffer = Boolean(item.has_offer || (originalPrice > itemPrice));
                const offerBadge = item.offer_badge || item.product_summary?.offer_badge;
                const itemTotal = itemPrice * item.quantity;

                return (
                  <div 
                    key={item.variant_id}
                    className="flex gap-4 p-4 bg-white border border-burnishedGold/15 rounded-lg shadow-sm hover:border-burnishedGold/25 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded border border-burnishedGold/10 overflow-hidden bg-richCream/10 shrink-0 select-none">
                      <Image
                        src={imageSrc}
                        alt={productName}
                        fill
                        className="object-cover object-center select-none pointer-events-none"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-serif text-sm font-bold text-deodharForest leading-tight">
                            {productName}
                          </h4>
                          <button
                            onClick={() => handleRemoveItem(item.variant_id)}
                            disabled={isMutating}
                            className="p-1 text-indianInk/40 hover:text-warmSaffron transition-colors rounded disabled:opacity-40 outline-none"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[10px] text-indianInk/60 font-sans tracking-wider uppercase font-semibold">
                            Size: {variantName}
                          </p>
                          {hasOffer && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              🏷️ {offerBadge || "Offer"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        {/* Qty Selector */}
                        <div className="flex items-center border border-burnishedGold/25 rounded-[4px] bg-[#FAF9F6] h-[30px] overflow-hidden">
                          <button
                            onClick={() => handleQtyChange(item.variant_id, item.quantity, -1)}
                            disabled={isMutating || item.quantity <= 1}
                            className="p-1 hover:bg-richCream text-indianInk/65 disabled:opacity-30 transition-colors w-7 flex items-center justify-center border-r border-burnishedGold/15 h-full"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-sans font-bold text-indianInk min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(item.variant_id, item.quantity, 1)}
                            disabled={isMutating}
                            className="p-1 hover:bg-richCream text-indianInk/65 disabled:opacity-30 transition-colors w-7 flex items-center justify-center border-l border-burnishedGold/15 h-full"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Unit price / Total price */}
                        <div className="text-right font-sans">
                          <div className="text-xs font-bold text-[#0F3D2E]">
                            {formatINR(itemTotal)}
                          </div>
                          {hasOffer && originalPrice > itemPrice && (
                            <div className="text-[10px] text-indianInk/40 line-through">
                              {formatINR(originalPrice * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Subtotal & Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-burnishedGold/15 bg-white shadow-2xl flex flex-col gap-4">
            {parseFloat(String(cart?.summary?.total_discount ?? 0)) > 0 && (
              <div className="flex justify-between items-center font-sans text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
                <span className="font-semibold flex items-center gap-1">
                  🎉 Total Offer Savings:
                </span>
                <span className="font-bold">
                  -{formatINR(parseFloat(String(cart?.summary?.total_discount)))}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center font-sans">
              <span className="text-xs uppercase tracking-widest text-indianInk/60 font-semibold">Subtotal</span>
              <span className="text-base font-bold text-deodharForest">{formatINR(subtotal)}</span>
            </div>
            
            <p className="text-[10px] text-indianInk/50 leading-relaxed font-sans">
              Taxes and shipping calculated at checkout.
            </p>

            <button
              onClick={handleCheckoutRedirect}
              disabled={isMutating}
              className="w-full relative overflow-hidden py-4 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-transparent hover:border-gheeGold hover:shadow-[0_6px_20px_rgba(15,61,46,0.2)] disabled:opacity-50 text-center flex items-center justify-center"
            >
              <span>Proceed to Checkout</span>
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gheeGold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;