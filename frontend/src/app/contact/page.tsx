"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import PublicLayout from "@/components/layout/public-layout";
import contactService from "@/services/contact-service";
import {
  PhoneCall,
  Briefcase,
  Headphones,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Handshake,
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

/* Shared Input Style */
const inputCls = (hasError: boolean) =>
  `w-full px-4 py-2.5 bg-white text-[#222222] border rounded-xl font-sans text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] ${hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-burnishedGold/25"
  }`;

export default function ContactPage() {
  const supportPhone2 = "+91 91501 41007";
  const supportEmail = "bharathdelightfoods@gmail.com";
  const businessEmail = "bharathdelightfoods@gmail.com";
  const supportHelpEmail = "bharathdelightfoods@gmail.com";

  const [fullName, setFullName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    else if (fullName.trim().length < 2) errors.fullName = "Name must be at least 2 characters";

    const cleanEmail = email.trim();
    if (!cleanEmail) errors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.email = "Please enter a valid email address";

    const cleanPhone = phoneVal.trim().replace(/\s+/g, "");
    if (!cleanPhone) errors.phone = "Phone number is required";
    else if (!(/^[6-9]\d{9}$/.test(cleanPhone) || /^\+91[6-9]\d{9}$/.test(cleanPhone))) errors.phone = "Please enter a valid 10-digit Indian phone number";

    if (!message.trim()) errors.message = "Message cannot be empty";
    else if (message.trim().length < 10) errors.message = "Message must be at least 10 characters";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (validationErrors[field]) setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    switch (field) {
      case "fullName": setFullName(value); break;
      case "phone": setPhoneVal(value); break;
      case "email": setEmail(value); break;
      case "subject": setSubject(value); break;
      case "message": setMessage(value); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setFormError("");
    try {
      await contactService.submitInquiry({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phoneVal.trim(),
        inquiry_type: subject.trim() || "General Inquiry",
        message: message.trim(),
      });
      setIsSuccess(true);
      setFullName(""); setEmail(""); setPhoneVal(""); setSubject(""); setMessage("");
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Something went wrong. Please try again or email us directly.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-[#FAF9F6] text-indianInk min-h-screen font-sans selection:bg-deodharForest/10">

        {/* ══════════════════════════════════════════════════
            HERO SECTION — Contact Us (No Image)
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
              <span>CONTACT US</span>
              <div className="w-8 sm:w-12 h-[1.5px] bg-[#C49A45]/60" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-deodharForest leading-tight tracking-tight">
              We&apos;d Love to Hear From You
            </h1>

            {/* Crown Divider */}
            <CrownDivider className="my-1.5" />

            <div className="space-y-2 font-sans text-xs sm:text-sm lg:text-[15px] text-indianInk/85 leading-relaxed font-light max-w-2xl mx-auto">
              <p>
                Whether you have a question, feedback, partnership enquiry, or simply want to learn more about Bharath Delight, we&apos;re here to help.
              </p>
              <p>
                Our team will be happy to assist you and your family.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            4 INFO CARDS SECTION — Reduced Spacing & Compact Layout
        ══════════════════════════════════════════════════ */}
        <section className="py-8 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Card 1: Get in Touch */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-all">
                <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <PhoneCall className="w-6 h-6 text-warmIvory stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest">Get in Touch</h3>
                <CrownDivider />
                <div className="space-y-2 text-xs text-indianInk/85 font-light text-left w-full pt-1">
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Phone</span>

                    <a href="tel:+919150141007" className="hover:text-[#C49A45] transition-colors block">{supportPhone2}</a>
                  </div>
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Email</span>
                    <span className="break-all">{supportEmail}</span>
                  </div>
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Address</span>
                    <span className="leading-relaxed">Bharath Delight Foods,<br />Adiannamalai, Tiruvannamalai,<br />606604, Tamil Nadu, India</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Business Enquiries */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-all">
                <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <Briefcase className="w-6 h-6 text-warmIvory stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest">Business Enquiries</h3>
                <CrownDivider />
                <div className="space-y-2.5 text-xs text-indianInk/85 font-light text-left w-full pt-1">
                  <p className="leading-relaxed">
                    For distribution opportunities, retail partnerships, bulk orders, and business collaborations, please reach out to us.
                  </p>
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Email</span>
                    <span className="break-all">{businessEmail}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Customer Support */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-all">
                <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <Headphones className="w-6 h-6 text-warmIvory stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest">Customer Support</h3>
                <CrownDivider />
                <div className="space-y-2.5 text-xs text-indianInk/85 font-light text-left w-full pt-1">
                  <p className="leading-relaxed">
                    Your experience matters to us. If you have any questions about our products, orders, or services, our support team is always ready to assist.
                  </p>
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Email</span>
                    <span className="break-all">{supportHelpEmail}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Business Hours */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-all">
                <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <Clock className="w-6 h-6 text-warmIvory stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-deodharForest">Business Hours</h3>
                <CrownDivider />
                <div className="space-y-2.5 text-xs text-indianInk/85 font-light text-center w-full pt-1">
                  <div>
                    <span className="font-bold text-deodharForest block text-[11px]">Monday – Saturday</span>
                    <span>9:00 AM – 6:00 PM</span>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold text-deodharForest block text-[11px]">Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FORM + FOLLOW OUR JOURNEY SECTION — Reduced Spacing
        ══════════════════════════════════════════════════ */}
        <section className="py-8 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-6 lg:gap-8 items-stretch">

              {/* Left Column: Contact Form */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-5 sm:p-7 shadow-sm">
                {isSuccess ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl font-bold text-deodharForest">Message Sent!</h3>
                      <p className="text-xs sm:text-sm text-indianInk/80 max-w-[320px] mx-auto leading-relaxed font-light">
                        Thank you. Our team will get back to you shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="mt-2 px-5 py-2 border border-[#0F3D2E]/25 hover:border-[#0F3D2E] text-[#0F3D2E] font-sans text-xs font-semibold rounded-full transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-center mb-1">
                      <h3 className="font-serif text-2xl font-bold text-deodharForest">Send Us a Message</h3>
                      <CrownDivider className="mt-0.5" />
                    </div>

                    {/* Name + Phone row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          disabled={isLoading}
                          value={fullName}
                          onChange={(e) => handleFieldChange("fullName", e.target.value)}
                          placeholder="Full Name"
                          className={inputCls(!!validationErrors.fullName)}
                        />
                        {validationErrors.fullName && <span className="text-[11px] text-red-500 pl-1">{validationErrors.fullName}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <input
                          type="tel"
                          disabled={isLoading}
                          value={phoneVal}
                          onChange={(e) => handleFieldChange("phone", e.target.value)}
                          placeholder="Phone Number"
                          className={inputCls(!!validationErrors.phone)}
                        />
                        {validationErrors.phone && <span className="text-[11px] text-red-500 pl-1">{validationErrors.phone}</span>}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="email"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder="Email Address"
                        className={inputCls(!!validationErrors.email)}
                      />
                      {validationErrors.email && <span className="text-[11px] text-red-500 pl-1">{validationErrors.email}</span>}
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        disabled={isLoading}
                        value={subject}
                        onChange={(e) => handleFieldChange("subject", e.target.value)}
                        placeholder="Subject"
                        className={inputCls(false)}
                      />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1">
                      <textarea
                        disabled={isLoading}
                        rows={3.5}
                        value={message}
                        onChange={(e) => handleFieldChange("message", e.target.value)}
                        placeholder="Message"
                        className={inputCls(!!validationErrors.message) + " resize-none"}
                      />
                      {validationErrors.message && <span className="text-[11px] text-red-500 pl-1">{validationErrors.message}</span>}
                    </div>

                    {/* Error Notice */}
                    {formError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-7 py-3 bg-[#0F3D2E] text-white rounded-full font-sans text-xs sm:text-sm font-medium hover:bg-[#0B2E20] transition-all duration-300 shadow-sm disabled:opacity-50"
                      >
                        {isLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending…</span></>
                        ) : (
                          <><Send className="w-4 h-4" /><span>Send Message</span></>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Right Column: Follow Our Journey */}
              <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-start overflow-hidden relative min-h-[440px]">
                {/* Full Single Background Image spanning 100% of card height */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/images/follow-journey-full-sky.png"
                    alt="Bharath Delight Landscape Sky Journey"
                    fill
                    unoptimized
                    className="object-cover object-bottom"
                    priority
                  />
                  {/* Gentle top fade to keep text ultra crisp */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(246, 242, 233, 0.4) 0%, rgba(246, 242, 233, 0.1) 40%, rgba(246, 242, 233, 0) 100%)"
                    }}
                  />
                </div>

                {/* Content placed directly over the sky portion in top half */}
                <div className="relative z-20 text-center space-y-3 pt-2">
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">Follow Our Journey</h3>
                    <CrownDivider className="mt-1" />
                  </div>
                  <p className="font-sans text-xs sm:text-[13.5px] text-indianInk/90 leading-relaxed font-light max-w-xs sm:max-w-sm mx-auto">
                    Stay connected with Bharath Delight and be the first to discover new products, updates, and stories from our journey.
                  </p>

                  {/* Social icons row */}
                  <div className="flex justify-center gap-4 sm:gap-5 pt-2">
                    {[
                      {
                        label: "Instagram",
                        href: "https://www.instagram.com/bharathdelightfoods?exln=ZThhejEwcHNldnNw",
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        )
                      },
                      {
                        label: "Facebook",
                        href: "#",
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.23 0-1.62.77-1.62 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z" />
                          </svg>
                        )
                      },
                      {
                        label: "LinkedIn",
                        href: "#",
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                            <circle cx="4" cy="4" r="2" />
                          </svg>
                        )
                      },
                      {
                        label: "YouTube",
                        href: "#",
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        )
                      },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1">
                        <Link
                          href={s.href}
                          target={s.href !== "#" ? "_blank" : undefined}
                          rel={s.href !== "#" ? "noopener noreferrer" : undefined}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0F3D2E] hover:bg-[#C49A45] flex items-center justify-center text-white transition-all duration-300 hover:-translate-y-0.5 shadow-md"
                          aria-label={s.label}
                        >
                          {s.icon}
                        </Link>
                        <span className="font-sans text-[10.5px] font-medium text-indianInk/85">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            EVERY CONVERSATION MATTERS — Reduced Spacing
        ══════════════════════════════════════════════════ */}
        <section className="py-8 bg-[#FAF9F6] border-b border-burnishedGold/15">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-[#F6F2E9] border border-burnishedGold/20 rounded-2xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8">

              {/* Left Side: Icon & Title */}
              <div className="flex items-center gap-4 text-left min-w-[280px]">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0F3D2E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-burnishedGold/20">
                  <Handshake className="w-7 h-7 text-warmIvory stroke-[1.5]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-serif text-2xl lg:text-[26px] font-bold text-deodharForest leading-tight">
                    Every Conversation<br className="hidden sm:block" /> Matters
                  </h3>
                  <CrownDivider className="!justify-start" />
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden lg:block h-20 border-l-2 border-[#C49A45]/40 shrink-0 mx-2" />

              {/* Right Side: Text & Tagline */}
              <div className="w-full lg:w-[50%] text-left space-y-1.5 relative z-10">
                <p className="font-sans text-xs sm:text-sm text-indianInk/85 font-light leading-relaxed">
                  Building trust starts with listening. We value every question, every suggestion, and every opportunity to serve you better.
                </p>
                <p className="font-sans text-xs sm:text-sm text-indianInk/85 font-light leading-relaxed">
                  Thank you for being part of the Bharath Delight family.
                </p>
                <span className="font-serif italic font-semibold text-[#C49A45] text-base sm:text-lg block pt-0.5">
                  Authenticity in Every Delight
                </span>
              </div>

              {/* Background Leaf Watermark */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block select-none">
                <Image src="/images/values-leaf-right.png" alt="Leaves Decor" width={140} height={260} className="object-contain" />
              </div>

            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
