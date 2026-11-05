import { siteConfig } from "@/config/site";
import { Product } from "@/types";

/** Resolves a product's first image URL, with fallback to site OG image */
export function resolveProductImageUrl(product: Product, apiBaseUrl: string): string {
  if (product.media_urls && product.media_urls.length > 0) {
    return product.media_urls[0];
  }
  if (product.media_ids && product.media_ids.length > 0) {
    return `${apiBaseUrl}/api/v1/media/${product.media_ids[0]}/public-url`;
  }
  return siteConfig.ogImage;
}

/** Organization JSON-LD schema */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/logo.png`,
      width: 200,
      height: 60,
    },
    description: siteConfig.description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: siteConfig.links.supportEmail,
      availableLanguage: ["English", "Tamil"],
    },
    sameAs: [],
  };
}

/** WebSite JSON-LD schema (enables Sitelinks Searchbox potential) */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Product JSON-LD schema with Offer and AggregateRating */
export function buildProductSchema(product: Product, appUrl: string, imageUrl: string) {
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.filter(v => v.is_active).map(v => Number(v.price)))
    : null;

  const highestPrice = product.variants.length > 0
    ? Math.max(...product.variants.filter(v => v.is_active).map(v => Number(v.price)))
    : null;

  const inStock = product.variants.some(v => v.is_active && v.stock_status === "in_stock");

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description,
    url: `${appUrl}/products/${product.slug}`,
    image: imageUrl,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    sku: product.variants[0]?.sku ?? undefined,
    keywords: [
      ...(product.tags || []),
      ...(product.search_keywords || []),
      ...(product.seo?.meta_keywords || []),
    ].filter(Boolean).join(", "),
  };

  // Add offers if we have pricing
  if (lowestPrice !== null) {
    if (lowestPrice === highestPrice) {
      schema.offers = {
        "@type": "Offer",
        price: lowestPrice.toFixed(2),
        priceCurrency: "INR",
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: `${appUrl}/products/${product.slug}`,
        seller: { "@type": "Organization", name: siteConfig.name },
      };
    } else {
      schema.offers = {
        "@type": "AggregateOffer",
        lowPrice: lowestPrice.toFixed(2),
        highPrice: highestPrice!.toFixed(2),
        priceCurrency: "INR",
        offerCount: product.variants.filter(v => v.is_active).length,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      };
    }
  }

  // Add ratings if available
  if (product.ratings && product.ratings.review_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratings.average_rating.toFixed(1),
      reviewCount: product.ratings.review_count,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

/** BreadcrumbList JSON-LD schema */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; href: string }>,
  appUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${appUrl}${item.href}`,
    })),
  };
}

/** ItemList JSON-LD schema for shop/category listing pages */
export function buildItemListSchema(
  products: Array<{ name: string; slug: string }>,
  appUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Premium Indian Ghee — Bharath Delight Foods",
    url: `${appUrl}/shop`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${appUrl}/products/${product.slug}`,
      name: product.name,
    })),
  };
}
