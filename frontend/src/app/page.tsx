"use client";

import PageBanner from "@/components/brand/page-banner";
import { OurProductsSection } from "@/components/brand/our-products-section";
import React, { useState, useEffect } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { useRouter } from "@/platform/navigation";
import PublicLayout from "@/components/layout/public-layout";
import { useProducts } from "@/hooks/use-products";
import { useSession } from "@/hooks/use-auth";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { formatINR, optimizeCloudinaryUrl, getProductFallbackImage } from "@/lib/utils";
import {
  ShieldCheck,
  ArrowRight,
  Compass,
  Check,
  Flame,
  Globe,
  Loader2,
  Heart,
  Handshake,
  Leaf,
  Award,
  Sprout,
  Package,
  Users,
} from "lucide-react";
import { useMediaAsset } from "@/hooks/use-media";

function HomeProductImage({ mediaId, alt, productNameOrSlug }: { mediaId?: string; alt: string; productNameOrSlug?: string }) {
  const fallbackSrc = getProductFallbackImage(productNameOrSlug);
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : fallbackSrc);

  return (
    <Image
      src={optimizeCloudinaryUrl(url, 600)}
      alt={alt}
      fill
      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] select-none pointer-events-none"
    />
  );
}

/* ── Leaf SVG Divider ─────────────────────────────── */
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

/* Crown / Leaf ornament divider */
function CrownDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-0.5 select-none text-[#C49A45] ${className}`}>
      <div className="w-8 h-[1.5px] bg-[#C49A45]" />
      <svg
        viewBox="18 8 64 42"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: '11px', width: 'auto' }}
      >
        <path d="M48 34C36 38 24 30 18 18C28 22 40 30 48 34Z" />
        <path d="M52 34C64 38 76 30 82 18C72 22 60 30 52 34Z" />
        <path d="M50 8C55 22 52 38 50 50C48 38 45 22 50 8Z" />
      </svg>
      <div className="w-8 h-[1.5px] bg-[#C49A45]" />
    </div>
  );
}

export default function HomePage() {
  const { data: productsData, isPending: isLoadingProducts } = useProducts({ is_featured: true, limit: 4 });
  const dbProducts = Array.isArray(productsData?.data) ? productsData.data : (productsData?.data?.products || []);
  const displayProducts = dbProducts.filter((product: any) => product.is_featured === true);

  const { data: sessionData } = useSession();
  const user = sessionData?.data?.user;
  const isCustomer = user?.role === "customer";
  const router = useRouter();

  const { data: wishlistRes } = useWishlist();
  const wishlistItems = wishlistRes?.data?.items || [];
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [scrollY, setScrollY] = useState(0);
  const [useParallax, setUseParallax] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleScroll = () => setScrollY(window.scrollY);
    const checkParallax = () => {
      const isLarge = window.innerWidth >= 1024;
      const prefersReduced = motionQuery.matches;
      setUseParallax(isLarge && !prefersReduced);
    };
    checkParallax();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkParallax);
    motionQuery.addEventListener("change", checkParallax);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkParallax);
      motionQuery.removeEventListener("change", checkParallax);
    };
  }, []);

  const parallaxStyle = useParallax
    ? { transform: `translateY(${scrollY * 0.12}px) scale(1.05)`, transformOrigin: "center" }
    : {};

  return (
    <PublicLayout>
      <div className="bg-[#FAF8F3] text-[#222222] min-h-screen">

        {/* ══════════════════════════════════════════════════
            HERO SECTION — Matching Image 1 Reference Design
        ══════════════════════════════════════════════════ */}
        <PageBanner variant="home" image="/images/home-and-about-page-panner.png" alt="Family sharing a meal with Bharath Delight products">
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-24 flex items-center py-14 sm:py-16 lg:py-20">
            <div className="max-w-[340px] sm:max-w-[400px] lg:max-w-[420px] xl:max-w-[440px] flex flex-col gap-4 sm:gap-5">

              {/* Heading — Exactly matching Image 1 */}
              <h1 className="font-serif text-[42px] sm:text-[50px] lg:text-[58px] xl:text-[64px] font-bold text-[#1E352F] leading-[1.08] tracking-[-0.015em] animate-fade-up">
                The Trust <br />
                Behind Every <br />
                <span className="text-[#B8860B]">Family Table</span>
              </h1>

              {/* Description — Formatted width matching Image 1 */}
              <p className="font-sans text-[13.5px] sm:text-[14.5px] lg:text-[15px] text-[#2C3E38] leading-[1.65] font-normal animate-fade-up animate-delay-100 max-w-[410px]">
                We believe every family deserves food they can trust. That's why Bharath Delight is committed to delivering products that bring together quality, authenticity, and care in every choice.
              </p>

              {/* Script tagline */}
              <div
                className="font-script text-[26px] sm:text-[30px] lg:text-[32px] text-[#1E352F] font-medium leading-none animate-fade-up animate-delay-200"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Authenticity in Every Delight.

              </div>

              {/* CTA Button — Rounded rectangle (rounded-lg) matching Image 1 */}
              <div className="animate-fade-up animate-delay-300 pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#16302B] hover:bg-[#23493E] text-white rounded-lg font-sans text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow group w-fit"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>

            </div>
          </div>
        </PageBanner>

        {/* ══════════════════════════════════════════════════
            OUR PRODUCTS — EVERYDAY ESSENTIALS
        ══════════════════════════════════════════════════ */}
        <OurProductsSection />


        {/* ══════════════════════════════════════════════════
            VALUES SECTION — 3-col cards
        ══════════════════════════════════════════════════ */}
        <section className="py-5 md:py-6 bg-[#FAF8F3] relative overflow-hidden border-b border-[#C49A45]/10">
          {/* Leaf decorations */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none hidden lg:block select-none">
            <Image src="/images/values-leaf-left.png?v=2" alt="" width={160} height={213} className="w-[120px] xl:w-[155px] h-auto object-contain" />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none hidden lg:block select-none">
            <Image src="/images/values-leaf-right.png?v=2" alt="" width={120} height={282} className="w-[90px] xl:w-[115px] h-auto object-contain" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Title */}
            <div className="text-center max-w-xl mx-auto mb-5">
              <h2 className="font-serif text-[30px] sm:text-[36px] font-bold text-[#1E352F]">
                The Values That Guide Us
              </h2>
              <LeafDivider className="mt-2" />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Purity */}
              <div className="group bg-white border border-[#EAEAEA] hover:border-[#C49A45]/40 rounded-xl p-8 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-[#EAEFE9] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#1E352F] transition-colors duration-300 shadow-sm border border-[#C49A45]/10">
                  <Leaf className="w-7 h-7 text-[#1E352F] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1E352F] mb-3">Purity</h3>
                <p className="font-sans text-[13px] text-[#666666] leading-relaxed">
                  Preserving the natural goodness and authenticity that families expect in every product.
                </p>
              </div>

              {/* Quality */}
              <div className="group bg-white border border-[#EAEAEA] hover:border-[#C49A45]/40 rounded-xl p-8 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-[#F9F3E5] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#1E352F] transition-colors duration-300 shadow-sm border border-[#C49A45]/10">
                  <Award className="w-7 h-7 text-[#C49A45] group-hover:text-[#C49A45] transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1E352F] mb-3">Quality</h3>
                <p className="font-sans text-[13px] text-[#666666] leading-relaxed">
                  Maintaining high standards across every product we offer with care and responsibility.
                </p>
              </div>

              {/* Trust */}
              <div className="group bg-white border border-[#EAEAEA] hover:border-[#C49A45]/40 rounded-xl p-8 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-[#EAEFE9] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#1E352F] transition-colors duration-300 shadow-sm border border-[#C49A45]/10">
                  <ShieldCheck className="w-7 h-7 text-[#1E352F] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1E352F] mb-3">Trust</h3>
                <p className="font-sans text-[13px] text-[#666666] leading-relaxed">
                  Building lasting relationships through reliability, transparency, and consistent delivery.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════
            OUR PROMISE — A Promise Built on Trust
        ══════════════════════════════════════════════════ */}
        <section className="py-10 md:py-14 bg-[#FAF8F3] border-b border-[#C49A45]/15 relative overflow-hidden">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-[#FFFDF9] border border-[#C49A45]/30 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-sm text-center relative overflow-hidden">
              {/* Subtle gold decorative top bar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-1 bg-gradient-to-r from-transparent via-[#C49A45] to-transparent" />

              {/* Tag line */}
              <div className="inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-[#C49A45] select-none mb-3">
                <div className="w-8 sm:w-12 h-px bg-[#C49A45]/60" />
                <span>OUR PROMISE</span>
                <div className="w-8 sm:w-12 h-px bg-[#C49A45]/60" />
              </div>

              {/* Main Heading */}
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-deodharForest leading-tight tracking-tight mb-4">
                A Promise Built on Trust
              </h2>

              <LeafDivider className="my-2" />

              {/* Lead narrative */}
              <div className="max-w-2xl mx-auto space-y-4 font-sans text-sm sm:text-base text-indianInk/85 leading-relaxed font-light mt-4 mb-8">
                <p>
                  At Bharath Delight, trust is not just a value we speak about—it is a commitment we strive to uphold every single day.
                </p>
                <p>
                  Everything we do is guided by a simple belief: families deserve pure, authentic products they can choose with complete confidence.
                </p>
              </div>

              {/* Trust quote block */}
              <div className="max-w-xl mx-auto p-4 rounded-xl bg-[#FAF8F3] border border-[#C49A45]/20 mb-8 text-[#1E352F] text-xs sm:text-sm font-serif italic">
                &ldquo;Pure ingredients, honest preparation, and timeless taste for the people who matter most.&rdquo;
              </div>

              {/* Action Button */}
              <div>
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1E352F] text-white rounded-full font-sans text-xs sm:text-sm font-semibold hover:bg-[#355E3B] hover:shadow-lg transition-all duration-300 group"
                >
                  <span>Learn About Our Promise</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════
            OUR PROMISE BANNER — dark green full-width
        ══════════════════════════════════════════════════ */}
        <section className="relative w-full border-b border-[#C49A45]/10 bg-[#1E352F] py-10 overflow-hidden">
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: "url('/images/promise-bg.png')",
              backgroundRepeat: "repeat",
            }}
          />

          <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">

              {/* Left: Shield + Text */}
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 lg:gap-8 max-w-3xl">
                <div className="shrink-0 w-20 h-20 lg:w-[100px] lg:h-[130px] relative">
                  <Image
                    src="/images/promise-shield-badge.png?v=3"
                    alt="Shield Badge"
                    fill
                    quality={90}
                    className="object-contain select-none pointer-events-none"
                    priority
                  />
                </div>
                <div className="space-y-2 text-white">
                  <h3 className="font-serif text-[24px] lg:text-[28px] font-bold text-white leading-tight">
                    Our Promise to Every Family
                  </h3>
                  <p className="font-sans text-[13px] lg:text-[14px] text-white/80 leading-relaxed">
                    We will never compromise on purity, quality, or trust.<br className="hidden sm:block" />
                    Every Bharath Delight product is created with the belief that families deserve products they can choose with complete confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FAMILY SECTION — Every Family Deserves the Best We Can Offer
        ══════════════════════════════════════════════════ */}
        <section className="py-4 md:py-5 bg-[#FAF8F3] border-b border-[#C49A45]/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#F6F2E9] border border-burnishedGold/25 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* Left: Family Photo */}
              <div className="lg:col-span-5 relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-burnishedGold/20">
                <Image
                  src="/images/deserves-best-family-hd.png"
                  alt="Bharath Delight Family Together"
                  fill
                  unoptimized
                  className="object-cover object-center"
                  priority
                />
              </div>

              {/* Right: Text & 4 Feature Badges */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="space-y-1">
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-deodharForest leading-tight">
                    Every Family Deserves
                  </h2>
                  <span className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#C49A45] leading-tight block">
                    the Best We Can Offer
                  </span>
                  <CrownDivider className="!justify-start my-2" />
                </div>

                <div className="space-y-2.5 font-sans text-xs sm:text-[14px] text-indianInk/85 font-light leading-relaxed">
                  <p>Behind every purchase is a family placing their trust in a brand.</p>
                  <p>We never take that trust for granted.</p>
                  <p>That is why every decision we make is guided by a simple belief: families deserve products made with care, honesty, and responsibility.</p>
                </div>

                {/* 4 Feature Badges Row with Vertical Dividers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-burnishedGold/30 pt-6 border-t border-burnishedGold/20 mt-6">

                  {/* Badge 1 */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 px-2 sm:px-4 py-2 sm:py-0">
                    <Sprout className="w-6 h-6 text-[#C49A45] stroke-[1.5]" />
                    <span className="font-sans font-bold text-xs text-deodharForest leading-snug">
                      Carefully <br /> Sourced
                    </span>
                  </div>

                  {/* Badge 2 */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 px-2 sm:px-4 py-2 sm:py-0">
                    <Package className="w-6 h-6 text-[#C49A45] stroke-[1.5]" />
                    <span className="font-sans font-bold text-xs text-deodharForest leading-snug">
                      Hygienically <br /> Packed
                    </span>
                  </div>

                  {/* Badge 3 */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 px-2 sm:px-4 py-2 sm:py-0">
                    <Award className="w-6 h-6 text-[#C49A45] stroke-[1.5]" />
                    <span className="font-sans font-bold text-xs text-deodharForest leading-snug">
                      Consistent <br /> Quality
                    </span>
                  </div>

                  {/* Badge 4 */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 px-2 sm:px-4 py-2 sm:py-0">
                    <Users className="w-6 h-6 text-[#C49A45] stroke-[1.5]" />
                    <span className="font-sans font-bold text-xs text-deodharForest leading-snug">
                      Made for <br /> Indian Homes
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════
            GROWING TRUST ACROSS EVERY HOME — CTA BANNER
        ══════════════════════════════════════════════════ */}
        <section className="py-4 md:py-5 bg-[#FAF8F3] border-b border-[#C49A45]/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#FAF6EE] border border-burnishedGold/25 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden">

              {/* Left: Text & Button */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="space-y-1">
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-deodharForest leading-tight">
                    Growing Trust Across
                  </h2>
                  <span className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#C49A45] leading-tight block">
                    Every Home
                  </span>
                  <div className="w-12 h-[2px] bg-[#C49A45] my-2" />
                </div>

                <p className="font-sans text-xs sm:text-[14.5px] text-indianInk/85 font-light leading-relaxed max-w-md">
                  We are building more than a food brand. We are building a relationship with families who value authenticity, quality, and trust.
                </p>

                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#0F3D2E] text-white rounded-full font-sans text-xs sm:text-sm font-semibold hover:bg-[#1E5240] hover:shadow-md transition-all duration-300 group"
                  >
                    <span>Explore Bharath Delight</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right: Product Lineup Jars Image */}
              <div className="lg:col-span-6 relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-sm">
                <Image
                  src="/images/promise-hero-jars.png"
                  alt="Bharath Delight Products Lineup Jars"
                  fill
                  unoptimized
                  className="object-cover object-center"
                />
              </div>

            </div>
          </div>
        </section>


      </div>
    </PublicLayout>
  );
}