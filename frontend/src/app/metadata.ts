import type { Metadata } from "@/platform/metadata";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

export const defaultMetadata: Metadata = {
  metadataBase: new URL("https://bharath-delight-foods.vercel.app"),
  applicationName: "Bharath Delight Foods",
  title: {
    default: "Bharath Delight Foods — Authenticity in Every Delight.",
    template: "%s | Bharath Delight Foods",
  },
  description:
    "Expertly curated premium Indian foods. Sourced from heritage regions, laboratory-verified for purity, and trace-certified by batch.",
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bharath Delight Foods — Authenticity in Every Delight.",
    description:
      "Expertly curated premium Indian foods. Sourced from heritage regions, laboratory-verified for purity, and trace-certified by batch.",
    url: "https://bharath-delight-foods.vercel.app/",
    siteName: "Bharath Delight Foods",
    type: "website",
    images: [
      {
        url: "/og-bharath.png?v=5",
        width: 1200,
        height: 630,
        alt: "Bharath Delight Foods premium Indian foods",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bharath Delight Foods — Authenticity in Every Delight.",
    description:
      "Expertly curated premium Indian foods. Sourced from heritage regions, laboratory-verified for purity, and trace-certified by batch.",
    images: ["/og-bharath.png?v=5"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: env.NEXT_PUBLIC_GOOGLE_SC_TOKEN || undefined,
    ...(env.NEXT_PUBLIC_BING_WMT_TOKEN && {
      other: { "msvalidate.01": env.NEXT_PUBLIC_BING_WMT_TOKEN },
    }),
  },
};
