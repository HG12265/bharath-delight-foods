"use client";

import React from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import AccountShell from "@/components/features/account/account-shell";
import { getProductFallbackImage } from "@/lib/utils";
import { useOrders } from "@/hooks/use-orders";
import { 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  Star, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ReviewsPage() {
  const { data: ordersData, isPending, isError } = useOrders();
  const orders = ordersData?.data || [];

  // Filter delivered orders
  const deliveredOrders = orders.filter((o) => o.fulfillment_status === "delivered");

  // Extract unique items that have been delivered to the customer
  const uniqueDeliveredItemsMap = new Map<string, { product_name: string, variant_title: string }>();
  
  deliveredOrders.forEach((order) => {
    order.items.forEach((item) => {
      // Map key by product ID to avoid duplicates
      uniqueDeliveredItemsMap.set(item.product_id, {
        product_name: item.product_name,
        variant_title: item.variant_title
      });
    });
  });

  const deliveredItems = Array.from(uniqueDeliveredItemsMap.values());

  // Helper to map product names to correct slug paths
  const getProductSlug = (name: string) => {
    if (name.toLowerCase().includes("rasipuram")) return "rasipuram-ghee";
    return "uthukuli-ghee";
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

          {isPending ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-burnishedGold animate-spin" />
              <p className="text-[10px] text-indianInk/50 uppercase tracking-widest font-semibold">
                Finding eligible items...
              </p>
            </div>
          ) : isError ? (
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
                const slug = getProductSlug(item.product_name);
                const imageSrc = (item as any).image_url || (item as any).media_urls?.[0] || getProductFallbackImage(item.product_name);

                return (
                  <div 
                    key={index}
                    className="border border-burnishedGold/10 rounded-lg bg-white p-4 flex gap-4 items-center shadow-xs hover:border-burnishedGold/25 transition-all duration-200"
                  >
                    <div className="relative w-14 h-14 rounded border border-burnishedGold/10 overflow-hidden bg-richCream/10 shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.product_name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="font-serif text-sm font-bold text-deodharForest truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-[10px] text-indianInk/55 font-sans tracking-wide uppercase">
                        Size: {item.variant_title}
                      </p>
                      
                      <Link
                        href={`/products/${slug}#reviews`}
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-widest text-burnishedGold hover:text-deodharForest transition-colors mt-2"
                      >
                        <MessageSquare className="w-3 h-3 mr-0.5 text-gheeGold" /> Write Review <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </AccountShell>
  );
}
