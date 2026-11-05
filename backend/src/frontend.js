import express from "express";
import fs from "node:fs";
import path from "node:path";
import { active } from "./core.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
export function serveFrontend(app, db) {
  const directory = path.resolve(
    process.env.FRONTEND_DIST || "../frontend/dist",
  );
  if (!fs.existsSync(path.join(directory, "index.html")))
    throw new Error("Build the React frontend before enabling SERVE_FRONTEND.");
  const template = fs.readFileSync(path.join(directory, "index.html"), "utf8");
  const metadata = JSON.parse(
    fs.readFileSync(path.join(directory, "route-metadata.json"), "utf8"),
  );
  const siteOrigin = () =>
    (process.env.FRONTEND_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  app.get("/robots.txt", (req, res) => {
    const disallow = [
      "admin",
      "account",
      "cart",
      "checkout",
      "login",
      "register",
      "order",
      "api",
    ];
    const lines = [
      "User-agent: *",
      "Allow: /",
      ...disallow.map((route) => `Disallow: /${route}`),
      "",
      ...["GPTBot", "ChatGPT-User", "Google-Extended", "CCBot"].flatMap(
        (agent) => [`User-agent: ${agent}`, "Disallow: /", ""],
      ),
      `Sitemap: ${siteOrigin()}/sitemap.xml`,
    ];
    res.type("text/plain").send(lines.join("\n"));
  });
  app.get("/sitemap.xml", async (req, res) => {
    const routes = [
      "",
      "/shop",
      "/about",
      "/trust",
      "/contact",
      "/privacy-policy",
      "/terms-and-conditions",
      "/shipping-policy",
      "/refund-cancellation-policy",
    ];
    const products = await db
      .collection("products")
      .find({ ...active, status: "active" })
      .project({ slug: 1, updated_at: 1 })
      .limit(50000)
      .toArray();
    const urls = [
      ...routes.map((route) => ({ path: route, date: new Date() })),
      ...products.map((product) => ({
        path: "/products/" + encodeURIComponent(product.slug),
        date: product.updated_at || new Date(),
      })),
    ];
    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((item) => `<url><loc>${escape(siteOrigin() + item.path)}</loc><lastmod>${new Date(item.date).toISOString()}</lastmod></url>`).join("")}</urlset>`,
      );
  });
  app.use(
    "/assets",
    express.static(path.join(directory, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );
  app.use(express.static(directory, { index: false, maxAge: "1h" }));
  app.get("/{*path}", async (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/static/"))
      return next();
    // Missing source image paths must return 404 instead of the SPA document.
    if (path.extname(req.path) && !req.path.endsWith(".html")) return next();
    const inherited = Object.keys(metadata)
      .filter(
        (route) =>
          route !== "/" &&
          (req.path === route || req.path.startsWith(route + "/")),
      )
      .sort((a, b) => a.length - b.length);
    let meta = { ...metadata["/"] };
    for (const route of inherited) meta = { ...meta, ...metadata[route] };
    const productMatch = req.path.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const product = await db.collection("products").findOne({
        slug: decodeURIComponent(productMatch[1]),
        status: "active",
        ...active,
      });
      if (product)
        meta = {
          ...meta,
          title: product.seo?.meta_title || product.name,
          description:
            product.seo?.meta_description ||
            product.short_description ||
            product.description,
        };
    }
    const defaultTitle =
      metadata["/"].title?.default || "Bharath Delight Foods";
    const title =
      typeof meta.title === "string"
        ? meta.title
        : meta.title?.default || defaultTitle;
    const origin = (
      process.env.FRONTEND_ORIGIN ||
      meta.metadataBase ||
      "http://localhost:3000"
    ).replace(/\/$/, "");
    const canonical = new URL(req.path, origin).href;
    const image = new URL(
      meta.openGraph?.images?.[0]?.url || "/og-bharath.png",
      origin,
    ).href;
    const tags = [
      `<title>${escape(title)}</title>`,
      `<meta name="description" content="${escape(meta.description)}">`,
      `<link rel="canonical" href="${escape(canonical)}">`,
      `<meta property="og:title" content="${escape(title)}">`,
      `<meta property="og:description" content="${escape(meta.description)}">`,
      `<meta property="og:url" content="${escape(canonical)}">`,
      `<meta property="og:image" content="${escape(image)}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="Bharath Delight Foods">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escape(title)}">`,
      `<meta name="twitter:description" content="${escape(meta.description)}">`,
      `<meta name="twitter:image" content="${escape(image)}">`,
    ];
    if (meta.robots?.index === false)
      tags.push('<meta name="robots" content="noindex,nofollow">');
    if (meta.keywords)
      tags.push(
        `<meta name="keywords" content="${escape(Array.isArray(meta.keywords) ? meta.keywords.join(", ") : meta.keywords)}">`,
      );
    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Bharath Delight Foods",
      url: origin + "/",
      logo: {
        "@type": "ImageObject",
        url: origin + "/logo.png",
        width: 200,
        height: 60,
      },
      description: metadata["/"].description,
    };
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(organization).replaceAll("<", "\\u003c")}</script>`,
    );
    res
      .type("html")
      .set("Cache-Control", "no-cache")
      .send(
        template
          .replace(/<title>[\s\S]*?<\/title>/, "")
          .replace("</head>", tags.join("\n") + "\n</head>"),
      );
  });
}
