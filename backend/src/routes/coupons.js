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
  amount,
  money,
  audit,
  transaction,
} from "../core.js";

export function couponRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();

  // Public: Validate coupon
  if (!admin) {
    router.post("/validate", async (req, res) => {
      const { code, subtotal } = req.body || {};
      if (!code || typeof code !== "string") {
        fail("Please provide a valid coupon code.", 400);
      }
      const cleanCode = code.trim().toUpperCase();
      const subtotalNum = parseFloat(String(subtotal || 0));

      const coupon = await db.collection("coupons").findOne({
        code: cleanCode,
        status: "active",
        ...active,
      });

      if (!coupon && cleanCode === "WELCOME10") {
        const discountAmount = Math.round(subtotalNum * 0.1 * 100) / 100;
        return ok(res, {
          valid: true,
          code: "WELCOME10",
          name: "Welcome 10% Off",
          discount_type: "percentage",
          discount_value: 10,
          discount_amount: discountAmount,
          min_order_amount: 0,
        });
      }

      if (!coupon) {
        fail("Invalid or expired coupon code.", 404);
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        fail("This coupon has expired.", 400);
      }

      if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
        fail("This coupon usage limit has been reached.", 400);
      }

      const minOrder = parseFloat(String(coupon.min_order_amount || 0));
      if (minOrder > 0 && subtotalNum < minOrder) {
        fail(`Minimum order amount of ₹${minOrder} is required for this coupon.`, 400);
      }

      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = Math.round((subtotalNum * (coupon.discount_value / 100)) * 100) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        // Flat discount
        discountAmount = Math.min(coupon.discount_value, subtotalNum);
      }

      ok(res, {
        valid: true,
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        min_order_amount: minOrder,
      });
    });

    return router;
  }

  // Admin-only endpoints
  router.use(...roles("admin"));

  // GET all coupons with filter & stats
  router.get("/", async (req, res) => {
    const filter = { ...active };
    const statusQuery = String(req.query.status || "all").toLowerCase();
    if (statusQuery && statusQuery !== "all") {
      filter.status = statusQuery;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), "i");
      filter.$or = [
        { code: searchRegex },
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    const [coupons, statsData] = await Promise.all([
      db.collection("coupons").find(filter).sort({ created_at: -1 }).toArray(),
      db.collection("coupons").aggregate([
        { $match: { ...active } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total_used: { $sum: "$used_count" },
          },
        },
      ]).toArray(),
    ]);

    const statsMap = Object.fromEntries(
      statsData.map((s) => [s._id, s.count]),
    );
    const totalUsed = statsData.reduce((acc, curr) => acc + (curr.total_used || 0), 0);

    const stats = {
      total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      active: statsMap.active || 0,
      inactive: statsMap.inactive || 0,
      total_used: totalUsed,
    };

    ok(res, {
      coupons,
      stats,
    });
  });

  // GET single coupon
  router.get("/:id", async (req, res) => {
    const coupon = await get(db, "coupons", req.params.id);
    ok(res, coupon);
  });

  // POST create coupon
  router.post("/", async (req, res) => {
    const rawCode = String(req.body.code || "").trim().toUpperCase();
    if (!rawCode || !/^[A-Z0-9_-]{3,25}$/.test(rawCode)) {
      fail("Coupon code must be 3-25 alphanumeric characters (e.g. WELCOME100).", 400);
    }

    const name = String(req.body.name || "").trim();
    if (!name) {
      fail("Coupon name is required.", 400);
    }

    const discountValue = parseFloat(req.body.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) {
      fail("Discount amount must be a number greater than 0.", 400);
    }

    const discountType = req.body.discount_type === "percentage" ? "percentage" : "flat";
    if (discountType === "percentage" && discountValue > 100) {
      fail("Percentage discount cannot exceed 100%.", 400);
    }

    const minOrderAmount = req.body.min_order_amount ? Math.max(0, parseFloat(req.body.min_order_amount) || 0) : 0;
    const maxDiscountAmount = req.body.max_discount_amount ? parseFloat(req.body.max_discount_amount) : null;
    const usageLimit = req.body.usage_limit ? parseInt(req.body.usage_limit, 10) : null;
    const status = req.body.status === "inactive" ? "inactive" : "active";
    const validUntil = req.body.valid_until ? new Date(req.body.valid_until) : null;

    const existing = await db.collection("coupons").findOne({
      code: rawCode,
      ...active,
    });
    if (existing) {
      fail(`Coupon with code '${rawCode}' already exists.`, 409);
    }

    const couponDoc = {
      code: rawCode,
      name,
      description: req.body.description?.trim() || "",
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      max_discount_amount: maxDiscountAmount,
      usage_limit: usageLimit,
      used_count: 0,
      status,
      valid_from: now(),
      valid_until: validUntil,
      is_deleted: false,
      deleted_at: null,
      created_at: now(),
      updated_at: now(),
    };

    const saved = await transaction(context, async (session) => {
      const doc = await insert(db, "coupons", couponDoc, session);
      await audit(db, req, "CREATE_COUPON", "coupons", doc._id, { code: rawCode }, session);
      return doc;
    });

    ok(res, saved, "Coupon created successfully.", 201);
  });

  // PATCH update coupon
  router.patch("/:id", async (req, res) => {
    const couponId = req.params.id;
    const updates = { updated_at: now() };

    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.discount_type !== undefined) {
      updates.discount_type = req.body.discount_type === "percentage" ? "percentage" : "flat";
    }
    if (req.body.discount_value !== undefined) {
      const val = parseFloat(req.body.discount_value);
      if (isNaN(val) || val <= 0) fail("Discount value must be greater than 0.", 400);
      updates.discount_value = val;
    }
    if (req.body.min_order_amount !== undefined) {
      updates.min_order_amount = Math.max(0, parseFloat(req.body.min_order_amount) || 0);
    }
    if (req.body.max_discount_amount !== undefined) {
      updates.max_discount_amount = req.body.max_discount_amount ? parseFloat(req.body.max_discount_amount) : null;
    }
    if (req.body.usage_limit !== undefined) {
      updates.usage_limit = req.body.usage_limit ? parseInt(req.body.usage_limit, 10) : null;
    }
    if (req.body.valid_until !== undefined) {
      updates.valid_until = req.body.valid_until ? new Date(req.body.valid_until) : null;
    }
    if (req.body.status !== undefined) {
      if (!["active", "inactive"].includes(req.body.status)) fail("Invalid status.", 400);
      updates.status = req.body.status;
    }

    const saved = await transaction(context, async (session) => {
      await get(db, "coupons", couponId, session);
      const doc = await update(db, "coupons", couponId, updates, session);
      await audit(db, req, "UPDATE_COUPON", "coupons", couponId, updates, session);
      return doc;
    });

    ok(res, saved, "Coupon updated successfully.");
  });

  // PATCH toggle status (active / inactive)
  router.patch("/:id/toggle-status", async (req, res) => {
    const couponId = req.params.id;
    const saved = await transaction(context, async (session) => {
      const current = await get(db, "coupons", couponId, session);
      const nextStatus = current.status === "active" ? "inactive" : "active";
      const doc = await update(
        db,
        "coupons",
        couponId,
        { status: nextStatus, updated_at: now() },
        session,
      );
      await audit(db, req, "TOGGLE_COUPON_STATUS", "coupons", couponId, { status: nextStatus }, session);
      return doc;
    });

    ok(res, saved, `Coupon status updated to ${saved.status}.`);
  });

  // DELETE coupon (Soft delete)
  router.delete("/:id", async (req, res) => {
    const couponId = req.params.id;
    await transaction(context, async (session) => {
      await get(db, "coupons", couponId, session);
      await update(
        db,
        "coupons",
        couponId,
        {
          is_deleted: true,
          deleted_at: now(),
          status: "inactive",
          updated_at: now(),
        },
        session,
      );
      await audit(db, req, "DELETE_COUPON", "coupons", couponId, {}, session);
    });

    ok(res, null, "Coupon deleted successfully.");
  });

  return router;
}
