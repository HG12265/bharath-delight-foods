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
  roles,
  pick,
  amount,
  money,
  audit,
  transaction,
} from "../core.js";

export function offerRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();

  // Public: Get all active offers
  if (!admin) {
    router.get("/active", async (req, res) => {
      const activeOffers = await db
        .collection("offers")
        .find({ status: "active", ...active })
        .sort({ updated_at: -1 })
        .toArray();
      ok(res, activeOffers);
    });
    return router;
  }

  // Admin-only endpoints
  router.use(...roles("admin"));

  // GET all offers with filters & stats
  router.get("/", async (req, res) => {
    const filter = { ...active };
    const statusQuery = String(req.query.status || "all").toLowerCase();
    if (statusQuery && statusQuery !== "all") {
      filter.status = statusQuery;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { badge_text: searchRegex },
        { "items.product_name": searchRegex },
        { "items.variant_sku": searchRegex },
        { "items.variant_title": searchRegex },
      ];
    }

    const [allOffers, statsData] = await Promise.all([
      db.collection("offers").find(filter).sort({ created_at: -1 }).toArray(),
      db
        .collection("offers")
        .aggregate([
          { $match: { ...active } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const statsMap = Object.fromEntries(
      statsData.map((s) => [s._id, s.count]),
    );

    const stats = {
      total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      active: statsMap.active || 0,
      disabled: statsMap.disabled || 0,
      draft: statsMap.draft || 0,
      cancelled: statsMap.cancelled || 0,
    };

    ok(res, {
      offers: allOffers,
      stats,
    });
  });

  // GET single offer by ID
  router.get("/:id", async (req, res) => {
    const offer = await get(db, "offers", req.params.id);
    ok(res, offer);
  });

  // Helper to validate and calculate offer items against database products & variants
  async function prepareOfferItems(rawItems, session) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      fail("At least one product variant must be selected for the offer.", 400);
    }

    const preparedItems = [];
    for (const item of rawItems) {
      if (!item.product_id || !item.variant_id) {
        fail("Product ID and Variant ID are required for all offer items.", 400);
      }

      // Verify product and variant in database
      const product = await get(db, "products", item.product_id, session);
      const variant = product.variants?.find(
        (v) => v.variant_id === item.variant_id || v.sku === item.variant_sku,
      );

      if (!variant) {
        fail(
          `Variant not found on product "${product.name}".`,
          404,
        );
      }

      const origPrice = Number(amount(variant.price).toFixed(2));
      const discountType = item.discount_type === "fixed" ? "fixed" : "percentage";
      const discountVal = Number(item.discount_value);

      if (isNaN(discountVal) || discountVal <= 0) {
        fail(
          `Discount value must be greater than zero for ${variant.title || variant.volume_weight || variant.sku}.`,
          400,
        );
      }

      let calculatedOfferPrice = origPrice;
      if (discountType === "percentage") {
        if (discountVal >= 100) {
          fail("Percentage discount must be less than 100%.", 400);
        }
        const discountAmt = (origPrice * discountVal) / 100;
        calculatedOfferPrice = Math.max(1, origPrice - discountAmt);
      } else {
        if (discountVal >= origPrice) {
          fail(
            `Fixed discount (₹${discountVal}) cannot exceed or equal variant original price (₹${origPrice}).`,
            400,
          );
        }
        calculatedOfferPrice = Math.max(1, origPrice - discountVal);
      }

      // Round to 2 decimal places
      calculatedOfferPrice = Math.round(calculatedOfferPrice * 100) / 100;

      preparedItems.push({
        product_id: String(product._id),
        product_name: product.name,
        product_slug: product.slug,
        variant_id: variant.variant_id,
        variant_sku: variant.sku,
        variant_title: variant.title || variant.volume_weight || "Standard",
        original_price: origPrice,
        discount_type: discountType,
        discount_value: discountVal,
        offer_price: calculatedOfferPrice,
      });
    }

    return preparedItems;
  }

  // POST Create Offer
  router.post("/", async (req, res) => {
    const { title, badge_text, description, status, items } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      fail("Offer title is required.", 400);
    }

    const offerStatus = ["active", "draft"].includes(status) ? status : "draft";

    const saved = await transaction(context, async (session) => {
      const preparedItems = await prepareOfferItems(items, session);

      const offerDoc = {
        title: title.trim(),
        badge_text: (badge_text && String(badge_text).trim()) || "SPECIAL OFFER",
        description: description ? String(description).trim() : "",
        status: offerStatus,
        items: preparedItems,
        created_by: req.user?.auth?.email || "admin",
      };

      const doc = await insert(db, "offers", offerDoc, session);
      await audit(db, req, "CREATE_OFFER", "offers", doc._id, {}, session);
      return doc;
    });

    ok(res, saved, "Offer created successfully.", 201);
  });

  // PATCH Edit Offer
  router.patch("/:id", async (req, res) => {
    const offerId = req.params.id;
    const { title, badge_text, description, status, items } = req.body;

    const saved = await transaction(context, async (session) => {
      const existing = await get(db, "offers", offerId, session);

      const updateData = {};
      if (title !== undefined) {
        if (!title || typeof title !== "string" || !title.trim()) {
          fail("Offer title cannot be empty.", 400);
        }
        updateData.title = title.trim();
      }

      if (badge_text !== undefined) {
        updateData.badge_text = String(badge_text).trim() || "SPECIAL OFFER";
      }

      if (description !== undefined) {
        updateData.description = String(description).trim();
      }

      if (status !== undefined) {
        if (!["active", "disabled", "draft", "cancelled"].includes(status)) {
          fail("Invalid offer status.", 400);
        }
        updateData.status = status;
      }

      if (items !== undefined) {
        updateData.items = await prepareOfferItems(items, session);
      }

      const doc = await update(db, "offers", offerId, updateData, session);
      await audit(db, req, "UPDATE_OFFER", "offers", doc._id, {}, session);
      return doc;
    });

    ok(res, saved, "Offer updated successfully.");
  });

  // PATCH Quick Status Update (Publish / Disable / Cancel)
  router.patch("/:id/status", async (req, res) => {
    const offerId = req.params.id;
    const { status } = req.body;

    if (!["active", "disabled", "draft", "cancelled"].includes(status)) {
      fail("Invalid offer status.", 400);
    }

    const saved = await transaction(context, async (session) => {
      await get(db, "offers", offerId, session);
      const doc = await update(
        db,
        "offers",
        offerId,
        { status },
        session,
      );
      await audit(
        db,
        req,
        "UPDATE_OFFER_STATUS",
        "offers",
        doc._id,
        { new_status: status },
        session,
      );
      return doc;
    });

    ok(res, saved, `Offer status updated to ${status}.`);
  });

  // DELETE Remove Offer (Soft delete)
  router.delete("/:id", async (req, res) => {
    const offerId = req.params.id;
    await transaction(context, async (session) => {
      await get(db, "offers", offerId, session);
      await update(
        db,
        "offers",
        offerId,
        {
          is_deleted: true,
          deleted_at: now(),
        },
        session,
      );
      await audit(db, req, "DELETE_OFFER", "offers", offerId, {}, session);
    });

    ok(res, null, "Offer removed successfully.");
  });

  return router;
}
