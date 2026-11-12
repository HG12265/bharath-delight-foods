"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useCategories } from "@/hooks/use-categories";
import { useMediaAsset } from "@/hooks/use-media";
import { ChevronRight } from "lucide-react";

const CATEGORY_IMAGES: Record<string, string> = {
  "pure-ghee": "/images/category-ghee.png",
  "ghee": "/images/category-ghee.png",
  "jaggery": "/images/category-jaggery.png",
  "traditional-sweeteners": "/images/category-jaggery.png",
  "spices": "/images/category-spices.png",
  "spices-masalas": "/images/category-spices.png",
  "oils": "/images/category-oils.png",
  "natural-oils": "/images/category-oils.png",
  "pure-honey": "/images/category-jaggery.png",
  "energy-bar": "/images/category-more.png",
};

function CategoryCardImage({ mediaId, slug, alt }: { mediaId?: string; slug?: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc = (slug && CATEGORY_IMAGES[slug]) || "/images/category-ghee.png";
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  let url = isUrl
    ? mediaId
    : (!isError && mediaRes?.success && mediaRes?.data?.public_url)
      ? mediaRes.data.public_url
      : fallbackSrc;

  if (imgError) {
    url = fallbackSrc;
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      onError={() => setImgError(true)}
      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export function OurProductsSection() {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data || [];

  return (
    <section className="py-8 md:py-12 bg-white border-b border-[#C49A45]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

          {/* Left: Heading */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-sans text-[11px] font-bold tracking-[0.15em] text-[#C49A45] uppercase">Our Products</span>
              <div className="w-8 h-px bg-[#C49A45]" />
            </div>
            <h2 className="font-serif text-[32px] sm:text-[40px] font-bold text-[#1E352F] leading-tight">
              Everyday Essentials<br />for Every Home
            </h2>
            <div className="w-12 h-0.5 bg-[#C49A45]" />
            <p className="font-sans text-[14px] text-[#666666] leading-relaxed">
              From traditional favourites to everyday kitchen essentials, our products are thoughtfully selected to support the needs of modern families while preserving the values they cherish.
            </p>
            <div className="pt-2">
              <Link
                href="/shop#product-catalog"
                className="inline-flex items-center gap-2 text-[#1E352F] font-sans text-[13px] font-semibold hover:text-[#C49A45] transition-colors group"
              >
                View All Products
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Right: Category cards */}
          <div className="lg:col-span-8 overflow-x-auto pb-4 scrollbar-thin">
            {categories.length > 0 ? (
              <div className="flex gap-5 min-w-max">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}#product-catalog`}
                    className="group block w-[170px] sm:w-[200px] bg-white rounded-2xl overflow-hidden border-2 border-[#C49A45]/40 hover:border-[#C49A45] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer relative"
                  >
                    <div className="relative w-full aspect-square overflow-hidden bg-[#FAF8F3]">
                      <CategoryCardImage mediaId={cat.image_id} slug={cat.slug} alt={cat.name} />
                      <span className="absolute top-2.5 right-2.5 bg-[#1E352F]/90 backdrop-blur-sm text-[#93C572] border border-[#93C572]/40 text-[9.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#93C572] animate-pulse" />
                        Available
                      </span>
                    </div>
                    <div className="py-3 px-3 text-center border-t border-[#EAEAEA] bg-white group-hover:bg-[#FFFDF9] transition-colors">
                      <span className="font-serif text-[14px] font-bold text-[#1E352F] group-hover:text-[#C49A45] transition-colors block">
                        {cat.name}
                      </span>
                      <span className="text-[11px] font-sans font-semibold text-[#2E7D32] mt-0.5 inline-flex items-center gap-0.5">
                        Explore Now &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 px-6 text-center bg-white/70 rounded-2xl border border-dashed border-[#C49A45]/30">
                <p className="font-serif text-sm font-bold text-[#1E352F]">No Categories Added Yet</p>
                <p className="font-sans text-[11px] text-[#666666] mt-0.5">Categories added from the Admin Panel will appear here.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
