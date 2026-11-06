"use client";

import React, { use, useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter, notFound } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useProductBySlug } from "@/hooks/use-products";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession, useMe } from "@/hooks/use-auth";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { useMediaAsset } from "@/hooks/use-media";
import { formatINR, getProductFallbackImage } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { ShieldCheck, Check, ArrowLeft, Plus, Minus, Loader2, Heart } from "lucide-react";

interface PageProps {
  params: { slug: string };
}

function ProductDetailImage({ mediaId, alt, productNameOrSlug }: { mediaId?: string; alt: string; productNameOrSlug?: string }) {
  const fallbackSrc = getProductFallbackImage(productNameOrSlug);
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : fallbackSrc);
  
  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority
      className="object-cover object-center select-none pointer-events-none"
    />
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = params;
  const { data: dbProductData, isPending } = useProductBySlug(slug);
  const dbProduct = dbProductData?.data;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const addToCartMutation = useAddToCart();

  const { data: sessionData } = useSession();
  const { data: meData } = useMe();
  const user = sessionData?.data?.user || meData?.data;
  const isCustomer = user?.role === "customer" || !!user;
  const router = useRouter();

  const { data: wishlistRes } = useWishlist();
  const wishlistItems = wishlistRes?.data?.items || [];

  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // Handle Next.js loading state
  if (isPending) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-richCream flex flex-col justify-center items-center font-sans py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-burnishedGold animate-spin" />
            <p className="text-indianInk/60 text-xs tracking-wider uppercase font-semibold">
              Loading Product Details...
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Trigger 404 if product is not found in database
  if (!dbProduct) {
    notFound();
  }

  // Safe fallback to avoid typescript compile-time property lookup warnings during build
  const product = dbProduct || {
    id: "",
    name: "",
    slug: "",
    description: "",
    variants: [],
    price: 0,
    volume: "",
    region: "",
    texture: "",
    media_ids: [],
    sourcing: { region: "", story: "" }
  };
  const isDbAvailable = true;

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIndex] || null;

  const hasOffer = Boolean(selectedVariant?.has_offer);
  const effectivePrice = selectedVariant?.offer_price || selectedVariant?.effective_price || selectedVariant?.price || 0;
  const originalPrice = selectedVariant?.original_price || selectedVariant?.price || 0;
  const offerBadge = selectedVariant?.offer_badge || "SPECIAL OFFER";
  const discountAmount = selectedVariant?.discount_amount || (originalPrice - effectivePrice);
  const discountPercent = selectedVariant?.discount_percentage || 0;

  const volumeText = selectedVariant?.volume_weight || selectedVariant?.title || "Standard";
  const regionName = product.sourcing?.region || "Tamil Nadu";
  const descriptionText = product.description;

  const imageSrc = product.media_urls?.[0] || getProductFallbackImage(slug);

  // Check if we can interact with real DB cart additions
  const productId = product.id;
  const variantId = selectedVariant?.variant_id || null;
  const isCartDisabled = !productId || !variantId;

  const isWishlisted = variantId ? wishlistItems.some((item: any) => item.variant_id === variantId) : false;

  const handleToggleWishlist = () => {
    if (!user) {
      router.push(`/login?redirect=/products/${slug}`);
      return;
    }
    if (!productId || !variantId) return;

    if (isWishlisted) {
      removeFromWishlistMutation.mutate(variantId);
    } else {
      addToWishlistMutation.mutate({ productId, variantId });
    }
  };

  const handleAddToCart = () => {
    if (isCartDisabled) return;
    addToCartMutation.mutate(
      {
        payload: {
          product_id: productId,
          variant_id: variantId,
          quantity: quantity,
        },
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setSuccessMessage("Added to cart successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
          }
        },
      }
    );
  };

  if (isPending) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-richCream flex flex-col justify-center items-center font-sans py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-burnishedGold animate-spin" />
            <p className="text-indianInk/60 text-xs tracking-wider uppercase font-semibold">
              Loading Product Details...
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // --- JSON-LD Structured Data (Product + Breadcrumb) ---
  const jsonLdProduct = isDbAvailable
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.short_description || product.description,
        url: `${siteConfig.url}/products/${slug}`,
        image: product.media_urls?.[0] || `${siteConfig.url}/images/product-placeholder.jpg`,
        brand: { "@type": "Brand", name: siteConfig.name },
        sku: selectedVariant?.sku,
        offers: selectedVariant
          ? {
              "@type": "Offer",
              price: Number(selectedVariant.price).toFixed(2),
              priceCurrency: "INR",
              availability:
                selectedVariant.stock_status === "in_stock"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: `${siteConfig.url}/products/${slug}`,
              seller: { "@type": "Organization", name: siteConfig.name },
            }
          : undefined,
        ...(product.ratings?.review_count > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratings.average_rating.toFixed(1),
            reviewCount: product.ratings.review_count,
            bestRating: "5",
            worstRating: "1",
          },
        }),
      }
    : null;

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteConfig.url}/shop` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${siteConfig.url}/products/${slug}` },
    ],
  };

  return (
    <PublicLayout>
      {/* JSON-LD Structured Data */}
      {jsonLdProduct && <JsonLd data={jsonLdProduct} id="product-jsonld" />}
      <JsonLd data={jsonLdBreadcrumb} id="breadcrumb-jsonld" />
      <div
        className="min-h-screen text-indianInk py-12 md:py-20 border-b border-burnishedGold/15"
        style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Back button */}
          <div className="mb-8 animate-fade-up">
            <Link 
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-deodharForest hover:text-burnishedGold transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
            </Link>
          </div>

          {/* Main PDP Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
            
            {/* Left Column: Product Image */}
            <div className="lg:col-span-6 animate-fade-up">
              <div className="bg-white border border-burnishedGold/20 rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(25,25,25,0.04)] aspect-square relative select-none">
                <ProductDetailImage
                  mediaId={product.media_urls?.[0] || product.media_ids?.[0]}
                  alt={product.name}
                  productNameOrSlug={product.slug}
                />
              </div>
            </div>

            {/* Right Column: Product Info */}
            <div className="lg:col-span-6 flex flex-col gap-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-deodharForest text-richCream text-[9px] uppercase tracking-widest font-semibold rounded-[2px] shadow-sm border border-burnishedGold/25">
                    {regionName}
                  </span>
                  {hasOffer && (
                    <span className="px-2.5 py-1 bg-[#0F3D2E] text-white border border-[#C89B3C] text-[9px] uppercase tracking-widest font-bold rounded-[2px] shadow-sm">
                      🏷️ {offerBadge}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-deodharForest leading-tight">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-baseline gap-3 mt-1 font-sans">
                  <span className="text-3xl font-bold text-[#0F3D2E]">
                    {formatINR(effectivePrice)}
                  </span>
                  {hasOffer && originalPrice > effectivePrice && (
                    <>
                      <span className="text-xl text-indianInk/40 line-through">
                        {formatINR(originalPrice)}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold text-xs">
                        SAVE {formatINR(discountAmount)} {discountPercent > 0 ? `(${discountPercent}% OFF)` : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-burnishedGold/15" />

              <p className="font-sans text-sm text-indianInk/80 leading-relaxed">
                {descriptionText}
              </p>

              {/* Selector Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                {/* Size Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-indianInk/60 font-semibold block font-sans">
                    Available Volume
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {isDbAvailable && variants.length > 0 ? (
                      variants.map((v: any, idx: number) => {
                        const isSelected = idx === selectedVariantIndex;
                        const vHasOffer = Boolean(v.has_offer);
                        return (
                          <button
                            key={v.variant_id}
                            onClick={() => {
                              setSelectedVariantIndex(idx);
                              setQuantity(1); // Reset quantity to 1 when changing size
                            }}
                            className={`px-4 py-2.5 rounded-[4px] font-sans text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "border-gheeGold bg-[#FFFDF0] text-deodharForest shadow-sm font-black"
                                : "border-burnishedGold/15 hover:border-gheeGold/40 text-indianInk/70 bg-white"
                            }`}
                          >
                            <span>{v.volume_weight || v.title}</span>
                            {vHasOffer && (
                              <span className="px-1 py-0.5 bg-[#0F3D2E] text-white text-[8px] rounded uppercase font-bold">
                                SALE
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <button className="px-5 py-2.5 border-2 border-gheeGold bg-[#FFFDF0] text-deodharForest rounded-[4px] font-sans text-xs font-bold tracking-widest uppercase shadow-sm select-none cursor-default">
                        {volumeText}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-indianInk/60 font-semibold block font-sans">
                    Quantity
                  </span>
                  <div className="flex items-center border border-burnishedGold/25 rounded-[4px] w-32 bg-white overflow-hidden shadow-sm h-[42px]">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 hover:bg-richCream text-indianInk/70 transition-colors w-10 flex items-center justify-center border-r border-burnishedGold/15 h-full"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-grow text-center text-sm font-sans font-bold text-indianInk">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-2 hover:bg-richCream text-indianInk/70 transition-colors w-10 flex items-center justify-center border-l border-burnishedGold/15 h-full"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isCartDisabled || addToCartMutation.isPending}
                    className="flex-grow relative overflow-hidden group py-4 bg-deodharForest text-richCream rounded-[4px] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-transparent hover:border-gheeGold hover:shadow-[0_6px_20px_rgba(15,61,46,0.2)] disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-2"
                  >
                    {addToCartMutation.isPending ? (
                      <span>Adding to Cart...</span>
                    ) : (
                      <>
                        <span>Add to Cart</span>
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gheeGold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    disabled={isCartDisabled || addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
                    className={`px-5 py-4 rounded-[4px] border transition-all duration-300 flex items-center justify-center select-none ${
                      isWishlisted
                        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/70"
                        : "border-burnishedGold/25 hover:border-burnishedGold bg-white hover:bg-richCream/25 text-deodharForest"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 transition-all duration-300 ${isWishlisted ? "fill-current scale-110" : "text-burnishedGold"}`} />
                  </button>
                </div>

                {isCartDisabled && (
                  <p className="text-xs text-warmSaffron font-medium font-sans text-center mt-1.5 flex items-center justify-center gap-1.5">
                    Product setup is pending.
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs text-deodharForest font-semibold font-sans text-center mt-1.5">
                    {successMessage}
                  </p>
                )}
              </div>

              {/* Highlights & Trust Notes */}
              <div className="grid grid-cols-2 gap-4 border-t border-burnishedGold/15 pt-6 mt-4">
                <div className="flex items-center gap-2 text-xs font-sans text-indianInk/85">
                  <Check className="w-4 h-4 text-gheeGold shrink-0" />
                  <span>Carefully Selected</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-sans text-indianInk/85">
                  <Check className="w-4 h-4 text-gheeGold shrink-0" />
                  <span>Regional Source</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-sans text-indianInk/85">
                  <Check className="w-4 h-4 text-gheeGold shrink-0" />
                  <span>Batch Traceable</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-sans text-indianInk/85">
                  <Check className="w-4 h-4 text-gheeGold shrink-0" />
                  <span>Quality Checked</span>
                </div>
              </div>

              <div className="bg-[#FFFDF0] border-l-2 border-gheeGold p-4 rounded-r-[4px] mt-2 flex items-start gap-3 shadow-[0_2px_10px_rgba(217,164,65,0.03)]">
                <ShieldCheck className="w-5 h-5 text-deodharForest shrink-0 mt-0.5" />
                <p className="text-xs font-sans text-indianInk/70 leading-relaxed italic">
                  Every product is selected with responsibility and checked before reaching customers.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </PublicLayout>
  );
}