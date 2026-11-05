import React from "react";
import type { Metadata } from "@/platform/metadata";
import Link from "@/platform/link";
import PublicLayout from "@/components/layout/public-layout";
import { Truck, Clock, MapPin, AlertCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shipping Policy | Bharath Delight Foods",
  description: "Learn about order verification, processing timelines, delivery durations, and tracking at Bharath Delight Foods.",
  alternates: {
    canonical: `${siteConfig.url}/shipping-policy`,
  },
};

export default function ShippingPolicyPage() {
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
              <Truck className="w-3.5 h-3.5 text-gheeGold" /> Delivery Policy
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-deodharForest">
              Shipping & Delivery Policy
            </h1>
            <p className="font-sans text-xs text-indianInk/60">
              Last Updated: June 14, 2026
            </p>
            <div className="w-12 h-0.5 bg-gheeGold mx-auto mt-4" />
          </div>

          {/* Shipping Policy Card */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-10 shadow-sm space-y-8 font-sans text-sm sm:text-base leading-relaxed text-indianInk/85">
            
            <p>
              Thank you for shopping at <strong>Bharath Delight Foods</strong>. We are committed to handling, packing, and delivering your products safely. This Shipping Policy details our procedures, timelines, and conditions.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Clock className="w-5 h-5 text-gheeGold" /> 1. Processing & Verification Timelines
              </h2>
              <p>
                Because we utilize manual UPI payment transfers, <strong>order processing starts only after our team verifies and approves your uploaded payment screenshot.</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li><strong>Order & Payment Verification:</strong> Within 12–24 hours from submission.</li>
                <li><strong>Order Packaging & Dispatch Window:</strong> Typically 24–48 hours from the time payment is verified and cleared in our account.</li>
              </ul>
              <p className="text-xs text-indianInk/60 italic">
                * Note: We do not dispatch orders on Sundays or regional public holidays.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Clock className="w-5 h-5 text-gheeGold" /> 2. Delivery Timelines
              </h2>
              <p>
                Once handed over to our delivery partners, the estimated transit duration is as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li><strong>Within Tamil Nadu:</strong> 2 to 4 business days.</li>
                <li><strong>Other States in India:</strong> 4 to 7 business days.</li>
              </ul>
              <p>
                Please note that these delivery timelines are estimates provided by courier companies and are not legally binding.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gheeGold" /> 3. Customer Responsibility for Accuracy
              </h2>
              <p>
                To avoid transit delays or delivery failures, <strong>the customer is strictly responsible for providing complete and correct details at checkout:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li>Complete address containing house/apartment number, street name, and visible landmarks.</li>
                <li>An active 10-digit Indian phone number where the courier agent can reach you.</li>
                <li>A valid 6-digit PIN code matching your destination city/location.</li>
              </ul>
              <p>
                Any delivery failures or return-to-origin (RTO) shipments caused by incorrect addresses, wrong contact numbers, or customer unavailability will incur extra shipping fees for redelivery.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gheeGold" /> 4. Shipping Exceptions & Delays
              </h2>
              <p>
                Delays in delivery may occasionally occur due to reasons beyond our direct control, including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li>Severe weather disruptions or natural disasters.</li>
                <li>National, state, or regional strikes and transportation blockages.</li>
                <li>Remote geographical locations or hard-to-access rural zones.</li>
                <li>Courier operational constraints during festive periods.</li>
              </ul>
              <p>
                We will work with our logistics partners to resolve delays and provide updates where possible.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Truck className="w-5 h-5 text-gheeGold" /> 5. Tracking & Shipment Updates
              </h2>
              <p>
                Once your order has been packed and handed over to the courier company, a tracking number and dispatch confirmation link will be shared with you via email. You can also view these details directly by signing into your customer profile on our portal.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gheeGold" /> 6. Shipping Support Contact
              </h2>
              <p>
                If you have questions regarding your order status, delivery, or tracking, please write to us:
              </p>
              <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded p-4 text-xs sm:text-sm text-indianInk/85 space-y-1">
                <p><strong>Support Email:</strong> bharathdelightfoods@gmail.com</p>
                <p><strong>Support Phone:</strong> +91 90927 48525</p>
                <p><strong>Business Address:</strong> [Business Address]</p>
              </div>
            </div>

          </div>

          {/* Quick Footer Navigation */}
          <div className="text-center text-xs font-sans text-indianInk/50">
            <Link href="/" className="hover:text-deodharForest transition-colors">Home</Link>
            <span className="mx-2">•</span>
            <Link href="/privacy-policy" className="hover:text-deodharForest transition-colors">Privacy Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/terms-and-conditions" className="hover:text-deodharForest transition-colors">Terms & Conditions</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-cancellation-policy" className="hover:text-deodharForest transition-colors">Refund Policy</Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
