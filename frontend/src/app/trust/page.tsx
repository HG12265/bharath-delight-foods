"use client";

import React from "react";
import Image from "@/platform/image";
import PublicLayout from "@/components/layout/public-layout";
import {
  Award,
  Sprout,
  Handshake,
  TrendingUp,
  Users,
  Calendar,
  ShieldCheck,
  Package,
} from "lucide-react";

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

export default function TrustPage() {
  return (
    <PublicLayout hideFooter>
      <div className="bg-[#FAF9F6] text-indianInk min-h-screen font-sans selection:bg-deodharForest/10">

        {/* ══════════════════════════════════════════════════
            HERO SECTION — A Promise Built on Trust (No Image)
        ══════════════════════════════════════════════════ */}
        <section className="relative w-full py-14 sm:py-18 lg:py-20 bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#FAF8F3] border-b border-[#C49A45]/20 overflow-hidden text-center">
          {/* Subtle gold top bar accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-1 bg-gradient-to-r from-transparent via-[#C49A45] to-transparent pointer-events-none" />

          {/* Subtle ambient luxury radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(196,154,69,0.06)_0%,_transparent_70%)] pointer-events-none" />

          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-3">
            {/* Tag line */}
            <div className="inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-[#C49A45] select-none">
              <div className="w-8 sm:w-12 h-[1.5px] bg-[#C49A45]/60" />
              <span>OUR PROMISE</span>
              <div className="w-8 sm:w-12 h-[1.5px] bg-[#C49A45]/60" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-deodharForest leading-tight tracking-tight">
              A Promise Built on Trust
            </h1>

            {/* Crown Divider */}
            <CrownDivider className="my-1.5" />

            <div className="space-y-2.5 font-sans text-xs sm:text-sm lg:text-[15px] text-indianInk/85 leading-relaxed font-light max-w-2xl mx-auto">
              <p>
                At Bharath Delight, trust is not just a value we speak about—it is a commitment we strive to uphold every single day.
              </p>
              <p>
                Everything we do is guided by a simple belief: families deserve pure, authentic products they can choose with complete confidence.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            WHAT WE PROMISE — 4 Cards Section
        ══════════════════════════════════════════════════ */}
        <section className="py-10 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

            {/* Centered Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-[#C49A45] select-none mb-1">
                <div className="w-8 h-[1.5px] bg-[#C49A45]" />
                <span>WHAT WE PROMISE</span>
                <div className="w-8 h-[1.5px] bg-[#C49A45]" />
              </div>
              <CrownDivider />
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Quality First",
                  desc: "We are committed to maintaining high standards across every product we offer, ensuring consistency, reliability, and customer confidence.",
                  icon: <Award className="w-6 h-6 text-warmIvory stroke-[1.5]" />,
                },
                {
                  title: "Purity Always",
                  desc: "We believe authenticity should never be compromised. Our focus remains on providing products that stay true to their intended quality and character.",
                  icon: <Sprout className="w-6 h-6 text-warmIvory stroke-[1.5]" />,
                },
                {
                  title: "Honest Relationships",
                  desc: "Trust is earned through actions. We aim to build long-term relationships with our customers through transparency, responsibility, and consistency.",
                  icon: <Handshake className="w-6 h-6 text-warmIvory stroke-[1.5]" />,
                },
                {
                  title: "Continuous Improvement",
                  desc: "As we grow, we will continue learning, improving, and raising our standards to better serve families across India.",
                  icon: <TrendingUp className="w-6 h-6 text-warmIvory stroke-[1.5]" />,
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20 mb-1">
                    {card.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-deodharForest">{card.title}</h3>
                  <CrownDivider />
                  <p className="font-sans text-xs sm:text-[13px] text-indianInk/85 font-light leading-relaxed pt-1">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            COMMITMENT SECTION — Left Landscape Photo & 3 Columns
        ══════════════════════════════════════════════════ */}
        <section className="py-10 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="relative bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl overflow-hidden shadow-sm">

              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/promise-vertical-landscape.png"
                  alt="Bharath Delight Golden Sunrise Fields"
                  fill
                  quality={90}
                  className="object-cover object-center"
                />
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, #F6F2E9 0%, rgba(246,242,233,0.92) 28%, rgba(246,242,233,0.82) 60%, rgba(246,242,233,0.5) 100%)" }}
                />
              </div>

              {/* 3 Commitment Columns */}
              <div className="relative z-20 p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-burnishedGold/30 items-start">

                {/* Column 1 */}
                <div className="space-y-3 text-left md:pr-6 lg:pr-8 pt-4 md:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                      <Users className="w-5 h-5 text-warmIvory stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest leading-tight">
                      Our Commitment to Families
                    </h3>
                  </div>
                  <div className="space-y-2 font-sans text-xs sm:text-[13px] text-indianInk/85 font-light leading-relaxed pt-1">
                    <p>Every product purchased represents a family&apos;s trust in our brand.</p>
                    <p>We never take that trust for granted.</p>
                    <p>That is why we remain committed to making thoughtful choices, maintaining quality standards, and continuously working towards delivering products that families can rely on.</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-3 text-left md:px-6 lg:px-8 pt-6 md:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                      <Calendar className="w-5 h-5 text-warmIvory stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest leading-tight">
                      Today and Tomorrow
                    </h3>
                  </div>
                  <div className="space-y-2 font-sans text-xs sm:text-[13px] text-indianInk/85 font-light leading-relaxed pt-1">
                    <p>As Bharath Delight expands its product range and reaches more homes, our values will remain unchanged.</p>
                    <p className="font-bold text-deodharForest">Purity. Quality. Trust.</p>
                    <p>These principles will continue to guide every decision we make and every product we introduce.</p>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-3 text-left md:pl-6 lg:pl-8 pt-6 md:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                      <ShieldCheck className="w-5 h-5 text-warmIvory stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest leading-tight">
                      A Promise for Generations
                    </h3>
                  </div>
                  <div className="space-y-2 font-sans text-xs sm:text-[13px] text-indianInk/85 font-light leading-relaxed pt-1">
                    <p>Our goal is not simply to grow as a brand.</p>
                    <p>Our goal is to become a trusted part of family life—a brand people choose with confidence, recommend with pride, and welcome into their homes for generations.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            BECAUSE TRUST MATTERS — Horizontal Banner Card
        ══════════════════════════════════════════════════ */}
        <section className="py-10 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">

              {/* Left Side: Icon & Title */}
              <div className="flex items-center gap-4 text-left min-w-[280px]">
                <div className="w-16 h-16 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <ShieldCheck className="w-8 h-8 text-warmIvory stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl lg:text-3xl font-bold text-deodharForest leading-tight">
                    Because Trust Matters
                  </h3>
                  <CrownDivider className="!justify-start" />
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden lg:block h-20 border-l-2 border-[#C49A45]/40 shrink-0 mx-2" />

              {/* Right Side: Text */}
              <div className="w-full lg:w-[50%] text-left space-y-1.5 relative z-10">
                <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/85 font-light leading-relaxed">
                  The trust families place in us is our greatest responsibility.
                </p>
                <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/85 font-light leading-relaxed">
                  And honoring that trust will always remain at the heart of <span className="font-bold text-[#C49A45]">Bharath Delight.</span>
                </p>
              </div>

              {/* Background Leaf Watermark */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block select-none">
                <Image src="/images/values-leaf-right.png" alt="Leaves Decor" width={140} height={260} className="object-contain" />
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            BOTTOM GREEN BANNER — Authenticity in Every Delight
        ══════════════════════════════════════════════════ */}
        <section className="bg-deodharForest text-richCream relative overflow-hidden border-t border-burnishedGold/20">

          {/* Top Misty Forest Section */}
          <div className="py-14 sm:py-16 relative overflow-hidden">
            {/* Background Forest Photo Overlay */}
            <div className="absolute inset-0 z-0 opacity-85 pointer-events-none select-none">
              <Image
                src="/images/promise-banner-clean.png"
                alt="Misty Mountain Forest Background"
                fill
                quality={90}
                className="object-cover object-center"
              />
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(15, 61, 46, 0.35) 0%, rgba(15, 61, 46, 0.55) 100%)"
                }}
              />
            </div>

            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 relative z-20 text-center space-y-3.5">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-wide">
                Authenticity in Every Delight.
              </h2>

              <CrownDivider className="my-2" />

              <p className="font-sans text-xs sm:text-sm text-warmIvory/90 leading-relaxed font-light max-w-xl mx-auto">
                We promise to bring you products that are pure, authentic, and thoughtfully chosen—today, tomorrow, and always.
              </p>
            </div>
          </div>

          {/* Bottom Solid Dark Green Bar with 4 Feature Columns & Vertical Dividers */}
          <div className="bg-[#07241B] border-t border-burnishedGold/25 py-5 relative z-20">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-burnishedGold/25">

              {/* Item 1 */}
              <div className="flex items-center gap-3.5 px-3 sm:px-4 py-3 sm:py-1">
                <Sprout className="w-7 h-7 text-[#C49A45] shrink-0 stroke-[1.5]" />
                <div className="text-left">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-white leading-tight">Authentic &amp; Pure</h4>
                  <p className="font-sans text-[11px] text-warmIvory/70 font-light leading-snug mt-0.5">
                    Products you can trust
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3.5 px-3 sm:px-6 py-3 sm:py-1">
                <ShieldCheck className="w-7 h-7 text-[#C49A45] shrink-0 stroke-[1.5]" />
                <div className="text-left">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-white leading-tight">Quality Assured</h4>
                  <p className="font-sans text-[11px] text-warmIvory/70 font-light leading-snug mt-0.5">
                    Standards we never compromise on
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3.5 px-3 sm:px-6 py-3 sm:py-1">
                <Package className="w-7 h-7 text-[#C49A45] shrink-0 stroke-[1.5]" />
                <div className="text-left">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-white leading-tight">Packed with Care</h4>
                  <p className="font-sans text-[11px] text-warmIvory/70 font-light leading-snug mt-0.5">
                    Handled responsibly at every step
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-3.5 px-3 sm:px-6 py-3 sm:py-1">
                <Users className="w-7 h-7 text-[#C49A45] shrink-0 stroke-[1.5]" />
                <div className="text-left">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-white leading-tight">Made for Families</h4>
                  <p className="font-sans text-[11px] text-warmIvory/70 font-light leading-snug mt-0.5">
                    Because families deserve the best
                  </p>
                </div>
              </div>

            </div>
          </div>

        </section>

      </div>
    </PublicLayout>
  );
}