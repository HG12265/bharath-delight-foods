import type { Metadata } from "@/platform/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Trust Center Batch Verification | Bharath Delight Foods",
  description:
    "Verify product laboratory certificates, traceability reports, and batch compliance online at Bharath Delight Foods.",
  keywords: [
    "verify batch code",
    "ghee lab report online",
    "ghee certificate verification",
    "traceability report",
    "pure ghee verification",
  ],
  alternates: {
    canonical: `${siteConfig.url}/trust`,
  },
  openGraph: {
    title: "Trust Center Batch Verification | Bharath Delight Foods",
    description:
      "Verify product laboratory certificates, traceability reports, and batch compliance online.",
    url: `${siteConfig.url}/trust`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "Verify Batch Code | Bharath Delight Foods" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trust Center Batch Verification",
    description: "Verify product laboratory certificates and batch compliance online.",
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
};

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
