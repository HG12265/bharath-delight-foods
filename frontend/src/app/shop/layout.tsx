import type { Metadata } from "@/platform/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shop Authentic Products Online | Bharath Delight Foods",
  description:
    "Buy premium traditional foods online. FSSAI licensed, lab-verified purity, trace-sealed batches.",
  keywords: [
    "buy online",
    "pure food india",
    "premium indian food shop",
    "lab verified food",
    "fssai licensed foods online",
    "traditional products buy",
  ],
  alternates: {
    canonical: `${siteConfig.url}/shop`,
  },
  openGraph: {
    title: "Shop Pure Ghee Online | Bharath Delight Foods",
    description:
      "Premium Rasipuram & Uthukuli ghee. Lab-verified, FSSAI licensed. Delivered to your door.",
    url: `${siteConfig.url}/shop`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "Bharath Delight Foods — Shop Ghee" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Pure Ghee Online | Bharath Delight Foods",
    description: "Premium Rasipuram & Uthukuli ghee. Lab-verified, FSSAI licensed.",
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
