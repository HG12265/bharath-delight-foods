"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter, useSearchParams } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-auth";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { formatINR, optimizeCloudinaryUrl, getProductFallbackImage } from "@/lib/utils";
import { Heart, Search, ChevronDown, SlidersHorizontal, X, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useMediaAsset } from "@/hooks/use-media";
import { Product } from "@/types";

/* ── Shared Helper Components ──────────────────────────── */

function ShopProductImage({ mediaId, alt, productNameOrSlug, index }: { mediaId?: string; alt: string; productNameOrSlug?: string; index: number }) {
  const fallbackSrc = getProductFallbackImage(productNameOrSlug);
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : fallbackSrc);
  
  return (
    <Image
      src={optimizeCloudinaryUrl(url, 600)}
      alt={alt}
      fill
      priority={index === 0}
      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] select-none pointer-events-none"
    />
  );
}

function ShopCategoryImage({
  mediaId,
  slug,
  alt,
}: {
  mediaId?: string;
  slug: string;
  alt: string;
}) {
  const fallbackSrc = CATEGORY_IMAGES[slug] || "/images/logo.png";
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl
    ? mediaId
    : (!isError && mediaRes?.success && mediaRes?.data?.public_url)
      ? mediaRes.data.public_url
      : fallbackSrc;

  return (
    <Image
      src={optimizeCloudinaryUrl(url, 600)}
      alt={alt}
      fill
      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
    />
  );
}

function LeafDivider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ""}`}>
      <div className="w-10 h-px bg-[#C49A45]/30" />
      <svg className="h-3.5 w-auto text-[#C49A45]" viewBox="0 0 100 60" fill="currentColor">
        <path d="M50 10C53 25 50 40 50 55C50 40 47 25 50 10Z" />
        <path d="M50 35C38 42 25 37 20 25C28 38 42 45 50 35Z" />
        <path d="M50 35C62 42 75 37 80 25C72 38 58 45 50 35Z" />
      </svg>
      <div className="w-10 h-px bg-[#C49A45]/30" />
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      <div className="w-8 h-px bg-[#C49A45]" />
      <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#C49A45] uppercase">{text}</span>
      <div className="w-8 h-px bg-[#C49A45]" />
    </div>
  );
}

function ShopLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center w-full">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-full max-w-[380px] bg-white border border-burnishedGold/20 rounded-lg overflow-hidden shadow-sm animate-pulse">
          <div className="w-full h-[240px] bg-burnishedGold/10" />
          <div className="p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-24 bg-burnishedGold/10 rounded" />
              <div className="h-5 w-12 bg-burnishedGold/10 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-burnishedGold/10 rounded" />
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-burnishedGold/10 rounded" />
              <div className="h-3 w-5/6 bg-burnishedGold/10 rounded" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-burnishedGold/10">
              <div className="h-6 w-16 bg-burnishedGold/10 rounded" />
              <div className="h-8 w-24 bg-burnishedGold/10 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Category card images ──────────────────────────────── */
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

const AVAILABLE_CATEGORIES = new Set(["pure-ghee", "ghee", "energy-bar"]);

const CATEGORY_DISPLAY: Record<string, { title: string; desc: string; iconPath: string }> = {
  "pure-ghee": {
    title: "Ghee Collection",
    desc: "Rich in tradition and cherished for generations, our ghee collection brings authentic taste and quality to everyday cooking.",
    iconPath: "M12 3v1m0 16v1m8.66-15.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m15.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  },
  "ghee": {
    title: "Ghee Collection",
    desc: "Rich in tradition and cherished for generations, our ghee collection brings authentic taste and quality to everyday cooking.",
    iconPath: "M12 3v1m0 16v1m8.66-15.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m15.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  },
  "pure-honey": {
    title: "Pure Honey",
    desc: "Naturally sourced golden honey with a rich aroma, smooth texture, and authentic sweetness for everyday wellness.",
    iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  "energy-bar": {
    title: "Energy Bar",
    desc: "A wholesome, nutrient-rich snack crafted with natural ingredients to provide quick energy and lasting nourishment anytime.",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  "jaggery": {
    title: "Traditional Sweeteners",
    desc: "Naturally inspired products that celebrate India's rich heritage of traditional sweetness.",
    iconPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  "traditional-sweeteners": {
    title: "Traditional Sweeteners",
    desc: "Naturally inspired products that celebrate India's rich heritage of traditional sweetness.",
    iconPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  "spices": {
    title: "Premium Spices",
    desc: "Carefully sourced ingredients that bring flavour, aroma, and authenticity to every meal.",
    iconPath: "M12 3v18m-6-6l6 6 6-6M6 9l6-6 6 6",
  },
  "spices-masalas": {
    title: "Premium Spices",
    desc: "Carefully sourced ingredients that bring flavour, aroma, and authenticity to every meal.",
    iconPath: "M12 3v18m-6-6l6 6 6-6M6 9l6-6 6 6",
  },
  "oils": {
    title: "Natural Oils",
    desc: "Everyday essentials selected to support modern family kitchens.",
    iconPath: "M12 22c4.97 0 9-2.69 9-6v-4c0-3.31-4.03-6-9-6S3 8.69 3 12v4c0 3.31 4.03 6 9 6z",
  },
  "natural-oils": {
    title: "Natural Oils",
    desc: "Everyday essentials selected to support modern family kitchens.",
    iconPath: "M12 22c4.97 0 9-2.69 9-6v-4c0-3.31-4.03-6-9-6S3 8.69 3 12v4c0 3.31 4.03 6 9 6z",
  },
};

/* ── Main Shop Content ─────────────────────────────────── */

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL values
  const rawCategory = searchParams.get("category") || "";
  const urlCategory = rawCategory === "ghee" ? "pure-ghee" : rawCategory;
  const urlSearch = searchParams.get("search") || "";
  const urlSort = searchParams.get("sort") || "featured";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);

  // States
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state page with URL page
  useEffect(() => {
    setPage(urlPage);
  }, [urlPage]);

  // Sync category with URL
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Sync input text with URL search
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Handle browser Back / Forward buttons without full page reloads
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setSelectedCategory(sp.get("category") || "");
      setSearchInput(sp.get("search") || "");
      setPage(parseInt(sp.get("page") || "1", 10));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch Categories
  const { data: categoriesRes } = useCategories();
  const categories = categoriesRes?.data || [];

  // Fetch Products
  const { data: productsRes, isPending: isLoadingProducts } = useProducts({
    category_slug: selectedCategory || undefined,
    search: urlSearch || undefined,
    sort: urlSort,
    page: page,
    limit: 12
  });

  // Current products to render: for page 1, always use productsRes.data.products directly when available
  const displayedProducts = (page === 1 && productsRes?.data?.products !== undefined)
    ? productsRes.data.products
    : productsList;

  // Handle accumulative list appending
  useEffect(() => {
    if (productsRes?.success && productsRes?.data) {
      const newProds = productsRes.data.products || [];
      if (productsRes.data.page === 1) {
        setProductsList(newProds);
      } else {
        setProductsList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newProds.filter((p) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
      }
    }
  }, [productsRes]);

  // Wishlist bindings
  const { data: sessionData } = useSession();
  const user = sessionData?.data?.user;
  const isCustomer = user?.role === "customer";
  const { data: wishlistRes } = useWishlist();
  const wishlistItems = wishlistRes?.data?.items || [];
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // URL updating helper (uses window.history.pushState so Next.js doesn't reset scroll to top in production)
  const updateUrl = (newParams: { category?: string; search?: string; sort?: string; page?: number }) => {
    const currentSearch = typeof window !== "undefined" ? window.location.search : searchParams.toString();
    const params = new URLSearchParams(currentSearch);
    
    if (newParams.category !== undefined) {
      if (newParams.category) params.set("category", newParams.category);
      else params.delete("category");
    }
    if (newParams.search !== undefined) {
      if (newParams.search) params.set("search", newParams.search.trim());
      else params.delete("search");
    }
    if (newParams.sort !== undefined) {
      if (newParams.sort && newParams.sort !== "featured") params.set("sort", newParams.sort);
      else params.delete("sort");
    }
    if (newParams.page !== undefined && newParams.page > 1) {
      params.set("page", newParams.page.toString());
    } else {
      params.delete("page");
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `/shop?${queryString}` : "/shop";
    router.replace(targetUrl, { scroll: false });
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateUrl({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const scrollToCatalog = () => {
    const doScroll = () => {
      const el = document.getElementById("product-catalog");
      if (el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    };

    doScroll();
    setTimeout(doScroll, 100);
    setTimeout(doScroll, 300);
  };

  // Auto-scroll to catalog if category param or hash is present on mount or URL change
  useEffect(() => {
    const handleScrollTarget = () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (urlCategory || hash === "#product-catalog" || hash === "#all-products" || hash === "#products") {
        scrollToCatalog();
      }
    };

    handleScrollTarget();
    const timer1 = setTimeout(handleScrollTarget, 150);
    const timer2 = setTimeout(handleScrollTarget, 450);

    const onHashChange = () => handleScrollTarget();
    window.addEventListener("hashchange", onHashChange);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [urlCategory]);

  const handleCategorySelect = (slug: string) => {
    setMobileFilterOpen(false);
    setSelectedCategory(slug);
    updateUrl({ category: slug });
  };

  const handleCategoryCardClick = (slug: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleCategorySelect(slug);
    scrollToCatalog();
  };

  const handleExploreAllCollections = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleCategorySelect("");
    scrollToCatalog();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl({ sort: e.target.value });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    updateUrl({ page: nextPage });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setMobileFilterOpen(false);
    setSelectedCategory("");
    updateUrl({ category: "", search: "" });
  };

  const totalProducts = productsRes?.data?.total_count || 0;
  const hasMore = productsRes?.data?.has_more || false;

  return (
    <div className="bg-[#FAF9F6] text-indianInk min-h-screen font-sans selection:bg-deodharForest/10">
      

      {/* ═══════════════════════════════════════════════════════
          PRODUCT CATEGORIES — "Something for Every Kitchen"
          ═══════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="py-16 bg-white border-b border-burnishedGold/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <SectionLabel text="OUR PRODUCT CATEGORIES" />
              <LeafDivider className="mb-3" />
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-deodharForest">
                Something for Every Kitchen
              </h2>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {categories.map((cat, idx) => {
                const title = cat.name;
                const desc = cat.description || "Carefully selected products for your kitchen.";

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryCardClick(cat.slug)}
                    className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Category Image */}
                    <div className="relative w-full h-[200px] overflow-hidden bg-richCream/40">
                      <ShopCategoryImage
                        mediaId={cat.image_id}
                        slug={cat.slug}
                        alt={title}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 bg-deodharForest rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[#C49A45]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <h3 className="font-serif text-base font-bold text-deodharForest">{title}</h3>
                      </div>
                      <p className="font-sans text-[11px] text-indianInk/70 leading-relaxed font-light mb-4 flex-grow">
                        {desc}
                      </p>

                      {/* CTA Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCategoryCardClick(cat.slug, e)}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-deodharForest text-white rounded-full font-sans text-[11px] font-semibold hover:bg-[#355E3B] transition-all duration-200 self-start mt-auto"
                      >
                        Explore Collection <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explore All Collections Button */}
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={handleExploreAllCollections}
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-deodharForest hover:bg-[#25423b] text-richCream font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-burnishedGold/30 group"
              >
                Explore All Collections
                <ArrowRight className="w-4 h-4 text-[#C49A45] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          PRODUCT CATALOG — Search/Filter/Sort + Grid
          ═══════════════════════════════════════════════════════ */}
      <section id="product-catalog" className="scroll-mt-20 py-16 bg-[#FAF9F6] border-b border-burnishedGold/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <SectionLabel text="OUR PRODUCTS" />
            <LeafDivider className="mb-3" />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-deodharForest">
              Pure. Authentic. Trusted.
            </h2>
            <p className="font-sans text-sm text-indianInk/70 mt-3 max-w-md mx-auto leading-relaxed">
              Carefully selected products that bring purity, tradition, and taste to your everyday life.
            </p>
          </div>

          {/* Toolbar (Search / Sort / Filters) */}
          <div className="bg-white border border-burnishedGold/15 rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search bar */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indianInk/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-burnishedGold/20 rounded-lg font-sans text-xs focus:outline-none focus:border-[#D9A441] text-indianInk transition-colors"
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indianInk/40 hover:text-indianInk"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full min-w-0 md:w-auto justify-between md:justify-end">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex md:hidden items-center gap-2 px-4 py-2 border border-burnishedGold/25 rounded-lg font-sans text-xs font-semibold text-deodharForest bg-[#FAF9F6] hover:bg-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>

              {/* Product count text */}
              <div className="text-[11px] font-sans font-semibold tracking-wider text-indianInk/50 uppercase">
                {displayedProducts.length > 0 ? `Showing ${displayedProducts.length} of ${totalProducts} products` : "0 products"}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={urlSort}
                  onChange={handleSortChange}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-[#FAF9F6] border border-burnishedGold/20 rounded-lg font-sans text-xs font-semibold text-deodharForest focus:outline-none focus:border-[#D9A441] cursor-pointer"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-deodharForest/60 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Category Chips */}
          <div className="md:hidden overflow-x-auto whitespace-nowrap pb-4 mb-4 -mx-4 px-4 scrollbar-none flex gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-all border ${
                !selectedCategory
                  ? "bg-deodharForest text-richCream border-deodharForest"
                  : "bg-white text-deodharForest border-burnishedGold/20 hover:border-burnishedGold/45"
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-all border ${
                  selectedCategory === cat.slug
                    ? "bg-deodharForest text-richCream border-deodharForest"
                    : "bg-white text-deodharForest border-burnishedGold/20 hover:border-burnishedGold/45"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            
            {/* Desktop Categories Sidebar */}
            <aside className="hidden md:block col-span-1 bg-white border border-burnishedGold/15 rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-lg font-bold text-deodharForest border-b border-burnishedGold/15 pb-3 mb-4">
                Categories
              </h2>
              <nav className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCategorySelect("")}
                  className={`w-full text-left px-3 py-2 text-xs font-sans font-semibold tracking-wider uppercase rounded-lg transition-colors ${
                    !selectedCategory
                      ? "bg-deodharForest text-richCream"
                      : "text-indianInk/75 hover:bg-[#FAF9F6] hover:text-deodharForest"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3 py-2 text-xs font-sans font-semibold tracking-wider uppercase rounded-lg transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-deodharForest text-richCream"
                        : "text-indianInk/75 hover:bg-[#FAF9F6] hover:text-deodharForest"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Product Grid Area */}
            <div className="col-span-1 md:col-span-3">
              {isLoadingProducts && displayedProducts.length === 0 ? (
                <ShopLoadingSkeleton />
              ) : displayedProducts.length === 0 ? (
                <div className="bg-white border border-burnishedGold/15 rounded-xl p-16 text-center shadow-sm max-w-xl mx-auto animate-fade-up">
                  <SlidersHorizontal className="w-12 h-12 text-burnishedGold/40 mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-bold text-deodharForest">
                    No products available.
                  </h3>
                  <p className="font-sans text-xs text-indianInk/60 mt-2 max-w-sm mx-auto leading-relaxed">
                    {selectedCategory
                      ? "No products found in this category. Add products from the Admin Panel or choose another category."
                      : "No products added yet. Products added from the Admin Panel will appear here."}
                  </p>
                  {selectedCategory && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-6 px-6 py-2.5 bg-deodharForest text-richCream rounded-full font-sans text-[10px] font-semibold tracking-widest uppercase transition-all duration-300 border border-transparent hover:border-gheeGold"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                    {displayedProducts.map((product, index) => {
                      const hasOffer = Boolean(product.has_active_offer);
                      const offerBadge = product.offer_badge;
                      const effectivePrice = parseFloat(String(product.min_price ?? product.display_price ?? product.variants?.[0]?.price ?? 0)) || 0;
                      const originalPrice = parseFloat(String(product.original_min_price ?? product.variants?.[0]?.price ?? 0)) || 0;
                      const volumeText = product.variants?.[0]?.volume_weight || product.variants?.[0]?.title || "";
                      const regionName = product.sourcing?.region || "Tamil Nadu";
                      const shortDesc = product.short_description;

                      const firstVariantId = product.variants?.[0]?.variant_id;
                      const isWishlisted = firstVariantId ? wishlistItems.some((item: any) => item.variant_id === firstVariantId) : false;

                      return (
                        <div
                          key={product.id || product.slug}
                          className="flex flex-col w-full max-w-[380px] bg-white border border-burnishedGold/20 rounded-xl overflow-hidden hover:border-gheeGold/40 hover:shadow-[0_12px_24px_rgba(25,25,25,0.06)] hover:-translate-y-1.5 transition-all duration-300 ease-out group shadow-[0_4px_12px_rgba(0,0,0,0.02)] motion-safe:animate-fade-up"
                          style={{ animationDelay: `${(index % 12) * 50}ms`, animationFillMode: "both" }}
                        >
                          {/* Product Image Container */}
                          <div className="w-full h-[240px] border-b border-burnishedGold/15 relative overflow-hidden select-none bg-gradient-to-br from-gheeGold/5 to-richCream/10">
                            <ShopProductImage
                              mediaId={product.media_urls?.[0] || product.media_ids?.[0]}
                              alt={product.name}
                              productNameOrSlug={product.slug}
                              index={index}
                            />

                            {/* Active Offer Badge */}
                            {hasOffer && offerBadge && (
                              <div className="absolute top-4 left-4 z-30 px-2.5 py-1 bg-[#0F3D2E] text-white border border-[#C89B3C] rounded-full text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-fade-in">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] animate-ping" />
                                <span>{offerBadge}</span>
                              </div>
                            )}

                            {/* Wishlist Heart Toggle Icon */}
                            {firstVariantId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!isCustomer) {
                                    router.push("/login");
                                    return;
                                  }
                                  if (isWishlisted) {
                                    removeFromWishlistMutation.mutate(firstVariantId);
                                  } else {
                                    addToWishlistMutation.mutate({ productId: product.id, variantId: firstVariantId });
                                  }
                                }}
                                className="absolute top-4 right-4 z-30 p-2 bg-white/95 backdrop-blur-sm hover:bg-white text-indianInk rounded-full border border-burnishedGold/15 shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group/heart"
                                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                                    isWishlisted
                                      ? "fill-red-600 text-red-600 scale-110"
                                      : "text-burnishedGold/80 group-hover/heart:text-red-500 group-hover/heart:fill-red-50/50"
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Content Area */}
                          <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-deodharForest text-richCream text-[8px] uppercase tracking-widest font-semibold rounded-[3px] shadow-sm border border-burnishedGold/25">
                                  {regionName}
                                </span>
                                <span className="text-[9px] text-indianInk/60 font-sans tracking-widest uppercase font-semibold bg-warmIvory/60 px-2 py-0.5 rounded border border-burnishedGold/10">
                                  {volumeText}
                                </span>
                              </div>

                              <h3 className="font-serif text-lg font-bold text-deodharForest leading-tight">
                                {product.name}
                              </h3>
                              <p className="font-sans text-[11px] text-indianInk/70 leading-relaxed line-clamp-2">
                                {shortDesc}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3.5 border-t border-burnishedGold/10">
                              <div className="flex flex-col font-sans">
                                <span className="text-[8px] uppercase tracking-wider text-indianInk/45">Starting from</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-sans text-xs font-bold text-[#0F3D2E]">
                                    {formatINR(effectivePrice)}
                                  </span>
                                  {hasOffer && originalPrice > effectivePrice && (
                                    <span className="font-sans text-[10px] text-indianInk/40 line-through">
                                      {formatINR(originalPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Link 
                                href={`/products/${product.slug}`}
                                className="relative overflow-hidden group/btn px-4 py-2 bg-deodharForest text-richCream rounded-full font-sans text-[9px] font-semibold tracking-widest uppercase transition-all duration-300 ease-out border border-transparent hover:border-gheeGold hover:shadow-[0_4px_10px_rgba(15,61,46,0.12)] hover:-translate-y-0.5 text-center focus-visible:ring-2 focus-visible:ring-burnishedGold outline-none flex items-center gap-1.5"
                              >
                                <span className="relative z-10">View Product</span>
                                <ArrowRight className="w-3 h-3 relative z-10" />
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gheeGold/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More Pagination */}
                  {hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingProducts}
                        className="relative overflow-hidden group inline-flex items-center gap-2 px-8 py-3.5 bg-deodharForest text-warmIvory border border-gheeGold/40 hover:border-gheeGold rounded-full font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-[0_4px_20px_rgba(217,164,65,0.2)] text-center focus-visible:ring-2 focus-visible:ring-burnishedGold outline-none disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isLoadingProducts ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">Load More Products</span>
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY BHARATH DELIGHT PRODUCTS — 3 Value Cards
          ═══════════════════════════════════════════════════════ */}
      <section className="py-14 bg-white border-b border-burnishedGold/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel text="WHY BHARATH DELIGHT PRODUCTS?" />
            <LeafDivider />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Trusted Selection",
                desc: "Products chosen with care and responsibility. We work only with partners who share our values.",
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
              },
              {
                title: "Consistent Quality",
                desc: "From sourcing to evaluation, we maintain strict standards to ensure consistency across every product.",
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                ),
              },
              {
                title: "Authentic Origins",
                desc: "Celebrating products known for their regional heritage, craftsmanship, and excellence.",
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#FAF9F6] border border-burnishedGold/15 rounded-xl p-6 flex items-start gap-4 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-12 h-12 ${i === 1 ? 'bg-[#C49A45] text-white' : 'bg-deodharForest text-[#C49A45]'} rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/15 shadow-sm`}>
                  {item.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base font-bold text-deodharForest">{item.title}</h3>
                  <p className="font-sans text-[11px] text-indianInk/75 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER — "More Products. Same Trust."
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-deodharForest text-richCream py-14 relative overflow-hidden border-t border-burnishedGold/20">
        {/* Background landscape */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none select-none">
          <Image
            src="/images/promise-landscape.png"
            alt="Landscape"
            fill
            unoptimized
            className="object-cover object-center"
          />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-wide">
            More Products. Same Trust.
          </h2>
          <LeafDivider />
          <div className="space-y-2 font-sans text-xs sm:text-sm text-warmIvory/85 leading-relaxed font-light max-w-xl mx-auto">
            <p>
              As Bharath Delight grows, our commitment remains unchanged—<br className="hidden sm:inline" />
              to bring families products they can choose with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM TRUST BADGES BAR
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF9F6] py-5 border-t border-burnishedGold/20">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-burnishedGold/20">
            {[
              { label: "Authentic & Pure", sublabel: "Products you can trust" },
              { label: "Quality Assured", sublabel: "Standards we never compromise on" },
              { label: "Packed with Care", sublabel: "Handled responsibly at every step" },
              { label: "Made for Families", sublabel: "Because families deserve the best" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <div className="w-12 h-12 bg-[#C49A45]/15 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-[#C49A45]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    {i === 0 && <path d="M9 12l2 2 4-4" />}
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-serif text-sm font-bold text-deodharForest leading-tight">{badge.label}</p>
                  <p className="font-sans text-[12px] text-indianInk/60 font-light mt-0.5 leading-snug">{badge.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer Overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-richCream h-full p-6 shadow-2xl flex flex-col justify-between animate-fade-in border-l border-burnishedGold/20">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-burnishedGold/15 pb-4">
                <h3 className="font-serif text-lg font-bold text-deodharForest">Filter Categories</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="text-indianInk/60 hover:text-indianInk">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect("")}
                  className={`w-full text-left px-4 py-2.5 text-xs font-sans font-semibold tracking-wider uppercase rounded-lg transition-colors ${
                    !selectedCategory
                      ? "bg-deodharForest text-richCream"
                      : "bg-white text-indianInk/75 border border-burnishedGold/15 hover:bg-[#FAF9F6]"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-sans font-semibold tracking-wider uppercase rounded-lg transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-deodharForest text-richCream"
                        : "bg-white text-indianInk/75 border border-burnishedGold/15 hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full py-3 bg-[#FAF9F6] border border-burnishedGold/20 text-deodharForest rounded-lg font-sans text-xs font-bold tracking-wider uppercase hover:bg-white"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <PublicLayout>
      <Suspense fallback={
        <div className="min-h-screen py-16 flex items-center justify-center bg-[#FAF9F6]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D9A441]" />
        </div>
      }>
        <ShopContent />
      </Suspense>
    </PublicLayout>
  );
}