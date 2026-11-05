import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import crypto from "node:crypto";
import { active, now, ok, fail, transaction, get } from "./core.js";
import { authContext, authRoutes, customerRoutes } from "./routes/auth.js";
import {
  productRoutes,
  categoryRoutes,
  searchRoutes,
} from "./routes/catalog.js";
import {
  cartRoutes,
  wishlistRoutes,
  inventoryRoutes,
  checkoutRoutes,
  expireCheckout,
} from "./routes/commerce.js";
import { orderRoutes, paymentRoutes, shipmentRoutes } from "./routes/orders.js";
import {
  settingsRoutes,
  reviewRoutes,
  notificationRoutes,
  adminRoutes,
  contactRoutes,
} from "./routes/admin.js";
import { mediaRoutes } from "./routes/media.js";
import { sendPendingEmails } from "./documents.js";
import { serveFrontend } from "./frontend.js";

export function createApp(context) {
  const app = express();
  app.locals.routes = [];
  const originalUse = app.use.bind(app);
  app.use = function (...args) {
    const prefix = args[0];
    for (const router of args.slice(1))
      if (typeof prefix === "string" && router?.stack) {
        for (const layer of router.stack)
          if (layer.route) {
            for (const routePath of [layer.route.path].flat()) {
              for (const method of Object.keys(layer.route.methods))
                app.locals.routes.push({
                  method: method.toUpperCase(),
                  path: (prefix + routePath).replace(/\/$/, ""),
                });
            }
          }
      }
    return originalUse(...args);
  };
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
  app.use((req, res, next) => {
    req.correlationId = crypto.randomUUID();
    res.set("X-Correlation-ID", req.correlationId);
    next();
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", "https:", "http:", "data:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https:", "http:"],
          frameSrc: ["'self'"],
        },
      },
    }),
  );
  const origins = (
    process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        const isAllowed = origins.some((allowed) => {
          if (allowed === "*" || allowed === cleanOrigin) return true;
          if (allowed.startsWith("*.") && cleanOrigin.endsWith(allowed.slice(1))) return true;
          return false;
        });
        callback(null, isAllowed);
      },
      credentials: true,
      exposedHeaders: [
        "X-Guest-Token",
        "Content-Disposition",
        "X-Correlation-ID",
      ],
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use((req, res, next) =>
    req.path.startsWith("/api/v1/media/upload/mock/")
      ? next()
      : express.json({ limit: "1mb" })(req, res, next),
  );
  app.use(
    "/static",
    express.static(path.resolve(process.env.STATIC_DIR || "static"), {
      maxAge: "30d",
      immutable: true,
      etag: true,
      lastModified: true,
      dotfiles: "deny",
    }),
  );
  if (process.env.SERVE_FRONTEND !== "true")
    app.get("/", (req, res) =>
      res.json({
        project_name: "Bharath Delight Foods",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        status: "running",
      }),
    );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api/v1", authContext(context.db));
  app.get("/api/v1/health", (req, res) =>
    ok(res, { status: "healthy", timestamp: now(), version: "1.0.0" }),
  );
  app.get(
    ["/api/v1/readiness", "/api/v1/health/readiness"],
    async (req, res) => {
      await context.db.command({ ping: 1 });
      ok(res, { status: "ready", mongodb: "connected" });
    },
  );
  app.use("/api/v1/auth", authRoutes(context));
  app.use("/api/v1/customers", customerRoutes(context));
  app.use("/api/v1/products", productRoutes(context));
  app.use("/api/v1/categories", categoryRoutes(context));
  app.use("/api/v1/search", searchRoutes(context));
  app.use("/api/v1/media", mediaRoutes(context));
  app.use("/api/v1/carts", cartRoutes(context));
  app.use("/api/v1/wishlists", wishlistRoutes(context));
  app.use("/api/v1/inventories", inventoryRoutes(context));
  app.use("/api/v1/checkouts", checkoutRoutes(context));
  for (const [prefix, routes] of [
    ["orders", orderRoutes],
    ["payments", paymentRoutes],
    ["shipments", shipmentRoutes],
    ["settings", settingsRoutes],
    ["reviews", reviewRoutes],
    ["notifications", notificationRoutes],
  ]) {
    app.use(`/api/v1/${prefix}`, routes(context));
    app.use(`/api/v1/admin/${prefix}`, routes(context, true));
  }
  app.use("/api/v1/admin", adminRoutes(context));
  app.use(
    "/api/v1",
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    contactRoutes(context),
  );
  if (process.env.SERVE_FRONTEND === "true") serveFrontend(app, context.db);
  app.use((req, res) =>
    res.status(404).json({
      success: false,
      message: "Route not found.",
      data: null,
      errors: [{ code: "NOT_FOUND" }],
    }),
  );
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const duplicate = error.code === 11000;
    const status = duplicate ? 409 : error.status || 500;
    if (status >= 500)
      console.error({
        correlation_id: req.correlationId,
        message: error.message,
      });
    res.status(status).json({
      success: false,
      message: duplicate
        ? "Record already exists. Refresh and retry the request."
        : status >= 500
          ? "An internal error occurred. Please try again."
          : error.message,
      data: null,
      errors: [
        {
          code: duplicate ? "DUPLICATE_RECORD" : error.code || "REQUEST_FAILED",
          details: error.details || null,
        },
      ],
      correlation_id: req.correlationId,
    });
  });
  return app;
}
export async function initializeIndexes(db) {
  const indexes = [
    [
      "customers",
      { "auth.email": 1 },
      {
        unique: true,
        partialFilterExpression: { "auth.email": { $type: "string" } },
        name: "node_customer_email",
      },
    ],
    [
      "customers",
      { "auth.phone": 1 },
      {
        unique: true,
        partialFilterExpression: { "auth.phone": { $type: "string" } },
        name: "node_customer_phone",
      },
    ],
    ["products", { slug: 1 }, { unique: true }],
    ["products", { status: 1, is_deleted: 1, created_at: -1 }, {}],
    ["products", { category_id: 1, status: 1, min_price: 1 }, {}],
    ["products", { "variants.sku": 1 }, { unique: true, sparse: true }],
    ["categories", { slug: 1 }, { unique: true }],
    ["inventories", { sku: 1 }, { unique: true }],
    ["orders", { order_number: 1 }, { unique: true }],
    [
      "orders",
      { checkout_id: 1, node_version: 1 },
      { unique: true, partialFilterExpression: { node_version: 1 } },
    ],
    ["orders", { customer_id: 1, created_at: -1 }, {}],
    [
      "payments",
      { order_id: 1, node_version: 1 },
      { unique: true, partialFilterExpression: { node_version: 1 } },
    ],
    [
      "shipments",
      { order_id: 1, node_version: 1 },
      { unique: true, partialFilterExpression: { node_version: 1 } },
    ],
    [
      "carts",
      { owner_key: 1 },
      {
        unique: true,
        partialFilterExpression: { owner_key: { $type: "string" } },
      },
    ],
    [
      "checkouts",
      { idempotency_key: 1, node_version: 1 },
      { unique: true, partialFilterExpression: { node_version: 1 } },
    ],
    ["checkouts", { status: 1, expires_at: 1 }, {}],
    ["wishlists", { customer_id: 1 }, { unique: true }],
    [
      "reviews",
      { customer_id: 1, product_id: 1, node_version: 1 },
      {
        unique: true,
        partialFilterExpression: { node_version: 1, is_deleted: false },
      },
    ],
    ["notifications", { target_user_id: 1, created_at: -1 }, {}],
    ["media_assets", { storage_key: 1 }, { unique: true }],
    ["inventory_movements", { sku: 1, timestamp: -1 }, {}],
    ["token_blacklist", { expires_at: 1 }, { expireAfterSeconds: 0 }],
    ["otp_sessions", { expires_at: 1 }, { expireAfterSeconds: 0 }],
    ["email_outbox", { status: 1, next_attempt_at: 1 }, {}],
  ];
  for (const [collection, keys, options] of indexes) {
    let existing = [];
    try {
      existing = await db.collection(collection).listIndexes().toArray();
    } catch (error) {
      if (error.code !== 26) throw error;
    }
    // Reuse compatible indexes installed by the Python application.
    if (
      existing.some(
        (index) =>
          JSON.stringify(index.key) === JSON.stringify(keys) &&
          (!options.unique || index.unique) &&
          (!options.partialFilterExpression ||
            JSON.stringify(index.partialFilterExpression) ===
              JSON.stringify(options.partialFilterExpression)),
      )
    )
      continue;
    await db.collection(collection).createIndex(keys, options);
    if (collection === "customers" && options.partialFilterExpression) {
      // Install the replacement before removing legacy indexes that treated null
      // phone/email values as a single unique value for every Google account.
      for (const index of existing) {
        if (
          JSON.stringify(index.key) === JSON.stringify(keys) &&
          index.unique &&
          !index.partialFilterExpression
        ) {
          await db.collection(collection).dropIndex(index.name);
        }
      }
    }
  }
}
export async function backgroundWork(context) {
  const expired = await context.db
    .collection("checkouts")
    .find({
      ...active,
      status: { $in: ["initiated", "completed"] },
      expires_at: { $lt: now() },
    })
    .limit(100)
    .toArray();
  for (const candidate of expired) {
    await transaction(context, async (session) => {
      const checkout = await get(
        context.db,
        "checkouts",
        String(candidate._id),
        session,
      );
      if (!["initiated", "completed"].includes(checkout.status)) return;
      if (
        await context.db
          .collection("orders")
          .findOne(
            { checkout_id: String(checkout._id), ...active },
            { session },
          )
      )
        return;
      await expireCheckout(context.db, checkout, session);
    });
  }
  await sendPendingEmails(context.db);
}
