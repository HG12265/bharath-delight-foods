"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import Image from "@/platform/image";
import { Phone, Mail, MapPin, ShieldCheck, CheckCircle2, Send, Sprout, Package, Users } from "lucide-react";

/* Small leaf SVG icon */
const LeafIcon = ({ className = "w-3 h-3 text-[#C49A45]" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 60" fill="currentColor">
    <path d="M50 10C53 25 50 40 50 55C50 40 47 25 50 10Z" />
    <path d="M50 35C38 42 25 37 20 25C28 38 42 45 50 35Z" />
    <path d="M50 35C62 42 75 37 80 25C72 38 58 45 50 35Z" />
  </svg>
);

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

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#0F3D2E] text-[#FAF9F6] font-sans border-t border-burnishedGold/20 overflow-hidden relative">
      {/* Decorative Leaves on left and right sides */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-80 pointer-events-none select-none hidden lg:block">
        <Image src="/images/values-leaf-left.png?v=3" alt="" width={160} height={240} unoptimized className="w-[125px] xl:w-[160px] h-auto object-contain" />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-80 pointer-events-none select-none hidden lg:block">
        <Image src="/images/values-leaf-right.png?v=3" alt="" width={160} height={240} unoptimized className="w-[125px] xl:w-[160px] h-auto object-contain" />
      </div>

      {/* ── Main 4 Column Navigation Grid ── */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-12 pb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-white/10">

          {/* Col 1: Brand & Logo */}
          <div className="space-y-4">
            <div>
              <Link href="/" className="inline-block mb-3 select-none group" aria-label="Bharath Delight Home">
                <div className="bg-white rounded-lg p-2 inline-flex items-center shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Image
                    src="/images/logo.png"
                    alt="Bharath Delight - Authenticity in Every Delight"
                    width={160}
                    height={52}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              </Link>
            </div>

            <p className="text-xs text-white/75 leading-relaxed font-light max-w-xs">
              Bringing you authentic, high-quality products that families can trust and cherish every day.
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { label: "Facebook", icon: <span className="text-sm font-bold font-sans">f</span> },
                {
                  label: "Instagram", icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )
                },
                {
                  label: "LinkedIn", icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  )
                },
                {
                  label: "YouTube", icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  )
                },
              ].map((s) => (
                <Link
                  key={s.label}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C49A45] flex items-center justify-center text-white transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
                  aria-label={s.label}
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-serif font-bold text-white tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5 text-xs font-light text-white/80">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Products", href: "/shop" },
                { label: "Our Promise", href: "/trust" },
                { label: "Contact Us", href: "/contact" },
                { label: "My Profile", href: "/account" },
                { label: "My Orders", href: "/account/orders" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 hover:text-[#C49A45] transition-colors duration-200"
                  >
                    <LeafIcon className="w-3 h-3 text-[#C49A45] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-4">
            <h4 className="text-base font-serif font-bold text-white tracking-wide">Contact Us</h4>
            <ul className="space-y-3 text-xs font-light text-white/80">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C49A45] shrink-0 mt-0.5 stroke-[1.8]" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+919150141007" className="hover:text-[#C49A45] transition-colors">+91 91501 41007</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C49A45] shrink-0 mt-0.5 stroke-[1.8]" />
                <a href="mailto:bharathdelightfoods@gmail.com" className="break-all hover:text-[#C49A45] transition-colors">
                  bharathdelightfoods@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C49A45] shrink-0 mt-0.5 stroke-[1.8]" />
                <span className="leading-relaxed">
                  Bharath Delight Foods, Adiannamalai, Tiruvannamalai, 606604, Tamil Nadu, India
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="text-base font-serif font-bold text-white tracking-wide">Newsletter</h4>
            <p className="text-xs text-white/80 leading-relaxed font-light">
              Subscribe to get updates on new products and our journey.
            </p>

            {subscribed ? (
              <div className="bg-white/10 border border-[#C49A45]/30 rounded-xl p-3 text-center text-xs text-[#C49A45] font-medium">
                Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-stretch rounded-xl overflow-hidden border border-burnishedGold/30">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2.5 text-xs text-indianInk bg-white focus:outline-none font-sans min-w-0"
                />
                <button
                  type="submit"
                  className="bg-[#C49A45] hover:bg-[#b0883b] text-white px-4 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Subscribe"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 pt-1 text-[11px] text-white/60 font-light">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C49A45]" />
                100% Secure
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C49A45]" />
                No Spam
              </span>
            </div>
          </div>

        </div>

        {/* ── Bottom Bar ──────────────────────────────────── */}
        <div className="pt-6 flex items-center justify-center gap-3 text-center text-xs text-white/60 font-light">
          <LeafIcon className="w-3.5 h-3.5 text-[#C49A45]" />
          <span>© 2026 Bharath Delight Foods. All Rights Reserved.</span>
          <LeafIcon className="w-3.5 h-3.5 text-[#C49A45]" />
        </div>

      </div>
    </footer>
  );
};

export default Footer;