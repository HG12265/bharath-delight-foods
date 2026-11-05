import type { Metadata } from "@/platform/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Us | Bharath Delight Foods",
  description:
    "Get in touch with Bharath Delight Foods for order support, product enquiries, bulk orders, or business partnerships. We respond within 24 hours.",
  keywords: [
    "contact bharath delight foods",
    "ghee order support",
    "bulk ghee enquiry",
    "bharath delight foods support",
    "food brand contact india",
  ],
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
  openGraph: {
    title: "Contact Us | Bharath Delight Foods",
    description:
      "Order support, product queries, and business enquiries. Reach Bharath Delight Foods today.",
    url: `${siteConfig.url}/contact`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "Contact Bharath Delight Foods" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Bharath Delight Foods",
    description: "Order support, product queries, and business enquiries.",
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
