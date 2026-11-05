import React from "react";
import type { Metadata } from "@/platform/metadata";
import Link from "@/platform/link";
import PublicLayout from "@/components/layout/public-layout";
import { RefreshCw, ClipboardList, Ban, CreditCard, HelpCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Bharath Delight Foods",
  description: "Learn about order cancellation deadlines, eligibility for refunds/replacements, and refund timelines at Bharath Delight Foods.",
  alternates: {
    canonical: `${siteConfig.url}/refund-cancellation-policy`,
  },
};

export default function RefundCancellationPolicyPage() {
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
              <RefreshCw className="w-3.5 h-3.5 text-gheeGold" /> Return Policy
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-deodharForest">
              Refund & Cancellation Policy
            </h1>
            <p className="font-sans text-xs text-indianInk/60">
              Last Updated: June 14, 2026
            </p>
            <div className="w-12 h-0.5 bg-gheeGold mx-auto mt-4" />
          </div>

          {/* Policy Card */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-10 shadow-sm space-y-8 font-sans text-sm sm:text-base leading-relaxed text-indianInk/85">
            
            <p>
              At <strong>Bharath Delight Foods</strong>, we stand behind the quality of our carefully selected regional food products. Since we source and package premium food items, we have established clear guidelines regarding cancellations, returns, and refunds to protect our customers and maintain high hygiene standards.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Ban className="w-5 h-5 text-gheeGold" /> 1. Order Cancellation Policy
              </h2>
              <p>
                We process orders promptly after verifying your manual UPI payment. Therefore, cancellation timelines are restricted:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li><strong>Before Packaging/Dispatch:</strong> You can cancel your order and request a full refund if the order has not been packed or handed over to our shipping partners. Please call or email our support immediately.</li>
                <li><strong>After Dispatch:</strong> Once your order has been packaged and dispatched (a tracking number is generated), <strong>cancellations are not allowed</strong> and the delivery cannot be recalled.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gheeGold" /> 2. Eligibility for Refund or Replacement
              </h2>
              <p>
                As our products are perishable food items, returns are generally not accepted. We will, however, issue a replacement or refund under the following verified conditions:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li><strong>Damaged Product:</strong> The product packaging was physically broken, punctured, or leaked during transit.</li>
                <li><strong>Wrong Item Received:</strong> The item delivered does not match the product or variant ordered.</li>
                <li><strong>Missing Items:</strong> Part of your order was not included in the delivery package.</li>
                <li><strong>Manufacturing Defect:</strong> The product exhibits quality issues that render it unfit for consumption (e.g. rancidity, foreign materials).</li>
              </ul>
              <p>
                <strong>Any such issue must be reported within 24 hours of delivery.</strong> Claims submitted after this 24-hour window will not be eligible for review.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gheeGold" /> 3. Requirements for Filing a Claim
              </h2>
              <p>
                To help us verify the damage or error, you must provide:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-indianInk/75">
                <li>Your Order ID and registered phone number.</li>
                <li>Clear photos or an unboxing video demonstrating the damaged state of the package, the shipping label, and the product itself.</li>
              </ul>
              <p>
                Claims that do not have valid photographic/video proof or are found to be fake or manipulated will be rejected immediately.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Ban className="w-5 h-5 text-gheeGold" /> 4. Opened Food Packages Policy
              </h2>
              <p>
                <strong>Food products once opened or partially consumed are not eligible for return, replacement, or refund.</strong> 
              </p>
              <p>
                This is a strict sanitary policy to ensure hygiene. If you believe a product has a quality defect after opening it, please do not dispose of the package. Contact us immediately with the batch code printed on the jar so we can review the laboratory verification records for that specific batch.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gheeGold" /> 5. Refund Processing Timeline
              </h2>
              <p>
                Once your refund request is approved after verification:
              </p>
              <p>
                The refund will be processed manually back to your original source account (the UPI account used during payment verification). <strong>Refunds are generally processed and completed within 3 to 5 business days</strong> from the date of approval.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gheeGold" /> 6. Support Contact for Refunds
              </h2>
              <p>
                To request a cancellation, report damages, or check refund status, please contact us:
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
            <Link href="/shipping-policy" className="hover:text-deodharForest transition-colors">Shipping Policy</Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
