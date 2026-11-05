import { Router } from "express";
import {
  active,
  now,
  oid,
  fail,
  ok,
  get,
  insert,
  update,
  authenticated,
  roles,
  validate,
  pick,
  limit,
  skip,
  regex,
  money,
  amount,
  settings,
  inventoryView,
  transaction,
  notify,
} from "../core.js";
import { queueEmail } from "../documents.js";

const publicSettings = [
  "tax_percentage",
  "shipping_fee",
  "free_shipping_threshold",
  "support_contact",
  "fssai_number",
  "gst_number",
  "brand_name",
  "public_support_email",
  "public_support_phone",
  "working_hours",
  "seo_keywords",
  "brand_tagline",
];
const settingFields = [
  ...publicSettings,
  "upi_id",
  "support_email",
  "support_phone",
  "business_address",
  "payment_display_name",
  "upi_instructions",
];
export function settingsRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();
  if (!admin) {
    router.get("/public", async (req, res) =>
      ok(res, pick(await settings(db), publicSettings)),
    );
    return router;
  }
  router.use(...roles("admin"));
  router.get("/", async (req, res) => ok(res, await settings(db)));
  router.patch("/", validate("SettingsUpdateSchema"), async (req, res) => {
    const fields = pick(req.body, settingFields);
    for (const key of [
      "tax_percentage",
      "shipping_fee",
      "free_shipping_threshold",
    ])
      if (Object.hasOwn(fields, key)) {
        if (
          fields[key] == null ||
          !amount(fields[key]).isFinite() ||
          amount(fields[key]).lt(0) ||
          (key === "tax_percentage" && amount(fields[key]).gt(100))
        )
          fail(`Invalid ${key}.`);
        fields[key] = money(fields[key]);
      }
    if (fields.upi_id != null && !fields.upi_id.includes("@"))
      fail("Invalid UPI ID.");
    if (fields.fssai_number && !/^\d{14}$/.test(fields.fssai_number))
      fail("FSSAI number must have 14 digits.");
    if (
      fields.gst_number &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        fields.gst_number.toUpperCase(),
      )
    )
      fail("Invalid GST number.");
    for (const key of ["support_phone", "public_support_phone"])
      if (
        fields[key] &&
        !/^(?:\+91)?\d{10}$/.test(fields[key].replace(/[ -]/g, ""))
      )
        fail(`Invalid ${key}.`);
    const current = await settings(db);
    ok(res, await update(db, "settings", String(current._id), fields));
  });
  return router;
}
async function refreshRatings(db, productId, session) {
  const reviews = await db
    .collection("reviews")
    .find({ product_id: productId, is_approved: true, ...active }, { session })
    .toArray();
  const ratings = {
    average_rating: reviews.length
      ? Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length) *
            100,
        ) / 100
      : 0,
    review_count: reviews.length,
    total_reviews: reviews.length,
  };
  for (let star = 1; star <= 5; star++)
    ratings[`star_${star}_count`] = reviews.filter(
      (review) => review.rating === star,
    ).length;
  await update(db, "products", productId, { ratings }, session);
}
export function reviewRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();
  if (admin) {
    router.use(...roles("admin", "warehouse"));
    router.get("/summary", async (req, res) => {
      const groups = await db
        .collection("reviews")
        .aggregate([
          { $match: active },
          { $group: { _id: "$moderation_status", count: { $sum: 1 } } },
        ])
        .toArray();
      const result = { total: 0, pending: 0, approved: 0, rejected: 0 };
      for (const group of groups) {
        result[group._id || "pending"] = group.count;
        result.total += group.count;
      }
      ok(res, result);
    });
    router.get("/", async (req, res) => {
      const filter = { ...active };
      if (req.query.status) filter.moderation_status = String(req.query.status);
      const documents = await db
        .collection("reviews")
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip(req.query.skip))
        .limit(limit(req.query.limit))
        .toArray();
      const results = await Promise.all(
        documents.map(async (document) => {
          const [product, customer] = await Promise.all([
            db
              .collection("products")
              .findOne({ _id: oid(document.product_id) }),
            db
              .collection("customers")
              .findOne({ _id: oid(document.customer_id) }),
          ]);
          return {
            ...document,
            product_name: product?.name || "",
            customer_name:
              `${customer?.personal_details.first_name || ""} ${customer?.personal_details.last_name || ""}`.trim(),
            customer_email: customer?.auth.email || "",
          };
        }),
      );
      const search = String(req.query.search || "").toLowerCase();
      ok(
        res,
        search
          ? results.filter((item) =>
              [
                item.product_name,
                item.customer_name,
                item.customer_email,
                item.title,
                item.comment,
              ].some((value) => value.toLowerCase().includes(search)),
            )
          : results,
      );
    });
    for (const [operation, status] of [
      ["approve", "approved"],
      ["reject", "rejected"],
      ["reopen", "pending"],
    ])
      router.patch(`/:id/${operation}`, roles("admin"), async (req, res) => {
        const result = await transaction(context, async (session) => {
          const review = await update(
            db,
            "reviews",
            req.params.id,
            { moderation_status: status, is_approved: status === "approved" },
            session,
          );
          await refreshRatings(db, review.product_id, session);
          return review;
        });
        ok(res, result);
      });
    return router;
  }
  router.get("/product/:product_id", async (req, res) => {
    const product = await get(db, "products", req.params.product_id);
    ok(res, {
      product: { name: product.name },
      ratings: {
        average: product.ratings?.average_rating || 0,
        total: product.ratings?.total_reviews || 0,
      },
      reviews: await db
        .collection("reviews")
        .find({
          product_id: req.params.product_id,
          is_approved: true,
          ...active,
        })
        .sort({ created_at: -1 })
        .skip(skip(req.query.skip))
        .limit(limit(req.query.limit))
        .toArray(),
    });
  });
  router.post(
    "/",
    authenticated,
    validate("ReviewCreate"),
    async (req, res) => {
      const result = await transaction(context, async (session) => {
        const order = await get(db, "orders", req.body.order_id, session);
        const customerId = String(req.user._id);
        if (order.customer_id !== customerId)
          fail("You can only review your own orders.", 403);
        if (
          order.fulfillment_status !== "delivered" ||
          !order.items.some((item) => item.product_id === req.body.product_id)
        )
          fail("Review requires a delivered order containing the product.");
        if (
          await db.collection("reviews").findOne(
            {
              customer_id: customerId,
              product_id: req.body.product_id,
              ...active,
            },
            { session },
          )
        )
          fail("You have already reviewed this product.", 409);
        return insert(
          db,
          "reviews",
          {
            ...pick(req.body, [
              "product_id",
              "order_id",
              "rating",
              "title",
              "comment",
            ]),
            customer_id: customerId,
            is_verified_purchase: true,
            moderation_status: "pending",
            is_approved: false,
          },
          session,
        );
      });
      ok(res, result);
    },
  );
  router.patch(
    "/:id",
    authenticated,
    validate("ReviewUpdate"),
    async (req, res) => {
      const result = await transaction(context, async (session) => {
        const review = await get(db, "reviews", req.params.id, session);
        if (review.customer_id !== String(req.user._id))
          fail("Access forbidden.", 403);
        if (Date.now() - new Date(review.created_at).getTime() > 30 * 86400000)
          fail("Review edit period has expired.");
        const updated = await update(
          db,
          "reviews",
          req.params.id,
          {
            ...pick(req.body, ["rating", "title", "comment"]),
            moderation_status: "pending",
            is_approved: false,
          },
          session,
        );
        await refreshRatings(db, review.product_id, session);
        return updated;
      });
      ok(res, result);
    },
  );
  router.delete("/:id", authenticated, async (req, res) => {
    await transaction(context, async (session) => {
      const review = await get(db, "reviews", req.params.id, session);
      if (
        review.customer_id !== String(req.user._id) &&
        req.user.auth.role !== "admin"
      )
        fail("Access forbidden.", 403);
      await update(
        db,
        "reviews",
        req.params.id,
        { is_deleted: true, deleted_at: now() },
        session,
      );
      await refreshRatings(db, review.product_id, session);
    });
    ok(res);
  });
  return router;
}
export function notificationRoutes({ db }, admin = false) {
  const router = Router();
  router.use(authenticated);
  if (admin) {
    router.get("/", roles("warehouse", "admin"), async (req, res) =>
      ok(
        res,
        await db
          .collection("notifications")
          .find(active)
          .sort({ created_at: -1 })
          .skip(skip(req.query.skip))
          .limit(limit(req.query.limit))
          .toArray(),
      ),
    );
    return router;
  }
  const filterFor = (req) => ({
    ...active,
    $or: [
      { target_user_id: String(req.user._id) },
      { role_target: req.user.auth.role },
      ...(req.user.auth.role === "admin" ? [{ role_target: "warehouse" }] : []),
    ],
  });
  router.get("/me", async (req, res) =>
    ok(
      res,
      await db
        .collection("notifications")
        .find(filterFor(req))
        .sort({ created_at: -1 })
        .skip(skip(req.query.skip))
        .limit(limit(req.query.limit))
        .toArray(),
    ),
  );
  router.patch("/read-all", async (req, res) => {
    const result = await db
      .collection("notifications")
      .updateMany(
        { ...filterFor(req), is_read: false },
        { $set: { is_read: true, read_at: now() } },
      );
    ok(res, { modified_count: result.modifiedCount });
  });
  router.patch("/:id/read", async (req, res) => {
    const result = await db
      .collection("notifications")
      .findOneAndUpdate(
        { ...filterFor(req), _id: oid(req.params.id) },
        { $set: { is_read: true, read_at: now() } },
        { returnDocument: "after" },
      );
    if (!result) fail("Notification not found.", 404);
    ok(res, result);
  });
  return router;
}
export function adminRoutes({ db }) {
  const router = Router();
  router.use(...roles("warehouse", "admin"));
  router.get("/dashboard", async (req, res) => {
    const count = (collection, filter = {}) =>
      db.collection(collection).countDocuments({ ...active, ...filter });
    const [
      total_orders,
      total_customers,
      total_products,
      pending_payments,
      confirmed_orders,
      shipped_orders,
      delivered_orders,
      pending_review_count,
      recent_orders,
      pending_payment_proofs,
      pending_reviews,
      inventories,
      revenue,
    ] = await Promise.all([
      count("orders"),
      count("customers"),
      count("products", { status: "active" }),
      count("payments", { status: "proof_submitted" }),
      count("orders", { order_status: "confirmed" }),
      count("orders", { fulfillment_status: "shipped" }),
      count("orders", { fulfillment_status: "delivered" }),
      count("reviews", { moderation_status: "pending" }),
      db
        .collection("orders")
        .find(
          req.user.auth.role === "warehouse"
            ? { ...active, order_status: "confirmed" }
            : active,
        )
        .sort({ created_at: -1 })
        .limit(10)
        .toArray(),
      db
        .collection("payments")
        .find({ ...active, status: "proof_submitted" })
        .limit(10)
        .toArray(),
      db
        .collection("reviews")
        .find({ ...active, moderation_status: "pending" })
        .limit(10)
        .toArray(),
      db.collection("inventories").find(active).toArray(),
      db
        .collection("orders")
        .aggregate([
          { $match: { ...active, payment_status: "paid" } },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $convert: {
                    input: "$pricing.grand_total",
                    to: "decimal",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ])
        .toArray(),
    ]);
    const low = inventories
      .map(inventoryView)
      .filter((item) => item.is_low_stock);
    const response = {
      total_orders,
      total_customers,
      total_products,
      pending_payments,
      confirmed_orders,
      shipped_orders,
      delivered_orders,
      pending_review_count,
      recent_orders,
      pending_payment_proofs,
      pending_reviews,
      low_stock_count: low.length,
      low_stock_alerts: low.slice(0, 10),
      total_revenue: revenue[0]?.total || money(0),
    };
    if (req.user.auth.role === "warehouse") {
      for (const field of [
        "total_orders",
        "total_revenue",
        "pending_payments",
        "pending_review_count",
        "total_customers",
        "total_products",
        "pending_payment_proofs",
        "pending_reviews",
      ])
        response[field] = null;
    }
    ok(res, response);
  });
  router.get("/production-checklist", roles("admin"), async (req, res) =>
    ok(res, {
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: true,
        node_backend: true,
        secret_configured: process.env.SECRET_KEY?.length >= 32,
        email_configured: Boolean(process.env.BREVO_API_KEY),
        google_configured: Boolean(process.env.GOOGLE_CLIENT_ID),
        otp_configured: Boolean(process.env.OTP_WEBHOOK_URL),
      },
    }),
  );
  return router;
}
export function contactRoutes({ db }) {
  const router = Router();
  router.post("/contact", async (req, res) => {
    const payload = pick(req.body, [
      "full_name",
      "email",
      "phone",
      "inquiry_type",
      "message",
    ]);
    if (
      typeof payload.full_name !== "string" ||
      payload.full_name.trim().length < 2 ||
      payload.full_name.length > 100 ||
      typeof payload.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
      typeof payload.phone !== "string" ||
      payload.phone.length < 10 ||
      payload.phone.length > 15 ||
      typeof payload.inquiry_type !== "string" ||
      !payload.inquiry_type.length ||
      payload.inquiry_type.length > 80 ||
      typeof payload.message !== "string" ||
      payload.message.length < 10 ||
      payload.message.length > 2000
    )
      fail("Invalid contact inquiry.", 422);
    await insert(db, "support_tickets", payload);
    await queueEmail(db, "contact_inquiry", process.env.ADMIN_EMAIL, payload);
    ok(
      res,
      null,
      "Your inquiry has been received. We will get back to you within 24 hours.",
    );
  });
  return router;
}
