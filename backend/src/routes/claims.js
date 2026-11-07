import { Router } from "express";
import {
  active,
  now,
  uid,
  oid,
  fail,
  ok,
  insert,
  authenticated,
  roles,
} from "../core.js";

export function claimsRoutes({ db }) {
  const router = Router();

  // 1. Submit damage claim (Customer)
  router.post("/", authenticated, async (req, res) => {
    const {
      order_id,
      product_id,
      product_name,
      variant_title,
      quantity,
      issue_type,
      description,
      images,
      preferred_resolution,
      contact_phone,
    } = req.body || {};

    if (!order_id) fail("Order ID is required.", 422);
    if (!product_name) fail("Product name is required.", 422);
    if (!issue_type) fail("Issue type is required.", 422);
    if (!description?.trim()) fail("Please provide a description of the damage.", 422);

    // Verify order exists and belongs to the customer
    let orderOid;
    try {
      orderOid = oid(order_id);
    } catch {
      fail("Invalid Order ID format.", 400);
    }

    const order = await db.collection("orders").findOne({
      _id: orderOid,
      customer_id: req.user._id,
      ...active,
    });

    if (!order) {
      fail("Order not found or does not belong to your account.", 404);
    }

    // Generate readable claim ID e.g. CLM-849201
    const claim_id = `CLM-${Date.now().toString().slice(-6)}-${uid().slice(0, 3).toUpperCase()}`;

    const customerName = [
      req.user.personal_details?.first_name,
      req.user.personal_details?.last_name,
    ].filter(Boolean).join(" ") || "Customer";

    const claim = await insert(db, "damage_claims", {
      claim_id,
      order_id: order._id,
      order_number: order.invoice_number || String(order._id),
      customer_id: req.user._id,
      customer_name: customerName,
      customer_email: req.user.auth?.email || "",
      customer_phone: contact_phone || req.user.auth?.phone || "",
      product_id: product_id || null,
      product_name: product_name.trim(),
      variant_title: variant_title || "Standard",
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      issue_type,
      description: description.trim(),
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      preferred_resolution: preferred_resolution === "refund" ? "refund" : "replacement",
      status: "pending", // pending, approved, rejected, resolved
      admin_notes: null,
      resolution_details: null,
      resolved_at: null,
    });

    ok(res, claim, "Damage claim submitted successfully. Our team will review it shortly.", 201);
  });

  // 2. Get customer's claims
  router.get("/my-claims", authenticated, async (req, res) => {
    const claims = await db
      .collection("damage_claims")
      .find({
        customer_id: req.user._id,
        ...active,
      })
      .sort({ created_at: -1 })
      .toArray();

    ok(res, claims);
  });

  // 3. Get claims by specific order ID
  router.get("/order/:order_id", authenticated, async (req, res) => {
    let orderOid;
    try {
      orderOid = oid(req.params.order_id);
    } catch {
      fail("Invalid Order ID format.", 400);
    }

    const filter = {
      order_id: orderOid,
      ...active,
    };
    if (req.user.auth?.role !== "admin" && req.user.auth?.role !== "warehouse") {
      filter.customer_id = req.user._id;
    }

    const claims = await db
      .collection("damage_claims")
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    ok(res, claims);
  });

  // 4. Admin: List all claims
  router.get("/admin", authenticated, roles("admin", "warehouse"), async (req, res) => {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = { ...active };
    if (status && status !== "all") {
      filter.status = status;
    }

    const total = await db.collection("damage_claims").countDocuments(filter);
    const claims = await db
      .collection("damage_claims")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    // Also get quick stats
    const pendingCount = await db.collection("damage_claims").countDocuments({ status: "pending", ...active });
    const approvedCount = await db.collection("damage_claims").countDocuments({ status: "approved", ...active });
    const resolvedCount = await db.collection("damage_claims").countDocuments({ status: "resolved", ...active });

    ok(res, {
      claims,
      total,
      stats: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        resolved: resolvedCount,
      },
    });
  });

  // 5. Admin: Update claim status & resolution
  router.patch("/admin/:id/status", authenticated, roles("admin"), async (req, res) => {
    const { status, admin_notes, resolution_details } = req.body || {};
    if (!["pending", "approved", "rejected", "resolved"].includes(status)) {
      fail("Invalid claim status.", 422);
    }

    let claimOid = null;
    try {
      claimOid = oid(req.params.id);
    } catch {
      // not an ObjectId, will search by claim_id
    }

    const orClauses = [{ claim_id: req.params.id }];
    if (claimOid) orClauses.unshift({ _id: claimOid });

    const claim = await db.collection("damage_claims").findOne({
      $or: orClauses,
      ...active,
    });

    if (!claim) {
      fail("Damage claim not found.", 404);
    }

    const updateFields = {
      status,
      updated_at: now(),
    };
    if (admin_notes !== undefined) updateFields.admin_notes = admin_notes;
    if (resolution_details !== undefined) updateFields.resolution_details = resolution_details;
    if (status === "resolved" || status === "rejected") {
      updateFields.resolved_at = now();
    }

    await db.collection("damage_claims").updateOne(
      { _id: claim._id },
      { $set: updateFields }
    );

    const updated = await db.collection("damage_claims").findOne({ _id: claim._id });
    ok(res, updated, `Claim marked as ${status} successfully.`);
  });

  return router;
}

