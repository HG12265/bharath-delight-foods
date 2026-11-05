import { Router } from "express";
import {
  active,
  now,
  uid,
  oid,
  fail,
  ok,
  get,
  insert,
  update,
  roles,
  validate,
  pick,
  limit,
  skip,
  amount,
  money,
  settings,
  owns,
  audit,
  notify,
  transaction,
  productViews,
} from "../core.js";
import { stockChange } from "./commerce.js";
import { invoicePdf, reportExport, queueEmail } from "../documents.js";

const transitions = {
  order_status: {
    pending_payment: ["confirmed", "cancelled"],
    confirmed: ["closed", "cancelled"],
    cancelled: [],
    closed: [],
  },
  payment_status: {
    pending: ["paid", "failed"],
    paid: ["refunded"],
    failed: ["pending"],
    refunded: [],
  },
  fulfillment_status: {
    pending: ["packed", "shipped", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  },
};
async function cancel(db, req, order, session) {
  if (order.order_status === "cancelled") return order;
  if (["shipped", "delivered"].includes(order.fulfillment_status))
    fail("Shipped or delivered orders cannot be cancelled.");
  if (
    order.payment_status === "paid" &&
    !["admin", "warehouse"].includes(req.user?.auth.role)
  )
    fail("Paid orders require administrator cancellation.");
  for (const item of order.items)
    await stockChange(
      db,
      item.sku,
      item.reserved_warehouse_id,
      item.quantity,
      "release",
      session,
      req,
    );
  const result = await update(
    db,
    "orders",
    String(order._id),
    { order_status: "cancelled", fulfillment_status: "cancelled" },
    session,
  );
  await notify(
    db,
    order.customer_id,
    "order_cancelled",
    "Order Cancelled",
    `Order ${order.order_number} has been cancelled.`,
    { order_id: String(order._id) },
    session,
  );
  await audit(db, req, "CANCEL_ORDER", "orders", order._id, {}, session);
  return result;
}
export function orderRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();
  if (admin) {
    router.use(...roles("admin", "warehouse"));
    router.get("/reports/export", roles("admin"), (req, res) =>
      reportExport(db, req, res),
    );
    router.get("/", async (req, res) =>
      ok(
        res,
        await db
          .collection("orders")
          .find(active)
          .sort({ created_at: -1 })
          .skip(skip(req.query.skip))
          .limit(limit(req.query.limit))
          .toArray(),
      ),
    );
    router.patch(
      "/:id/status",
      validate("AdminOrderStatusUpdateSchema"),
      async (req, res) => {
        const result = await transaction(context, async (session) => {
          let order = await get(db, "orders", req.params.id, session);
          const changes = pick(req.body, [
            "order_status",
            "payment_status",
            "fulfillment_status",
          ]);
          for (const [field, target] of Object.entries(changes)) {
            if (target == null) {
              delete changes[field];
              continue;
            }
            if (
              order[field] !== target &&
              !transitions[field][order[field]]?.includes(target)
            )
              fail(
                `Invalid ${field} transition from ${order[field]} to ${target}.`,
              );
          }
          if (
            changes.order_status === "cancelled" ||
            changes.fulfillment_status === "cancelled"
          )
            order = await cancel(db, req, order, session);
          if (
            changes.fulfillment_status &&
            ["packed", "shipped", "delivered"].includes(
              changes.fulfillment_status,
            ) &&
            order.payment_status !== "paid" &&
            changes.payment_status !== "paid"
          )
            fail("Order payment must be verified before fulfillment.");
          const updated = await update(
            db,
            "orders",
            req.params.id,
            changes,
            session,
          );
          await audit(
            db,
            req,
            "UPDATE_ORDER_STATUS",
            "orders",
            order._id,
            changes,
            session,
          );
          return updated;
        });
        ok(res, result);
      },
    );
    return router;
  }
  router.post("/from-checkout/:checkout_id", async (req, res) => {
    const result = await transaction(context, async (session) => {
      const checkout = await get(
        db,
        "checkouts",
        req.params.checkout_id,
        session,
      );
      owns(req, checkout);
      const existing = await db
        .collection("orders")
        .findOne(
          { checkout_id: req.params.checkout_id, ...active },
          { session },
        );
      if (existing) return existing;
      if (checkout.status !== "completed")
        fail("Complete checkout before creating the order.");
      if (checkout.expires_at < now()) fail("Checkout session has expired.");
      const counter = await db
        .collection("counters")
        .findOneAndUpdate(
          { _id: "node_order_number" },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: "after", session },
        );
      const orderNumber = `BDF-${now().toISOString().slice(0, 10).replaceAll("-", "")}-${String(counter.seq).padStart(6, "0")}`;
      const items = [];
      for (const item of checkout.items) {
        const product = await get(db, "products", item.product_id, session);
        const variant = product.variants.find(
          (variant) => variant.variant_id === item.variant_id,
        );
        items.push({
          ...pick(item, [
            "product_id",
            "variant_id",
            "sku",
            "quantity",
            "reserved_warehouse_id",
          ]),
          product_name: product.name,
          product_slug: product.slug,
          media_urls: product.media_urls,
          image_url: product.media_urls?.[0] || null,
          variant_title: variant?.title || variant?.volume_weight || "Default",
          volume_weight: variant?.volume_weight,
          unit_price: item.price,
          line_total: money(amount(item.price).times(item.quantity)),
        });
      }
      const customer = checkout.customer_id
        ? await get(db, "customers", checkout.customer_id, session)
        : null;
      const order = await insert(
        db,
        "orders",
        {
          order_number: orderNumber,
          checkout_id: req.params.checkout_id,
          customer_id: checkout.customer_id,
          guest_token: checkout.guest_token,
          customer_snapshot: {
            customer_id: checkout.customer_id,
            first_name: customer?.personal_details.first_name ?? null,
            last_name: customer?.personal_details.last_name ?? null,
            email: customer?.auth.email || checkout.email,
            phone: customer?.auth.phone || checkout.shipping_address.phone,
          },
          shipping_address_snapshot: checkout.shipping_address,
          items,
          pricing: {
            subtotal: checkout.subtotal,
            discount: checkout.discount,
            tax_total: checkout.tax_estimate,
            shipping_fee: checkout.shipping_fee,
            grand_total: checkout.grand_total,
          },
          payment_status: "pending",
          fulfillment_status: "pending",
          order_status: "pending_payment",
          invoice_number: null,
          invoice_generated_at: null,
        },
        session,
      );
      await update(
        db,
        "carts",
        checkout.cart_id,
        { status: "converted", owner_key: null },
        session,
      );
      await update(
        db,
        "checkouts",
        req.params.checkout_id,
        { order_id: String(order._id) },
        session,
      );
      await notify(
        db,
        checkout.customer_id,
        "order_created",
        "New Order Created",
        `Order ${orderNumber} has been created successfully.`,
        { order_id: String(order._id) },
        session,
      );
      await audit(db, req, "CREATE_ORDER", "orders", order._id, {}, session);
      return order;
    });
    ok(res, result);
  });
  router.get("/me", async (req, res) => {
    if (!req.user) fail("Authentication required.", 401);
    ok(
      res,
      await db
        .collection("orders")
        .find({ ...active, customer_id: String(req.user._id) })
        .sort({ created_at: -1 })
        .skip(skip(req.query.skip))
        .limit(limit(req.query.limit))
        .toArray(),
    );
  });
  router.get("/:id/invoice", async (req, res) => {
    let order = await get(db, "orders", req.params.id);
    owns(req, order);
    if (order.payment_status !== "paid")
      fail("Invoice is available after payment verification.");
    if (!order.invoice_number) {
      order =
        (await db
          .collection("orders")
          .findOneAndUpdate(
            { _id: order._id, invoice_number: null },
            {
              $set: {
                invoice_number: `INV-${now().toISOString().slice(0, 10).replaceAll("-", "")}-${order.order_number}`,
                invoice_generated_at: now(),
              },
            },
            { returnDocument: "after" },
          )) || (await get(db, "orders", req.params.id));
    }
    const pdf = await invoicePdf(order, await settings(db));
    res
      .type("application/pdf")
      .set(
        "Content-Disposition",
        `${req.query.mode === "download" ? "attachment" : "inline"}; filename="${order.invoice_number}.pdf"`,
      )
      .send(pdf);
  });
  router.get("/:id", async (req, res) => {
    const order = await get(db, "orders", req.params.id);
    owns(req, order);
    const enrichedItems = await Promise.all(
      (order.items || []).map(async (item) => {
        if (item.image_url || item.media_urls?.length) return item;
        try {
          const product = await db
            .collection("products")
            .findOne({ _id: oid(item.product_id) });
          if (!product) return item;
          const [view] = await productViews(db, [product]);
          return {
            ...item,
            product_slug: product.slug,
            media_urls: view?.media_urls || [],
            image_url: view?.media_urls?.[0] || null,
          };
        } catch {
          return item;
        }
      }),
    );
    ok(res, { ...order, items: enrichedItems });
  });
  router.post("/:id/cancel", async (req, res) =>
    ok(
      res,
      await transaction(context, async (session) => {
        const order = await get(db, "orders", req.params.id, session);
        owns(req, order);
        return cancel(db, req, order, session);
      }),
    ),
  );
  return router;
}
function paymentView(payment) {
  return payment ? { ...payment, payment_id: String(payment._id) } : null;
}
export function paymentRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();
  if (admin) {
    router.use(...roles("warehouse", "admin"));
    router.get("/order/:order_id", async (req, res) =>
      ok(
        res,
        paymentView(
          await db
            .collection("payments")
            .findOne({ order_id: req.params.order_id, ...active }),
        ),
      ),
    );
    router.post(
      "/:payment_id/verify",
      validate("PaymentVerifyRequest"),
      async (req, res) => {
        const result = await transaction(context, async (session) => {
          const payment = await get(
            db,
            "payments",
            req.params.payment_id,
            session,
          );
          const order = await get(db, "orders", payment.order_id, session);
          const approve = req.body.action === "approve";
          const target = approve ? "approved" : "rejected";
          if (payment.status === target)
            return {
              payment_id: String(payment._id),
              status: target,
              order_status: order.order_status,
              payment_status: order.payment_status,
            };
          if (payment.status !== "proof_submitted")
            fail("Payment proof is not ready for verification.");
          if (order.order_status === "cancelled")
            fail("Cancelled order payment cannot be approved.");
          if (!approve && !req.body.rejection_reason?.trim())
            fail("Rejection reason is required.");
          await update(
            db,
            "payments",
            req.params.payment_id,
            {
              status: target,
              rejection_reason: approve
                ? null
                : req.body.rejection_reason.trim(),
              verified_by: String(req.user._id),
              verified_at: now(),
            },
            session,
          );
          const updated = await update(
            db,
            "orders",
            payment.order_id,
            {
              payment_status: approve ? "paid" : "pending",
              order_status: approve ? "confirmed" : "pending_payment",
            },
            session,
          );
          await notify(
            db,
            order.customer_id,
            approve ? "payment_approved" : "payment_rejected",
            approve ? "Payment Approved" : "Payment Proof Rejected",
            approve
              ? `Payment for ${order.order_number} verified.`
              : req.body.rejection_reason,
            { order_id: payment.order_id },
            session,
          );
          await queueEmail(
            db,
            approve ? "payment_approved" : "payment_rejected",
            updated.customer_snapshot.email,
            {
              order_id: payment.order_id,
              order_number: order.order_number,
              rejection_reason: req.body.rejection_reason,
            },
            session,
          );
          await audit(
            db,
            req,
            approve ? "APPROVE_PAYMENT" : "REJECT_PAYMENT",
            "payments",
            payment._id,
            {},
            session,
          );
          return {
            payment_id: req.params.payment_id,
            status: target,
            order_status: updated.order_status,
            payment_status: updated.payment_status,
          };
        });
        ok(res, result);
      },
    );
    return router;
  }
  router.post("/order/:order_id/initiate", async (req, res) => {
    const result = await transaction(context, async (session) => {
      const order = await get(db, "orders", req.params.order_id, session);
      owns(req, order);
      if (order.order_status === "cancelled") fail("Order is cancelled.");
      let payment = await db
        .collection("payments")
        .findOne({ order_id: req.params.order_id, ...active }, { session });
      if (payment) return payment;
      const store = await settings(db, session);
      const note = `Payment for ${order.order_number}`;
      const upiLink = `upi://pay?${new URLSearchParams({ pa: store.upi_id, pn: store.payment_display_name || store.brand_name || "Bharath Delight Foods", am: amount(order.pricing.grand_total).toFixed(2), cu: "INR", tn: note })}`;
      payment = await insert(
        db,
        "payments",
        {
          order_id: req.params.order_id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          guest_token: order.guest_token,
          amount: order.pricing.grand_total,
          upi_id: store.upi_id,
          upi_link: upiLink,
          status: "pending",
          screenshot_media_id: null,
          transaction_note: note,
          rejection_reason: null,
          verified_by: null,
          verified_at: null,
        },
        session,
      );
      await update(
        db,
        "orders",
        req.params.order_id,
        { payment_id: String(payment._id) },
        session,
      );
      return payment;
    });
    ok(res, paymentView(result));
  });
  router.post(
    "/order/:order_id/submit-proof",
    validate("PaymentProofSubmitRequest"),
    async (req, res) => {
      const result = await transaction(context, async (session) => {
        const order = await get(db, "orders", req.params.order_id, session);
        owns(req, order);
        if (
          order.order_status === "cancelled" ||
          order.payment_status === "paid"
        )
          fail("Order cannot accept payment proof.");
        const payment = await db
          .collection("payments")
          .findOne({ order_id: req.params.order_id, ...active }, { session });
        if (!payment) fail("Initiate payment first.");
        const media = await get(
          db,
          "media_assets",
          req.body.screenshot_media_id,
          session,
        );
        if (
          media.status !== "completed" ||
          media.asset_type !== "payment_proof"
        )
          fail("A completed payment proof image is required.");
        const isProofOwner = req.user
          ? (media.uploaded_by === String(req.user._id) || req.user.auth.role === "admin")
          : (media.uploaded_by === (req.guest || "guest") || media.uploaded_by === "guest" || order.guest_token === req.guest);
        if (!isProofOwner)
          fail("Payment proof belongs to another account.", 403);
        const updated = await update(
          db,
          "payments",
          String(payment._id),
          {
            screenshot_media_id: req.body.screenshot_media_id,
            status: "proof_submitted",
            rejection_reason: null,
          },
          session,
        );
        await notify(
          db,
          null,
          "payment_proof_submitted",
          "Payment Proof Submitted",
          `Payment proof submitted for ${order.order_number}.`,
          { order_id: req.params.order_id, payment_id: String(payment._id) },
          session,
        );
        await queueEmail(
          db,
          "new_order",
          process.env.ADMIN_EMAIL,
          { order_number: order.order_number, order_id: req.params.order_id },
          session,
        );
        return updated;
      });
      ok(res, paymentView(result));
    },
  );
  return router;
}
export function shipmentRoutes(context, admin = false) {
  const { db } = context;
  const router = Router();
  if (admin) {
    router.use(...roles("warehouse", "admin"));
    router.get("/", async (req, res) =>
      ok(
        res,
        await db
          .collection("shipments")
          .find(active)
          .sort({ created_at: -1 })
          .skip(skip(req.query.skip))
          .limit(limit(req.query.limit))
          .toArray(),
      ),
    );
    router.patch(
      "/:id/status",
      validate("ShipmentStatusUpdateRequest"),
      async (req, res) => {
        const result = await transaction(context, async (session) => {
          const shipment = await get(db, "shipments", req.params.id, session);
          const status = req.body.status;
          if (
            ["cancelled", "delivered", "returned"].includes(shipment.status) &&
            status !== shipment.status
          )
            fail("Shipment is already final.");
          if (status === shipment.status) return shipment;
          const changes = {
            status,
            timeline: [
              ...shipment.timeline,
              {
                status,
                message: req.body.message,
                location: req.body.location || null,
                timestamp: now(),
              },
            ],
          };
          if (status === "shipped") changes.shipped_at = now();
          if (status === "delivered") changes.delivered_at = now();
          const updated = await update(
            db,
            "shipments",
            req.params.id,
            changes,
            session,
          );
          if (["packed", "shipped", "delivered"].includes(status))
            await update(
              db,
              "orders",
              shipment.order_id,
              { fulfillment_status: status },
              session,
            );
          await notify(
            db,
            shipment.customer_id,
            "shipment_updated",
            "Shipment Updated",
            req.body.message,
            { shipment_id: req.params.id, order_id: shipment.order_id },
            session,
          );
          await queueEmail(
            db,
            "shipment_updated",
            (await get(db, "orders", shipment.order_id, session))
              .customer_snapshot.email,
            {
              order_number: shipment.order_number,
              message: req.body.message,
              tracking_number: shipment.tracking_number,
              status,
            },
            session,
          );
          return updated;
        });
        ok(res, result);
      },
    );
    router.patch("/:id", validate("ShipmentEditRequest"), async (req, res) =>
      ok(
        res,
        await update(
          db,
          "shipments",
          req.params.id,
          pick(req.body, [
            "carrier_name",
            "tracking_number",
            "awb_number",
            "estimated_delivery_date",
          ]),
        ),
      ),
    );
    router.post("/:id/cancel", async (req, res) => {
      const shipment = await get(db, "shipments", req.params.id);
      if (
        ["shipped", "out_for_delivery", "delivered"].includes(shipment.status)
      )
        fail("Shipment is already dispatched.");
      ok(
        res,
        await update(db, "shipments", req.params.id, {
          status: "cancelled",
          timeline: [
            ...shipment.timeline,
            {
              status: "cancelled",
              message: "Shipment cancelled.",
              timestamp: now(),
              location: null,
            },
          ],
        }),
      );
    });
    router.delete("/:id", async (req, res) => {
      await update(db, "shipments", req.params.id, { is_deleted: true });
      ok(res, true);
    });
    return router;
  }
  router.post(
    "/order/:order_id",
    roles("warehouse", "admin"),
    validate("ShipmentCreateRequest"),
    async (req, res) => {
      const result = await transaction(context, async (session) => {
        const order = await get(db, "orders", req.params.order_id, session);
        if (
          order.payment_status !== "paid" ||
          order.order_status !== "confirmed"
        )
          fail("Only paid confirmed orders can be shipped.");
        if (
          await db
            .collection("shipments")
            .findOne({ order_id: req.params.order_id, ...active }, { session })
        )
          fail("Shipment already exists.", 409);
        return insert(
          db,
          "shipments",
          {
            ...pick(req.body, [
              "carrier_name",
              "tracking_number",
              "awb_number",
            ]),
            awb_number: req.body.awb_number ?? null,
            estimated_delivery_date: req.body.estimated_delivery_date
              ? new Date(req.body.estimated_delivery_date)
              : null,
            order_id: req.params.order_id,
            order_number: order.order_number,
            customer_id: order.customer_id,
            status: "pending",
            timeline: [
              {
                status: "pending",
                message: "Shipment created.",
                timestamp: now(),
                location: null,
              },
            ],
            shipped_at: null,
            delivered_at: null,
          },
          session,
        );
      });
      ok(res, result);
    },
  );
  router.get("/order/:order_id", async (req, res) => {
    const order = await get(db, "orders", req.params.order_id);
    owns(req, order);
    const shipment = await db
      .collection("shipments")
      .findOne({ order_id: req.params.order_id, ...active });
    if (!shipment) fail("Shipment not found.", 404);
    ok(res, shipment);
  });
  router.get("/:id", async (req, res) => {
    const shipment = await get(db, "shipments", req.params.id);
    owns(req, await get(db, "orders", shipment.order_id));
    ok(res, shipment);
  });
  return router;
}
