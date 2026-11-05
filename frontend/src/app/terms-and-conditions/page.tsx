import React from "react";
import type { Metadata } from "@/platform/metadata";
import Link from "@/platform/link";
import PublicLayout from "@/components/layout/public-layout";
import { Scale, FileText, Info, AlertTriangle } from "lucide-react";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms & Conditions | Bharath Delight Foods",
  description: "Review our Terms and Conditions for using the website and placing orders at Bharath Delight Foods.",
  alternates: {
    canonical: `${siteConfig.url}/terms-and-conditions`,
  },
};

export default function TermsAndConditionsPage() {
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
              <Scale className="w-3.5 h-3.5 text-gheeGold" /> User Agreement
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-deodharForest">
              Terms & Conditions
            </h1>
            <p className="font-sans text-xs text-indianInk/60">
              Last Updated: June 14, 2026
            </p>
            <div className="w-12 h-0.5 bg-gheeGold mx-auto mt-4" />
          </div>

          {/* Terms Card */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg p-6 md:p-10 shadow-sm space-y-8 font-sans text-sm sm:text-base leading-relaxed text-indianInk/85">
            
            <p>
              Welcome to <strong>Bharath Delight Foods</strong>. This website is owned and operated by <strong>[Business Legal Name]</strong>. By accessing this website or placing an order, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <FileText className="w-5 h-5 text-gheeGold" /> 1. Use of the Website
              </h2>
              <p>
                By using this site, you warrant that you are at least 18 years of age or are accessing the site under the supervision of a parent or guardian. You agree to use the site only for lawful purposes and in accordance with these Terms.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Info className="w-5 h-5 text-gheeGold" /> 2. Pricing & Product Availability
              </h2>
              <p>
                All prices listed on the website are in Indian Rupees (INR) and are subject to change without prior notice. We make every effort to display accurate pricing; however, technical errors can happen. We reserve the right to cancel any orders placed at incorrect prices.
              </p>
              <p>
                Product availability is subject to change. Listing a product on the website does not guarantee that the stock is ready for immediate packing and dispatch.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Info className="w-5 h-5 text-gheeGold" /> 3. Representative Product Images
              </h2>
              <p>
                <strong>Product images shown on this website are for representative purposes only.</strong> 
              </p>
              <p>
                While we strive to represent colors, consistency, and packaging containers as accurately as possible, the actual batch color, texture, or jar appearance may vary slightly due to natural variations in agricultural sourcing, processing batches, or packaging container updates.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gheeGold" /> 4. Order Acceptance & UPI Payment Verification
              </h2>
              <p>
                Placement of an order does not constitute final acceptance. All orders are subject to stock validation and payment confirmation.
              </p>
              <p>
                Because we operate via manual UPI payment transfers, <strong>your order will not be packed or dispatched until we successfully verify and match your uploaded payment screenshot</strong> with our bank deposits.
              </p>
              <p>
                We reserve the right to immediately cancel orders, restrict website access, or reject transactions if there is a suspected misuse of the platform, submission of fake or altered payment screenshots, or any fraudulent order attempts.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Scale className="w-5 h-5 text-gheeGold" /> 5. Limitation of Liability
              </h2>
              <p>
                We handle, pack, and ship our products with standard care. However, we are not responsible for any indirect, incidental, or consequential damages resulting from the use of our website or the consumption of our food products. 
              </p>
              <p>
                <strong>Our maximum liability to you for any issue, claim, or order discrepancy is strictly limited to the total amount paid by you for that specific order.</strong>
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Scale className="w-5 h-5 text-gheeGold" /> 6. Governing Law & Jurisdiction
              </h2>
              <p>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of our registered business location in India.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Info className="w-5 h-5 text-gheeGold" /> 7. Co-Packer & Licensing Declarations
              </h2>
              <p>
                To maintain high standards of transparency, please note the licensing information associated with our products:
              </p>
              <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded p-4 text-xs sm:text-sm text-indianInk/85 space-y-2">
                <p>
                  <strong>Co-Packer FSSAI Number:</strong> [FSSAI License Number] <br />
                  <span className="text-indianInk/60 italic">(This FSSAI license number belongs to our contracted manufacturing/co-packing partner where products are processed and packed under standard hygiene conditions.)</span>
                </p>
                <p>
                  <strong>Co-Packer GSTIN:</strong> [GST Number] <br />
                  <span className="text-indianInk/60 italic">(This GST registration belongs to our contracted manufacturing/co-packing partner for tax compliance.)</span>
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-deodharForest flex items-center gap-2">
                <Info className="w-5 h-5 text-gheeGold" /> 8. Contact Information
              </h2>
              <p>
                If you have any questions or require support regarding these Terms and Conditions, please contact us:
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
            <Link href="/shipping-policy" className="hover:text-deodharForest transition-colors">Shipping Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-cancellation-policy" className="hover:text-deodharForest transition-colors">Refund Policy</Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
