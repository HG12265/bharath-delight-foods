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
import {
  invoicePdf,
  bulkInvoicesPdf,
  reportExport,
  queueEmail,
  getCourierUrl,
  sendPendingEmails,
} from "../documents.js";
import {
  createPhonePePayment,
  getPhonePeOrderStatus,
  verifyPhonePeWebhookAuth,
} from "../phonepe.js";

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
async function convertOrderCart(db, order, session) {
  if (order?.cart_id) {
    try {
      await db.collection("carts").updateOne(
        { _id: oid(order.cart_id) },
        { $set: { status: "converted", items: [], owner_key: null, updated_at: now() } },
        session ? { session } : {}
      );
    } catch {}
  }
}
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
    router.all("/invoices/bulk", roles("admin", "warehouse"), async (req, res) => {
      let orderIds = req.body?.order_ids || req.query?.order_ids;
      if (typeof orderIds === "string") {
        orderIds = orderIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const filter = { ...active };
      if (Array.isArray(orderIds) && orderIds.length > 0) {
        filter._id = { $in: orderIds.map(oid) };
      } else {
        const st = req.query.status || req.body?.status;
        if (st && st !== "all") {
          if (st === "paid") {
            filter.payment_status = "paid";
          } else {
            filter.order_status = st;
          }
        } else {
          filter.$or = [
            { order_status: { $ne: "pending_payment" } },
            { proof_submitted_at: { $ne: null } },
          ];
        }
        const startDate = req.query.start_date || req.body?.start_date;
        const endDate = req.query.end_date || req.body?.end_date;
        if (startDate || endDate) {
          filter.created_at = {};
          if (startDate) filter.created_at.$gte = new Date(startDate);
          if (endDate) filter.created_at.$lte = new Date(endDate);
        }
      }

      const orders = await db
        .collection("orders")
        .find(filter)
        .sort({ created_at: -1 })
        .limit(500)
        .toArray();

      if (orders.length === 0) {
        return fail("No matching orders found to generate bulk invoices.");
      }

      const store = await settings(db);
      for (const order of orders) {
        if (!order.invoice_number) {
          const invNum = `INV-${now().toISOString().slice(0, 10).replaceAll("-", "")}-${order.order_number}`;
          await db
            .collection("orders")
            .updateOne(
              { _id: order._id, invoice_number: null },
              { $set: { invoice_number: invNum, invoice_generated_at: now() } },
            );
          order.invoice_number = invNum;
          order.invoice_generated_at = now();
        }
      }

      const pdf = await bulkInvoicesPdf(orders, store);
      const dateSlug = now().toISOString().slice(0, 10);
      res
        .type("application/pdf")
        .set(
          "Content-Disposition",
          `attachment; filename="bharath-delight-invoices-bulk-${dateSlug}.pdf"`,
        )
        .send(pdf);
    });
    router.get("/", async (req, res) => {
      const filter = { ...active };
      if (req.query.status) {
        if (req.query.status === "paid") {
          filter.payment_status = "paid";
        } else {
          filter.order_status = req.query.status;
        }
      } else {
        filter.$or = [
          { order_status: { $ne: "pending_payment" } },
          { proof_submitted_at: { $ne: null } },
        ];
      }
      return ok(
        res,
        await db
          .collection("orders")
          .find(filter)
          .sort({ created_at: -1 })
          .skip(skip(req.query.skip))
          .limit(limit(req.query.limit))
          .toArray(),
      );
    });
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
    if (!req.user) {
      fail("Authentication required. Please sign in to place an order.", 401);
    }
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
        const [view] = await productViews(db, [product], session);
        const variant = product.variants.find(
          (variant) => variant.variant_id === item.variant_id,
        );
        const resolvedImageUrl = view?.media_urls?.[0] || product.media_urls?.[0] || null;
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
          media_urls: view?.media_urls?.length ? view.media_urls : (product.media_urls || []),
          image_url: resolvedImageUrl,
          variant_title: variant?.title || variant?.volume_weight || "Default",
          volume_weight: variant?.volume_weight,
          unit_price: item.price,
          original_price: item.original_price || variant?.price || item.price,
          has_offer: Boolean(item.has_offer),
          offer_title: item.offer_title || null,
          offer_badge: item.offer_badge || null,
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
          cart_id: checkout.cart_id,
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
          proof_submitted_at: null,
          invoice_number: null,
          invoice_generated_at: null,
        },
        session,
      );
      // Cart will be converted/cleared only after payment is confirmed/submitted
      await update(
        db,
        "checkouts",
        req.params.checkout_id,
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
        .find({
          ...active,
          customer_id: String(req.user._id),
          $or: [
            { payment_status: "paid" },
            { order_status: { $in: ["confirmed", "closed"] } },
            { proof_submitted_at: { $ne: null } },
          ],
        })
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
        try {
          const product = await db
            .collection("products")
            .findOne({ _id: oid(item.product_id) });
          if (!product) return item;
          const [view] = await productViews(db, [product]);
          const latestImg = view?.media_urls?.[0] || product.media_urls?.[0] || item.image_url;
          return {
            ...item,
            product_slug: product.slug,
            media_urls: view?.media_urls?.length ? view.media_urls : (item.media_urls || []),
            image_url: latestImg,
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
          if (approve) {
            await convertOrderCart(db, order, session);
          }
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
        await update(
          db,
          "orders",
          req.params.order_id,
          {
            order_status: "confirmed",
            proof_submitted_at: now(),
          },
          session,
        );
        await convertOrderCart(db, order, session);
        await notify(
          db,
          order.customer_id,
          "order_placed",
          "Order Placed Successfully",
          `Thank you for your order! Your payment screenshot for ${order.order_number} has been received.`,
          { order_id: req.params.order_id, payment_id: String(payment._id) },
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

  // --- PhonePe Payment Gateway Integration ---

  // 1. Initiate PhonePe Payment
  router.post("/phonepe/initiate/:order_id", async (req, res) => {
    try {
      const order = await get(db, "orders", req.params.order_id);
      owns(req, order);
      if (order.order_status === "cancelled") {
        return fail("Order is cancelled.");
      }
      if (order.payment_status === "paid") {
        return ok(res, { already_paid: true, status: "paid" });
      }

      const frontendOrigin =
        process.env.FRONTEND_ORIGIN || "https://bharath-delight-foods.pages.dev";
      const redirectUrl =
        req.body?.redirect_url ||
        `${frontendOrigin}/order/${order._id}?status=check`;

      const sessionData = await createPhonePePayment({
        merchantOrderId: String(order._id),
        amountInRupees: order.pricing.grand_total,
        redirectUrl,
        message: `Bharath Delight Order #${order.order_number}`,
      });

      // Upsert payment tracking record
      await db.collection("payments").updateOne(
        { order_id: String(order._id) },
        {
          $set: {
            order_id: String(order._id),
            order_number: order.order_number,
            customer_id: order.customer_id,
            guest_token: order.guest_token,
            amount: order.pricing.grand_total,
            payment_method: "phonepe",
            phonepe_order_id: sessionData.orderId,
            phonepe_state: sessionData.state,
            phonepe_redirect_url: sessionData.redirectUrl,
            status: "pending",
            updated_at: now(),
          },
          $setOnInsert: {
            created_at: now(),
            deleted: false,
          },
        },
        { upsert: true }
      );

      ok(res, {
        success: true,
        redirect_url: sessionData.redirectUrl,
        phonepe_order_id: sessionData.orderId,
        order_id: String(order._id),
      });
    } catch (err) {
      console.error("[PhonePe Initiate Error]", err);
      fail(err.message || "Failed to initiate PhonePe payment");
    }
  });

  // 2. Query / Check PhonePe Payment Status
  router.get("/phonepe/status/:order_id", async (req, res) => {
    try {
      const order = await get(db, "orders", req.params.order_id);
      owns(req, order);

      if (order.payment_status === "paid") {
        return ok(res, {
          state: "COMPLETED",
          order_status: order.order_status,
          payment_status: order.payment_status,
        });
      }

      // Query PhonePe directly
      const pgStatus = await getPhonePeOrderStatus(String(order._id));
      const state = pgStatus?.state || "PENDING";

      if (state === "COMPLETED") {
        // Complete the order
        await update(db, "orders", String(order._id), {
          payment_status: "paid",
          order_status: "confirmed",
          proof_submitted_at: now(),
        });

        await db.collection("payments").updateOne(
          { order_id: String(order._id) },
          {
            $set: {
              status: "approved",
              phonepe_state: "COMPLETED",
              verified_by: "phonepe_gateway",
              verified_at: now(),
              updated_at: now(),
            },
          }
        );

        await convertOrderCart(db, order);

        await notify(
          db,
          order.customer_id,
          "order_placed",
          "Order Confirmed & Paid",
          `Payment for Order #${order.order_number} verified via PhonePe.`,
          { order_id: String(order._id) }
        );

        await queueEmail(
          db,
          "payment_approved",
          order.customer_snapshot.email,
          {
            order_id: String(order._id),
            order_number: order.order_number,
          }
        );

        return ok(res, {
          state: "COMPLETED",
          order_status: "confirmed",
          payment_status: "paid",
        });
      }

      ok(res, {
        state,
        order_status: order.order_status,
        payment_status: order.payment_status,
      });
    } catch (err) {
      console.error("[PhonePe Status Error]", err);
      fail(err.message || "Failed to query PhonePe status");
    }
  });

  // 3. Webhook listener from PhonePe
  router.post("/phonepe/webhook", async (req, res) => {
    try {
      console.log("[PhonePe Webhook Received]", JSON.stringify(req.body));

      // Extract merchantOrderId
      let merchantOrderId =
        req.body?.payload?.merchantOrderId ||
        req.body?.merchantOrderId ||
        req.body?.data?.merchantOrderId;

      if (!merchantOrderId && req.body?.response) {
        try {
          const decoded = Buffer.from(req.body.response, "base64").toString("utf8");
          const parsed = JSON.parse(decoded);
          merchantOrderId = parsed?.data?.merchantTransactionId || parsed?.data?.merchantOrderId;
        } catch {}
      }

      if (merchantOrderId) {
        // Double verify directly from PhonePe API to avoid any spoofing
        const pgStatus = await getPhonePeOrderStatus(merchantOrderId);
        if (pgStatus?.state === "COMPLETED") {
          const order = await db.collection("orders").findOne({
            $or: [{ _id: oid(merchantOrderId) }, { order_number: merchantOrderId }],
            ...active,
          });

          if (order && order.payment_status !== "paid") {
            await update(db, "orders", String(order._id), {
              payment_status: "paid",
              order_status: "confirmed",
              proof_submitted_at: now(),
            });

            await db.collection("payments").updateOne(
              { order_id: String(order._id) },
              {
                $set: {
                  status: "approved",
                  phonepe_state: "COMPLETED",
                  verified_by: "phonepe_gateway",
                  verified_at: now(),
                  updated_at: now(),
                },
              }
            );

            await convertOrderCart(db, order);

            await notify(
              db,
              order.customer_id,
              "order_placed",
              "Payment Received via PhonePe",
              `Payment for Order #${order.order_number} confirmed via PhonePe Gateway.`,
              { order_id: String(order._id) }
            );

            await queueEmail(
              db,
              "payment_approved",
              order.customer_snapshot.email,
              {
                order_id: String(order._id),
                order_number: order.order_number,
              }
            );
          }
        }
      }

      // Always return 200 OK to PhonePe
      res.status(200).json({ status: "SUCCESS" });
    } catch (err) {
      console.error("[PhonePe Webhook Error]", err);
      // Return 200 so PhonePe knows request arrived
      res.status(200).json({ status: "ACKNOWLEDGED", error: err.message });
    }
  });

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

          const order = await get(db, "orders", shipment.order_id, session);
          const customerEmail = order?.customer_snapshot?.email;

          // Send emails ONLY for Delivered or Returned
          if (status === "delivered" || status === "returned") {
            const emailType = status === "delivered" ? "shipment_delivered" : "shipment_returned";
            const notificationTitle = status === "delivered" ? "Order Delivered" : "Shipment Returned";
            await notify(
              db,
              shipment.customer_id,
              emailType,
              notificationTitle,
              req.body.message,
              { shipment_id: req.params.id, order_id: shipment.order_id },
              session,
            );
            if (customerEmail) {
              await queueEmail(
                db,
                emailType,
                customerEmail,
                {
                  order_id: String(order._id),
                  order_number: shipment.order_number,
                  customer_name:
                    `${order.customer_snapshot.first_name || ""} ${order.customer_snapshot.last_name || ""}`.trim() ||
                    order.shipping_address_snapshot?.full_name ||
                    "Customer",
                  carrier_name: shipment.carrier_name,
                  tracking_number: shipment.tracking_number,
                  tracking_url: getCourierUrl(shipment.carrier_name),
                  status,
                  message: req.body.message,
                  items: (order.items || []).map((item) => ({
                    product_name: item.product_name,
                    variant_title:
                      item.variant_title || item.volume_weight || "Default",
                    quantity: item.quantity,
                    total_price: item.pricing?.total_price || item.total_price || 0,
                  })),
                  grand_total: order.pricing?.grand_total || 0,
                },
                session,
              );
            }
          }
          return updated;
        });
        sendPendingEmails(db).catch(() => {});
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
        const shipment = await insert(
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
            status: "shipped",
            timeline: [
              {
                status: "shipped",
                message: `Dispatched via ${req.body.carrier_name}. Tracking ID: ${req.body.tracking_number}`,
                timestamp: now(),
                location: null,
              },
            ],
            shipped_at: now(),
            delivered_at: null,
          },
          session,
        );
        await update(
          db,
          "orders",
          String(order._id),
          { fulfillment_status: "shipped" },
          session,
        );
        await notify(
          db,
          shipment.customer_id,
          "shipment_dispatched",
          "Order Dispatched",
          `Your order #${order.order_number} has been dispatched via ${shipment.carrier_name}. Tracking ID: ${shipment.tracking_number}`,
          { shipment_id: String(shipment._id), order_id: req.params.order_id },
          session,
        );
        if (order.customer_snapshot?.email) {
          await queueEmail(
            db,
            "shipment_dispatched",
            order.customer_snapshot.email,
            {
              order_id: String(order._id),
              order_number: order.order_number,
              customer_name:
                `${order.customer_snapshot.first_name || ""} ${order.customer_snapshot.last_name || ""}`.trim() ||
                order.shipping_address_snapshot?.full_name ||
                "Customer",
              carrier_name: shipment.carrier_name,
              tracking_number: shipment.tracking_number,
              tracking_url: getCourierUrl(shipment.carrier_name),
              items: (order.items || []).map((item) => ({
                product_name: item.product_name,
                variant_title:
                  item.variant_title || item.volume_weight || "Default",
                quantity: item.quantity,
                total_price: item.pricing?.total_price || item.total_price || 0,
              })),
              shipping_address: order.shipping_address_snapshot,
              grand_total: order.pricing?.grand_total || 0,
            },
            session,
          );
        }
        return shipment;
      });
      sendPendingEmails(db).catch(() => {});
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
