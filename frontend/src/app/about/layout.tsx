import type { Metadata } from "@/platform/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About Us | Bharath Delight Foods",
  description:
    "Learn about Bharath Delight Foods, our story, mission, and note from the founder.",
  keywords: [
    "Bharath Delight Foods",
    "about us",
    "our story",
    "founder note",
    "responsible food brand"
  ],
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: "About Us | Bharath Delight Foods",
    description:
      "Learn about Bharath Delight Foods, our story, mission, and note from the founder.",
    url: `${siteConfig.url}/about`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "About Us | Bharath Delight Foods" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Bharath Delight Foods",
    description: "Learn about Bharath Delight Foods, our story, mission, and note from the founder.",
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
