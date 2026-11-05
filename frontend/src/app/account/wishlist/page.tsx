"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import AccountShell from "@/components/features/account/account-shell";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { useAddToCart } from "@/hooks/use-cart";
import { formatINR, optimizeCloudinaryUrl, getProductFallbackImage } from "@/lib/utils";
import { useMediaAsset } from "@/hooks/use-media";
import { 
  Loader2, 
  Trash2, 
  ShoppingCart, 
  Eye, 
  Heart, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

function WishlistProductImage({ mediaId, alt, productNameOrSlug }: { mediaId?: string; alt: string; productNameOrSlug?: string }) {
  const fallbackSrc = getProductFallbackImage(productNameOrSlug);
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : fallbackSrc);

  return (
    <Image
      src={optimizeCloudinaryUrl(url, 600)}
      alt={alt}
      fill
      className="object-cover object-center select-none"
    />
  );
}

export default function WishlistPage() {
  const { data: wishlistRes, isPending, isError, refetch } = useWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const addToCartMutation = useAddToCart();

  // Toast / feedback message states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wishlist = wishlistRes?.data;
  const items = wishlist?.items || [];

  const handleRemove = (variantId: string) => {
    removeFromWishlistMutation.mutate(variantId, {
      onSuccess: (res) => {
        if (res.success) {
          triggerSuccess("Removed from wishlist.");
        } else {
          triggerError(res.message || "Failed to remove item.");
        }
      },
      onError: (err: any) => {
        triggerError(err.message || "Failed to remove item.");
      }
    });
  };

  const handleMoveToCart = (productId: string, variantId: string) => {
    addToCartMutation.mutate(
      {
        payload: {
          product_id: productId,
          variant_id: variantId,
          quantity: 1
        }
      },
      {
        onSuccess: (cartRes) => {
          if (cartRes.success) {
            // Cart add succeeded. Now remove from wishlist.
            removeFromWishlistMutation.mutate(variantId, {
              onSuccess: (wishRes) => {
                if (wishRes.success) {
                  triggerSuccess("Moved to cart.");
                } else {
                  triggerError(wishRes.message || "Added to cart, but failed to remove from wishlist.");
                }
              },
              onError: (err: any) => {
                triggerError(err.message || "Added to cart, but failed to remove from wishlist.");
              }
            });
          } else {
            triggerError(cartRes.message || "Failed to add item to cart.");
          }
        },
        onError: (err: any) => {
          triggerError(err.message || "Failed to add item to cart.");
        }
      }
    );
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AccountShell 
      title="My Wishlist" 
      description="View and manage items you've saved for later."
    >
      <div className="space-y-6">
        
        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-4 bg-success/5 border border-success/20 text-success text-xs font-sans rounded-[4px] flex items-center gap-2.5 animate-fade-up">
            <CheckCircle2 className="w-4.5 h-4.5 text-success shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-xs font-sans rounded-[4px] flex items-center gap-2.5 animate-fade-up">
            <AlertCircle className="w-4.5 h-4.5 text-destructive shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
            <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
              Retrieving your wishlist...
            </p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>We encountered an error loading your wishlist. Please refresh to try again.</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-5">
            <div className="w-16 h-16 bg-[#FAF9F6] border border-burnishedGold/15 rounded-full flex items-center justify-center mx-auto text-burnishedGold">
              <Heart className="w-6 h-6 text-gheeGold" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-serif text-lg font-bold text-deodharForest">Your Wishlist is Empty</h3>
              <p className="text-xs text-indianInk/60 font-sans leading-relaxed">
                Your wishlist is empty. Explore our carefully selected products and save your favorites here.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-deodharForest text-richCream font-sans text-xs font-bold tracking-widest uppercase rounded-[4px] border border-transparent hover:border-gheeGold hover:shadow-md transition-all duration-200"
            >
              Explore Catalog
            </Link>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-up">
            {items.map((item) => {
              const summary = item.product_summary;
              const inStock = summary.stock_status === "in_stock";

              return (
                <div 
                  key={item.variant_id}
                  className="flex flex-col bg-white border border-burnishedGold/15 rounded-lg overflow-hidden shadow-sm hover:border-burnishedGold/25 hover:shadow-[0_8px_20px_rgba(25,25,25,0.04)] transition-all duration-200"
                >
                  {/* Image & Header */}
                  <div className="relative w-full h-[180px] bg-richCream/10 border-b border-burnishedGold/10">
                    <WishlistProductImage
                      mediaId={summary.media_urls?.[0] || summary.media_ids?.[0]}
                      alt={summary.name}
                      productNameOrSlug={summary.slug}
                    />
                    
                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-0.5 rounded-[2px] text-[9px] uppercase tracking-wider font-bold shadow-sm border ${
                        inStock
                          ? "bg-success/5 text-success border-success/20"
                          : "bg-destructive-foreground text-destructive border-destructive/20"
                      }`}>
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {/* Remove Quick Button */}
                    <button
                      onClick={() => handleRemove(item.variant_id)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="absolute top-3 right-3 p-1.5 bg-white hover:bg-red-50 text-red-500 rounded-full border border-burnishedGold/10 shadow-sm transition-colors"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-serif text-base font-bold text-deodharForest leading-snug">
                        {summary.name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-sans text-indianInk/60">
                        <span>Volume: <span className="font-semibold text-indianInk">{summary.volume_weight || "Standard"}</span></span>
                        <span className="text-burnishedGold/30">|</span>
                        <span>SKU: <code className="font-mono bg-indianInk/5 px-1 rounded text-[10px]">{summary.sku}</code></span>
                      </div>
                      
                      <p className="text-[10px] font-sans text-indianInk/40">
                        Saved on {formatDate(item.added_at)}
                      </p>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="pt-3 border-t border-burnishedGold/10 flex items-center justify-between gap-4">
                      <div className="font-sans text-sm font-bold text-indianInk">
                        {formatINR(summary.price)}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View Product Detail */}
                        <Link
                          href={`/products/${summary.slug}`}
                          className="p-2 border border-burnishedGold/25 hover:border-burnishedGold hover:bg-richCream/25 text-deodharForest rounded-[4px] transition duration-150"
                          title="View Product Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Move To Cart Button */}
                        <button
                          onClick={() => handleMoveToCart(item.product_id, item.variant_id)}
                          disabled={!inStock || addToCartMutation.isPending || removeFromWishlistMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-deodharForest text-richCream font-sans text-[10px] font-bold tracking-widest uppercase rounded-[4px] border border-transparent hover:border-gheeGold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow transition duration-200"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AccountShell>
  );
}
