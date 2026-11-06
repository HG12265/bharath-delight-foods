"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import AccountShell from "@/components/features/account/account-shell";
import { getProductFallbackImage } from "@/lib/utils";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useMyReviews, useSubmitReview } from "@/hooks/use-reviews";
import { 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  Star, 
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  ExternalLink,
  ThumbsUp
} from "lucide-react";

interface DeliveredReviewItem {
  product_id: string;
  order_id: string;
  product_name: string;
  variant_title: string;
  product_slug: string;
  image_url: string;
  isReviewed: boolean;
  myReview?: any;
}

export default function ReviewsPage() {
  const { data: ordersData, isPending: isOrdersPending, isError: isOrdersError } = useOrders();
  const { data: productsData } = useProducts();
  const { data: myReviewsData, isPending: isReviewsPending } = useMyReviews();
  const submitReviewMutation = useSubmitReview();

  const orders = ordersData?.data || [];
  const products = productsData?.data?.products || [];
  const myReviews = myReviewsData?.data || [];

  // Filter delivered orders
  const deliveredOrders = orders.filter((o) => o.fulfillment_status === "delivered");

  // Extract unique items that have been delivered to the customer
  const uniqueDeliveredItemsMap = new Map<string, DeliveredReviewItem>();
  
  deliveredOrders.forEach((order) => {
    const orderId = String(order.id || (order as any)._id);
    (order.items || []).forEach((item) => {
      if (!item.product_id) return;

      // Find matching live product in catalog for accurate Cloudinary media & slug
      const liveProduct = products.find(
        (p) => p.id === item.product_id || p.name.trim().toLowerCase() === item.product_name.trim().toLowerCase()
      );

      const existingReview = myReviews.find((r) => r.product_id === item.product_id);

      // Determine correct slug (never use hardcoded outdated slugs)
      const correctSlug = 
        liveProduct?.slug || 
        item.product_slug || 
        (item.product_name.toLowerCase().includes("rasipuram") 
          ? "rasipuram-pure-ghee" 
          : "uthukuli-pure-cow-ghee");

      // Determine correct image URL: prioritize live Cloudinary product media
      const resolvedImage = 
        liveProduct?.media_urls?.[0] || 
        item.image_url || 
        (item as any).media_urls?.[0] || 
        getProductFallbackImage(item.product_name);

      if (!uniqueDeliveredItemsMap.has(item.product_id)) {
        uniqueDeliveredItemsMap.set(item.product_id, {
          product_id: item.product_id,
          order_id: orderId,
          product_name: liveProduct?.name || item.product_name,
          variant_title: item.variant_title || "Standard",
          product_slug: correctSlug,
          image_url: resolvedImage,
          isReviewed: Boolean(existingReview),
          myReview: existingReview,
        });
      }
    });
  });

  const deliveredItems = Array.from(uniqueDeliveredItemsMap.values());

  // Review Modal State
  const [activeModalItem, setActiveModalItem] = useState<DeliveredReviewItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const openReviewModal = (item: DeliveredReviewItem) => {
    setActiveModalItem(item);
    setRating(5);
    setHoverRating(0);
    setTitle("");
    setComment("");
    setFormError("");
    setFormSuccess(false);
  };

  const closeReviewModal = () => {
    setActiveModalItem(null);
    setFormError("");
    setFormSuccess(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    if (title.trim().length < 2) {
      setFormError("Please enter a review title (at least 2 characters).");
      return;
    }
    if (comment.trim().length < 5) {
      setFormError("Please enter your detailed experience (at least 5 characters).");
      return;
    }

    setFormError("");

    try {
      await submitReviewMutation.mutateAsync({
        product_id: activeModalItem.product_id,
        order_id: activeModalItem.order_id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setFormSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.";
      setFormError(msg);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return "1 Star - Needs Improvement";
      case 2: return "2 Stars - Fair Quality";
      case 3: return "3 Stars - Good & Natural";
      case 4: return "4 Stars - Very Good & Fragrant";
      case 5: return "5 Stars - Exceptional Aroma & Granularity";
      default: return "";
    }
  };

  return (
    <AccountShell 
      title="Product Reviews" 
      description="Write feedback on purchased ghee variants to help other buyers choose verified products."
    >
      <div className="space-y-8 animate-fade-up">
        
        {/* GUIDANCE CARD */}
        <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-lg p-5 flex flex-col md:flex-row gap-5 items-start">
          <div className="w-10 h-10 bg-deodharForest/5 border border-burnishedGold/15 rounded-full flex items-center justify-center shrink-0 text-deodharForest">
            <Sparkles className="w-5 h-5 text-gheeGold" />
          </div>
          <div className="space-y-2 font-sans text-xs sm:text-sm">
            <h4 className="font-serif text-base font-bold text-deodharForest">
              Review Guidelines
            </h4>
            <p className="text-indianInk/65 leading-relaxed">
              We appreciate honest customer feedback. When writing reviews, focus on the aroma, texture (granularity), and purity of our slow-simmered ghee. Reviews from confirmed accounts appear automatically with a <span className="font-semibold text-deodharForest">Verified Purchase</span> badge.
            </p>
            <div className="flex gap-4 pt-1 font-bold text-[10px] uppercase tracking-wider text-burnishedGold">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gheeGold fill-gheeGold" /> Star Rating</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" /> Verified tag</span>
            </div>
          </div>
        </div>

        {/* DELIVERED ITEMS SECTION */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-deodharForest border-b border-burnishedGold/10 pb-2">
            Your Delivered Purchases
          </h3>

          {isOrdersPending ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-burnishedGold animate-spin" />
              <p className="text-[10px] text-indianInk/50 uppercase tracking-widest font-semibold">
                Finding eligible items...
              </p>
            </div>
          ) : isOrdersError ? (
            <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-xs font-sans rounded flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to search purchased items. Please reload.</span>
            </div>
          ) : deliveredItems.length === 0 ? (
            <div className="p-8 border border-dashed border-burnishedGold/15 rounded-lg text-center space-y-4">
              <p className="text-xs text-indianInk/60 font-sans leading-relaxed max-w-sm mx-auto">
                No delivered items found. Once your pending orders are shipped and marked delivered by the courier, you can review them here.
              </p>
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1 px-4 py-2 border border-deodharForest/20 hover:border-deodharForest text-deodharForest font-sans text-xs font-bold tracking-widest uppercase rounded-[4px] transition-colors"
              >
                Check Order Status <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deliveredItems.map((item, index) => {
                return (
                  <div 
                    key={index}
                    className="border border-burnishedGold/10 rounded-lg bg-white p-4 flex gap-4 items-center shadow-xs hover:border-burnishedGold/25 transition-all duration-200"
                  >
                    <div className="relative w-16 h-16 rounded border border-burnishedGold/15 overflow-hidden bg-richCream/10 shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="font-serif text-sm font-bold text-deodharForest truncate" title={item.product_name}>
                        {item.product_name}
                      </h4>
                      <p className="text-[10px] text-indianInk/55 font-sans tracking-wide uppercase">
                        Size: {item.variant_title}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {item.isReviewed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Reviewed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReviewModal(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider text-burnishedGold hover:text-deodharForest transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 mr-0.5 text-gheeGold" /> Write Review <ChevronRight className="w-3 h-3" />
                          </button>
                        )}

                        <Link
                          href={`/products/${item.product_slug}#reviews`}
                          className="inline-flex items-center gap-1 text-[10px] font-sans text-indianInk/50 hover:text-deodharForest transition-colors"
                          title="View Product Page"
                        >
                          View Store Page <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SUBMITTED REVIEWS SECTION */}
        {myReviews.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-burnishedGold/15">
            <h3 className="font-serif text-lg font-bold text-deodharForest flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-gheeGold" /> Your Submitted Reviews
            </h3>

            <div className="space-y-3">
              {myReviews.map((rev: any) => {
                const isApproved = rev.is_approved || rev.moderation_status === "approved";
                const isPending = rev.moderation_status === "pending";

                return (
                  <div 
                    key={rev.id || rev._id}
                    className="border border-burnishedGold/15 rounded-lg bg-[#FAF9F6] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating 
                                ? "text-gheeGold fill-gheeGold" 
                                : "text-gray-300"
                            }`} 
                          />
                        ))}
                        <span className="font-serif text-xs font-bold text-deodharForest ml-2">
                          {rev.title}
                        </span>
                      </div>

                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Published on Store
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Admin Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          Under Review
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-indianInk/75 font-sans leading-relaxed">
                      {rev.comment}
                    </p>

                    <div className="text-[10px] text-indianInk/45 font-sans pt-1">
                      Submitted on {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* WRITE REVIEW MODAL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-burnishedGold/25 rounded-lg max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-burnishedGold/15 pb-4">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-deodharForest">
                  Write Product Review
                </h3>
                <p className="text-xs text-indianInk/60 font-sans">
                  Share your experience with fellow Bharath Delight buyers.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="text-indianInk/50 hover:text-deodharForest transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Preview */}
            <div className="flex items-center gap-3 bg-richCream/20 border border-burnishedGold/15 p-3 rounded">
              <div className="relative w-12 h-12 rounded border border-burnishedGold/20 overflow-hidden bg-white shrink-0">
                <Image
                  src={activeModalItem.image_url}
                  alt={activeModalItem.product_name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="font-serif text-sm font-bold text-deodharForest truncate">
                  {activeModalItem.product_name}
                </div>
                <div className="text-[10px] text-indianInk/60 uppercase font-sans">
                  Variant: {activeModalItem.variant_title} • Verified Order
                </div>
              </div>
            </div>

            {formSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif text-base font-bold text-deodharForest">
                    Review Submitted Successfully!
                  </h4>
                  <p className="text-xs text-indianInk/65 font-sans max-w-xs mx-auto leading-relaxed">
                    Thank you for your valuable feedback. Your review has been recorded with a Verified Purchase badge and will appear on the store shortly.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="px-6 py-2 bg-deodharForest text-white text-xs font-sans font-semibold rounded uppercase tracking-wider hover:bg-deodharForest/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Rating Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-bold text-deodharForest block">
                    Your Overall Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isHovered = hoverRating >= starVal;
                      const isSelected = !hoverRating && rating >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-burnishedGold hover:scale-110 transition-transform focus:outline-hidden"
                          aria-label={`${starVal} Star`}
                        >
                          <Star 
                            className={`w-7 h-7 ${
                              isHovered || isSelected 
                                ? "text-gheeGold fill-gheeGold" 
                                : "text-gray-300"
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] font-sans text-burnishedGold font-semibold">
                    {getRatingLabel(hoverRating || rating)}
                  </p>
                </div>

                {/* Review Title */}
                <div className="space-y-1">
                  <label htmlFor="review-title" className="text-xs font-sans font-bold text-deodharForest block">
                    Headline / Summary *
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Traditional aroma and authentic granular texture"
                    maxLength={100}
                    className="w-full text-xs font-sans px-3 py-2 border border-burnishedGold/25 rounded focus:border-deodharForest focus:outline-hidden bg-white text-deodharForest"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-indianInk/40 font-sans">
                    <span>At least 2 characters</span>
                    <span>{title.length}/100</span>
                  </div>
                </div>

                {/* Detailed Comment */}
                <div className="space-y-1">
                  <label htmlFor="review-comment" className="text-xs font-sans font-bold text-deodharForest block">
                    Detailed Review *
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe the aroma, taste, clarity, texture or how it elevated your cooking..."
                    maxLength={1000}
                    className="w-full text-xs font-sans px-3 py-2 border border-burnishedGold/25 rounded focus:border-deodharForest focus:outline-hidden bg-white text-deodharForest leading-relaxed resize-none"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-indianInk/40 font-sans">
                    <span>At least 5 characters</span>
                    <span>{comment.length}/1000</span>
                  </div>
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-burnishedGold/15">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    disabled={submitReviewMutation.isPending}
                    className="px-4 py-2 border border-gray-300 text-indianInk/70 text-xs font-sans font-semibold rounded hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitReviewMutation.isPending}
                    className="px-6 py-2 bg-deodharForest hover:bg-deodharForest/90 text-white text-xs font-sans font-bold rounded uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitReviewMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-burnishedGold" />
                    )}
                    <span>{submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </AccountShell>
  );
}
