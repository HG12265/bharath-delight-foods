import { env } from "@/lib/env";

export const siteConfig = {
  name: "Bharath Delight Foods",
  tagline: "Authenticity in Every Delight.",
  mediaDomains: [],
  description:
    "Expertly curated premium Indian foods. Sourced from heritage regions, laboratory-verified for purity, and trace-certified by batch.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/og-bharath.png?v=3",
  fssaiLicenseNumber: "12424999000123",
  twitterHandle: "",
  keywords: [
    "pure ghee online india",
    "rasipuram ghee",
    "uthukuli a2 cow ghee",
    "traditional ghee",
    "premium indian ghee",
    "lab verified ghee",
    "fssai licensed ghee",
    "buy ghee online",
    "Bharath Delight Foods",
  ],
  links: {
    supportEmail: "bharathdelightfoods@gmail.com",
    partnerPortal: "/b2b",
  },
  nav: {
    main: [
      { title: "Home", href: "/" },
      { title: "About Us", href: "/about" },
      { title: "Products", href: "/shop" },
      { title: "Quality", href: "/trust" },
      { title: "Our Promise", href: "/trust" },
      { title: "Contact Us", href: "/contact" },
    ],
    footer: [
      {
        title: "Products",
        items: [
          { title: "Product Catalog", href: "/shop" },
          { title: "Cold Pressed Oils (Coming Soon)", href: "#" },
          { title: "Wild Honey (Coming Soon)", href: "#" },
        ],
      },
      {
        title: "Trust Portal",
        items: [
          { title: "Verify Batch Code", href: "/trust" },
          { title: "Sourcing Map", href: "/trust" },
          { title: "Lab Certifications", href: "/trust" },
        ],
      },
      {
        title: "Institutional",
        items: [
          { title: "B2B Procurement Portal", href: "/b2b" },
          { title: "Corporate Gifting Catalog", href: "/corporate-gifting" },
          { title: "Warehouse Dashboard", href: "/warehouse-dashboard" },
        ],
      },
    ],
  },
};

export type SiteConfig = typeof siteConfig;