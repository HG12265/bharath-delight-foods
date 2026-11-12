"use client";

import PageBanner from "@/components/brand/page-banner";
import { OurProductsSection } from "@/components/brand/our-products-section";
import React from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import PublicLayout from "@/components/layout/public-layout";
import { ArrowRight, Sparkles, Heart, Award, ShieldCheck, Users, Eye, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout hideFooter>
      <div className="bg-[#FAF9F6] text-indianInk min-h-screen font-sans selection:bg-deodharForest/10">

        {/* HEADER SECTION - A Brand Built for Families */}
        <PageBanner variant="about" image="/images/home-and-about-page-panner.png" alt="The Bharath Delight family at the table">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
            <div className="w-full md:w-[48%] text-left space-y-3 py-8 md:py-0">
              {/* Tag */}
              <div className="flex items-center gap-3 text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-[#C49A45] select-none">
                <span>ABOUT US</span>
                <div className="w-10 h-[1.5px] bg-[#C49A45]" />
              </div>

              <h1 className="font-serif text-[32px] sm:text-[50px] lg:text-[54px] font-bold text-deodharForest leading-[1.1] tracking-tight">
                A Brand Built <br />
                for Families
              </h1>

              {/* Balanced line-leaves-line divider */}
              <div className="flex items-center gap-3 py-1 select-none text-[#C49A45]">
                <div className="w-10 h-[1.5px] bg-[#C49A45]" />
                <svg viewBox="18 8 64 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ height: '11px', width: 'auto' }}>
                  <path d="M48 34C36 38 24 30 18 18C28 22 40 30 48 34Z" />
                  <path d="M52 34C64 38 76 30 82 18C72 22 60 30 52 34Z" />
                  <path d="M50 8C55 22 52 38 50 50C48 38 45 22 50 8Z" />
                </svg>
                <div className="w-10 h-[1.5px] bg-[#C49A45]" />
              </div>

              <div className="space-y-2.5 font-sans text-sm sm:text-[16px] text-indianInk/90 leading-relaxed font-light max-w-[460px]">
                <p>
                  Bharath Delight was created with a simple belief—that every family deserves access to products they can trust, every single day.
                </p>
                <p>
                  We believe that food is more than a daily necessity. It is part of family traditions, shared moments, celebrations, and memories. That is why our purpose goes beyond offering products; it is about creating confidence in every choice families make.
                </p>
              </div>
            </div>
          </div>
        </PageBanner>

        {/* OUR PRODUCTS — EVERYDAY ESSENTIALS */}
        <OurProductsSection />

        {/* VISION & MISSION SECTION - INTEGRATED CARD LAYOUT */}
        <section className="py-12 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col md:flex-row items-stretch gap-6 md:gap-0 relative">

              {/* Our Vision Column */}
              <div className="flex-1 flex items-start gap-5 text-left md:pr-8 md:border-r md:border-burnishedGold/25">
                <div className="w-16 h-16 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/20 shadow-sm">
                  <Eye className="w-8 h-8 text-warmIvory stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-xl font-bold text-deodharForest">
                    Our Vision
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-indianInk/85 leading-relaxed font-light">
                    To become one of India&apos;s most trusted food brands by consistently delivering products that families can rely on with confidence.
                  </p>
                </div>
              </div>

              {/* Our Mission Column */}
              <div className="flex-1 flex items-start gap-5 text-left md:pl-8 pt-6 md:pt-0">
                <div className="w-16 h-16 bg-[#C49A45] text-white rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/20 shadow-sm">
                  <Target className="w-8 h-8 text-white stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-xl font-bold text-[#C49A45]">
                    Our Mission
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-indianInk/85 leading-relaxed font-light">
                    To provide authentic, high-quality products that bring together trust, value, and everyday reliability for families across India.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* OUR STORY SECTION */}
        <section className="py-16 md:py-24 bg-[#FAF9F6] border-b border-burnishedGold/15 relative overflow-hidden">
          {/* Leaves Margins Watermark */}
          <div className="absolute left-0 top-1/3 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block select-none">
            <Image src="/images/values-leaf-left.png" alt="Leaves Left Decor" width={110} height={180} className="object-contain" />
          </div>
          <div className="absolute right-0 top-2/3 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block select-none">
            <Image src="/images/values-leaf-right.png" alt="Leaves Right Decor" width={110} height={220} className="object-contain" />
          </div>

          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

              {/* Left Column: Icon, Header, and Paragraphs */}
              <div className="space-y-6">

                {/* Heading and Book/Leaf circular icon */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-deodharForest rounded-full flex items-center justify-center text-[#C49A45] shrink-0 shadow-sm border border-burnishedGold/30">
                    {/* Custom Book SVG matching mockup */}
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-deodharForest tracking-tight">
                    Our Story
                  </h2>
                </div>

                <div className="space-y-4 text-left font-sans text-xs sm:text-[13.5px] lg:text-sm text-indianInk/85 leading-relaxed font-light">
                  <p className="font-serif text-sm sm:text-base font-medium text-deodharForest italic leading-relaxed">
                    Every family deserves food that brings not only nourishment to the table, but also peace of mind to the people gathered around it.
                  </p>
                  <p>
                    Bharath Delight was founded in 2026 in Tiruvannamalai with a simple yet heartfelt vision—to bring genuinely trustworthy food products into the homes of Indian families.
                  </p>
                  <p>
                    In today&apos;s world, concerns about food adulteration, unsafe ingredients, and misleading quality claims have become increasingly common. Families want to make the right choices, but finding products they can truly trust is not always easy. Bharath Delight was born from the belief that every family deserves better.
                  </p>
                  <p>
                    Rather than pursuing mass production, we choose to work closely with trusted manufacturing partners who share our values and commitment to excellence. Every product is carefully evaluated, undergoes strict quality checks, and must meet our standards before it reaches the hands of our customers. Because we believe that trust is built through consistency, care, and responsibility.
                  </p>
                </div>
              </div>

              {/* Right Column: Continuation Paragraphs */}
              <div className="space-y-4 text-left font-sans text-xs sm:text-[13.5px] lg:text-sm text-indianInk/85 leading-relaxed font-light lg:pt-[80px]">
                <p>
                  We also believe that every great product has a story that begins at its source. That is why we strive to bring products from regions celebrated for their authenticity, heritage, and craftsmanship. By doing so, we aim to preserve the unique character, tradition, and quality that make each product special.
                </p>
                <p>
                  The name Bharath Delight reflects the heart of our purpose. &ldquo;Bharath&rdquo; represents our nation, its rich traditions, and its diverse food heritage. &ldquo;Delight&rdquo; represents the joy, comfort, and confidence we hope to bring to every family through products that are pure, reliable, and thoughtfully chosen.
                </p>
                <p>
                  Our dream extends far beyond building another FMCG company. We aspire to create a brand that becomes a trusted part of family life—a brand people choose without hesitation, recommend with confidence, and welcome into their homes for generations to come.
                </p>
                <p>
                  As we continue to grow, our commitment remains unchanged. We will continue to uphold the values of quality, purity, and trust in everything we do while bringing the finest traditions of Indian food to families across the country.
                </p>
                <p>
                  Because food is more than what we eat. It is part of our memories, our celebrations, our traditions, and the moments we share with the people we love.
                </p>
                <p className="font-serif italic font-medium text-deodharForest text-xs sm:text-sm pt-1">
                  And when families can choose with confidence and enjoy every meal with happiness, that is the true delight Bharath Delight strives to create.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* WHY WE EXIST SECTION - HORIZONTAL BANNER LAYOUT */}
        <section className="py-12 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="relative bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl shadow-[0_2px_16px_rgba(15,61,46,0.03)] overflow-hidden min-h-[200px]">

              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/about-why-exist.png"
                  alt="Sunrise landscape representing heritage source"
                  fill
                  unoptimized
                  className="object-cover object-left"
                  priority
                />
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, #F6F2E9 0%, rgba(246,242,233,0.92) 28%, rgba(246,242,233,0.82) 60%, rgba(246,242,233,0.5) 100%)" }}
                />
              </div>

              {/* Main Content Row */}
              <div className="w-full p-6 lg:py-8 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 relative z-20">

                {/* Group Icon & Section Titles */}
                <div className="flex items-center gap-4 text-left min-w-[270px]">
                  <div className="w-16 h-16 bg-[#0F3D2E] rounded-full flex items-center justify-center text-white shrink-0 shadow-md border border-[#C49A45]/30">
                    <Users className="w-8 h-8 text-warmIvory stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-serif text-sm sm:text-base text-[#0F3D2E] block font-medium">
                      Why We Exist
                    </span>
                    <h3 className="font-serif text-2xl lg:text-[28px] font-bold text-[#0F3D2E] leading-snug tracking-tight">
                      More Than Products, <br />A Responsibility
                    </h3>
                  </div>
                </div>

                {/* Gold Vertical Divider Line */}
                <div className="hidden lg:block h-24 border-l-2 border-[#C49A45]/70 shrink-0 mx-2" />

                {/* Right Side: Content Paragraphs */}
                <div className="w-full lg:w-[48%] text-left space-y-3 font-sans text-xs sm:text-[13.5px] text-indianInk/85 font-light leading-relaxed">
                  <p>
                    We understand that every product purchased is placed on a family table.
                  </p>
                  <p>
                    That responsibility inspires us to maintain high standards, make thoughtful choices, and continuously work towards earning the trust of our customers.
                  </p>
                  <p>
                    For us, success is not measured only by growth, but by the confidence families place in the Bharath Delight name.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* WHAT WE BELIEVE SECTION */}
        <section className="py-12 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

            <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
              <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-[#C49A45] select-none">
                <span>WHAT WE BELIEVE</span>
                <div className="w-8 h-[1.5px] bg-[#C49A45]" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
                The Principles That Guide Us
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

              {/* Trust Before Everything */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 lg:p-8 flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="w-16 h-16 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/20 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-warmIvory stroke-[1.5]" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-deodharForest">
                    Trust Before Everything
                  </h3>
                  <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/80 leading-relaxed font-light">
                    We believe trust is the foundation of every lasting relationship.
                  </p>
                </div>
              </div>

              {/* Quality Without Compromise */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 lg:p-8 flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="w-16 h-16 bg-[#C49A45] text-white rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/20 shadow-sm">
                  <Award className="w-8 h-8 text-white stroke-[1.5]" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-deodharForest">
                    Quality Without Compromise
                  </h3>
                  <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/80 leading-relaxed font-light">
                    We never compromise on the standards that define our products.
                  </p>
                </div>
              </div>

              {/* Long-Term Relationships */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 lg:p-8 flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="w-16 h-16 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 border border-burnishedGold/20 shadow-sm">
                  <Users className="w-8 h-8 text-warmIvory stroke-[1.5]" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-deodharForest">
                    Long-Term Relationships
                  </h3>
                  <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/80 leading-relaxed font-light">
                    We aim to become a trusted part of households for generations.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* A NOTE FROM OUR FOUNDER SECTION */}
        <section className="py-12 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl overflow-hidden shadow-sm relative grid grid-cols-1 lg:grid-cols-[42%_58%] items-stretch">

              {/* Left Column: Founder Portrait */}
              <div className="relative w-full h-[360px] sm:h-[420px] lg:h-full min-h-[480px] overflow-hidden shrink-0 rounded-t-2xl lg:rounded-tr-none lg:rounded-l-2xl border-b lg:border-b-0 lg:border-r border-burnishedGold/15">
                <Image
                  src="/images/about-founder.jpeg"
                  alt="Bharath T - Founder of Bharath Delight"
                  fill
                  unoptimized
                  className="object-cover object-center"
                  priority
                />
              </div>

              {/* Right Column: Founder's letter */}
              <div className="p-6 sm:p-8 lg:p-12 text-left space-y-4 relative z-10 flex flex-col justify-between">
                {/* Background leaf watermark */}
                <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none hidden lg:block select-none">
                  <Image src="/images/values-leaf-right.png" alt="Leaves Decor" width={140} height={280} className="object-contain" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
                      A Note from Our Founder
                    </h3>
                    <div className="w-12 h-[1.5px] bg-[#C49A45]" />
                  </div>

                  <div className="space-y-3 font-sans text-xs sm:text-[13.5px] lg:text-sm text-indianInk/85 leading-relaxed font-light">
                    <p className="font-serif italic text-deodharForest text-sm sm:text-base font-medium">
                      Hello, I&apos;m Bharath T, the founder of Bharath Delight.
                    </p>
                    <p>
                      My journey began with a simple observation. Every day, families purchase food products with the hope that they are choosing something safe, authentic, and of good quality. Yet, many people often find it difficult to know which brands they can truly trust.
                    </p>
                    <p>
                      This made me think: Why shouldn&apos;t families have access to products they can choose with complete confidence?
                    </p>
                    <p>
                      With this belief, I started Bharath Delight.
                    </p>
                    <p>
                      My vision was not just to create another food brand, but to build a brand that stands for trust, quality, and authenticity. A brand that families can rely on for their everyday needs and feel confident bringing into their homes.
                    </p>
                    <p>
                      From the very beginning, my goal has been simple—to offer products that meet high standards while maintaining the values that matter most: purity, consistency, and responsibility. Every product we introduce is carefully selected with the customer in mind because I believe that trust is earned through every experience.
                    </p>
                    <p>
                      Bharath Delight is more than a business to me. It is a commitment to serving families with honesty and care, while building long-term relationships based on reliability and confidence.
                    </p>
                    <p>
                      We are still at the beginning of our journey, but our mission remains clear: to grow Bharath Delight into a trusted household name across India and become a brand that families proudly choose for generations.
                    </p>
                    <p>
                      Thank you for being a part of our story and supporting our journey.
                    </p>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="pt-4 space-y-1">
                  <span className="font-script text-3xl text-deodharForest font-semibold tracking-wide block leading-none">
                    Bharath T
                  </span>
                  <span className="font-sans text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#C49A45]">
                    Founder, Bharath Delight
                  </span>
                </div>

              </div>

            </div>
          </div>
        </section>


        {/* BOTTOM GREEN BANNER - GROWING WITH EVERY FAMILY WE SERVE */}
        <section className="bg-deodharForest text-richCream py-12 md:py-16 relative overflow-hidden border-t border-burnishedGold/20">
          {/* Left Leaf branch decoration */}
          <div className="absolute left-1 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 opacity-85 pointer-events-none select-none hidden sm:block">
            <Image src="/images/values-leaf-left.png?v=3" alt="Leaf Left Decor" width={160} height={220} unoptimized className="w-[120px] lg:w-[165px] h-auto object-contain" />
          </div>

          {/* Right Leaf branch decoration */}
          <div className="absolute right-1 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 opacity-85 pointer-events-none select-none hidden sm:block">
            <Image src="/images/values-leaf-right.png?v=3" alt="Leaf Right Decor" width={160} height={220} unoptimized className="w-[120px] lg:w-[165px] h-auto object-contain" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Growing with Every Family We Serve
            </h2>

            {/* Small leaves divider */}
            <div className="flex items-center justify-center gap-1 opacity-70">
              <div className="w-8 h-px bg-gheeGold" />
              <svg className="h-3.5 w-auto text-gheeGold" viewBox="0 0 100 60" fill="currentColor">
                <path d="M50 10C53 25 50 40 50 55C50 40 47 25 50 10Z" />
              </svg>
              <div className="w-8 h-px bg-gheeGold" />
            </div>

            <div className="space-y-2 font-sans text-xs sm:text-sm text-warmIvory/85 leading-relaxed font-light max-w-xl mx-auto">
              <p>
                As Bharath Delight grows, our purpose remains unchanged.
              </p>
              <p>
                To earn trust, deliver quality, and become a brand that families proudly choose for years to come.
              </p>
              <p className="font-serif italic font-medium text-gheeGold mt-4 text-[13px] sm:text-base tracking-wide">
                Because trust is earned one family at a time.
              </p>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
