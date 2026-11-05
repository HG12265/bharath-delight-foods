import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import metadata from "../../public/route-metadata.json";

export default function Seo() {
  const { pathname } = useLocation();
  const client = useQueryClient();
  useEffect(() => {
    const update = () => {
      const routes = metadata as Record<string, any>;
      const matches = Object.keys(routes)
        .filter(
          (route) =>
            route !== "/" &&
            (pathname === route || pathname.startsWith(route + "/")),
        )
        .sort((a, b) => a.length - b.length);
      let meta = { ...routes["/"] };
      for (const route of matches) meta = { ...meta, ...routes[route] };
      const slug = pathname.match(/^\/products\/([^/]+)$/)?.[1];
      const product = slug
        ? client.getQueryData<any>(["product", decodeURIComponent(slug)])?.data
        : null;
      const title =
        product?.seo?.meta_title ||
        product?.name ||
        (typeof meta.title === "string" ? meta.title : meta.title?.default) ||
        "Bharath Delight Foods";
      document.title = title;
      const description =
        product?.seo?.meta_description ||
        product?.short_description ||
        meta.description ||
        "";
      let tag = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = description;
      let canonical = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = new URL(
        pathname,
        import.meta.env.VITE_APP_URL || window.location.origin,
      ).href;
    };
    update();
    return client.getQueryCache().subscribe(update);
  }, [pathname, client]);
  return null;
}
