import React from "react";
import type { Metadata } from "@/platform/metadata";
import Link from "@/platform/link";
import PublicLayout from "@/components/layout/public-layout";
import { Shield, Lock, Eye, Mail } from "lucide-react";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Bharath Delight Foods",
  description: "Understand how we collect, handle, and secure your personal and order data at Bharath Delight Foods.",
  alternates: {
    canonical: `${siteConfig.url}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div 
        className="min-h-screen text-indianInk py-12 md:py-20 border-b border-burnishedGold/15"
        style={{ background: "radial-gradient(circle at center, #FFFDF0 0%, #FAF9F6 70%, #FFF7E8 100%)" }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Block */}
          <div className="text-center space-y-3 animate-fade-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-deodharForest/5 border border-deodharForest/15 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider text-deodharForest mb-2">
              <Shield className="w-3.5 h-3.5 text-gheeGold" /> Secure & Private
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-deodharForest">
              Privacy Policy
            </h1>
            <p className="font-sans text-xs text-indianInk/60">
              Last Updated: June 14, 2026
            </p>
            <div className="w-12 h-0.5 bg-gheeGold mx-auto mt-4" />
          </div>

          {/* Policy Card */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-10 shadow-sm space-y-8 font-sans text-sm sm:text-base leading-relaxed text-indianInk/85">
            
            <p>
              At <strong>Bharath Delight Foods</strong> (referred to as "we", "us", or "our"), operated under <strong>[Business Legal Name]</strong>, we value the trust you place in us. This Privacy Policy describes how we collect, use, and protect your personal information when you visit our website and purchase our products.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Eye className="w-5 h-5 text-gheeGold" /> 1. Data We Collect
              </h2>
              <p>
                To provide you with our services, process your orders, and support your inquiries, we collect the following customer information:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li><strong>Personal Details:</strong> Full name, phone number, and email address.</li>
                <li><strong>Delivery Details:</strong> Shipping address, city, state, country, and pincode.</li>
                <li><strong>Order History:</strong> Product selection, quantity, transaction summary, and transaction status.</li>
                <li><strong>Payment Verification:</strong> Uploaded screenshots of UPI transactions (containing transaction ID and transfer details) to verify manual payments.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Lock className="w-5 h-5 text-gheeGold" /> 2. Secure Processing & Payment Details
              </h2>
              <p>
                We process payments through manual UPI transfer checks. <strong>We do not request, process, or store any sensitive financial credentials</strong>, such as credit card numbers, debit card numbers, net banking passwords, or bank account credentials on our servers. 
              </p>
              <p>
                All UPI transaction screenshots submitted by customers are solely used to match the bank deposit with the corresponding order ID before packing and dispatching products.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Mail className="w-5 h-5 text-gheeGold" /> 3. Why We Collect Your Data
              </h2>
              <p>
                Your information is used for the following specific purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li>Processing and fulfilling your product orders.</li>
                <li>Verifying manual UPI transfers and matching screenshots.</li>
                <li>Arranging shipping through courier partners and generating shipping labels.</li>
                <li>Sending transactional email notifications regarding account creation, order placement, payment approval, and shipment tracking.</li>
                <li>Providing customer service and answering inquiries.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Shield className="w-5 h-5 text-gheeGold" /> 4. Data Sharing & Protection
              </h2>
              <p>
                <strong>We do not sell, rent, or trade your personal information to third parties.</strong>
              </p>
              <p>
                We share relevant shipment data (delivery name, shipping address, and phone number) with trusted logistics partners to facilitate packing and delivery services. Our co-packer and manufacturing facility partners operate under strict standards to maintain transparency and hygiene. 
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Mail className="w-5 h-5 text-gheeGold" /> 5. Privacy Contact & Requests
              </h2>
              <p>
                If you have questions about this Privacy Policy, wish to access your registered details, or request the deletion of your account and customer data, please write to us at:
              </p>
              <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded p-4 text-xs sm:text-sm text-indianInk/85 space-y-1">
                <p><strong>Email Support:</strong> bharathdelightfoods@gmail.com</p>
                <p><strong>Phone Support:</strong> +91 90927 48525</p>
                <p><strong>Business Address:</strong> [Business Address]</p>
              </div>
            </div>

          </div>

          {/* Quick Footer Navigation */}
          <div className="text-center text-xs font-sans text-indianInk/50">
            <Link href="/" className="hover:text-deodharForest transition-colors">Home</Link>
            <span className="mx-2">•</span>
            <Link href="/terms-and-conditions" className="hover:text-deodharForest transition-colors">Terms & Conditions</Link>
            <span className="mx-2">•</span>
            <Link href="/shipping-policy" className="hover:text-deodharForest transition-colors">Shipping Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-cancellation-policy" className="hover:text-deodharForest transition-colors">Refund Policy</Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
