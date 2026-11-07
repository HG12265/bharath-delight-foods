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
  authenticated,
  roles,
  validate,
  pick,
  limit,
  skip,
  productViews,
  inventoryView,
  checkoutView,
  amount,
  money,
  settings,
  owns,
  audit,
  notify,
  transaction,
  getActiveOffersMap,
} from "../core.js";

export async function variantFor(db, item, session, requireStock = true) {
  const product = await get(db, "products", item.product_id, session);
  if (product.status !== "active") fail("Product is inactive.");
  const variant =
    product.variants.find(
      (variant) => variant.variant_id === item.variant_id,
    ) ||
    product.variants.find((variant) => item.sku && variant.sku === item.sku) ||
    (product.variants.length === 1 ? product.variants[0] : null);
  if (!variant?.is_active) fail("Variant is unavailable.");
  if (requireStock && variant.stock_status === "out_of_stock")
    fail("Variant is out of stock.");
  return { product, variant };
}
async function cartFor(db, req, res, session) {
  const customerId = req.user ? String(req.user._id) : null;
  if (!customerId && (!req.guest || !/^[a-zA-Z0-9_-]{20,128}$/.test(req.guest)))
    req.guest = uid().replaceAll("-", "");
  if (!customerId) res.set("X-Guest-Token", req.guest);
  const filter = {
    ...active,
    status: "active",
    ...(customerId
      ? { customer_id: customerId }
      : { customer_id: null, guest_token: req.guest }),
  };
  let cart = await db.collection("carts").findOne(filter, { session });
  if (cart?.expires_at && cart.expires_at < now()) {
    await update(
      db,
      "carts",
      String(cart._id),
      { status: "abandoned", owner_key: null },
      session,
    );
    cart = null;
  }

  // If customer is logged in and had a guest cart with items, merge them seamlessly
  if (customerId && req.guest) {
    const guestCart = await db.collection("carts").findOne(
      { customer_id: null, guest_token: req.guest, status: "active", ...active },
      { session },
    );
    if (guestCart && guestCart.items?.length) {
      if (!cart) {
        cart = await update(
          db,
          "carts",
          String(guestCart._id),
          {
            customer_id: customerId,
            guest_token: null,
            owner_key: `user:${customerId}`,
            expires_at: null,
          },
          session,
        );
      } else {
        const itemMap = new Map((cart.items || []).map((i) => [i.variant_id, i]));
        for (const gItem of guestCart.items) {
          const existing = itemMap.get(gItem.variant_id);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + (gItem.quantity || 1);
            existing.updated_at = now();
          } else {
            cart.items.push(gItem);
          }
        }
        cart = await update(
          db,
          "carts",
          String(cart._id),
          { items: cart.items, updated_at: now() },
          session,
        );
        await update(
          db,
          "carts",
          String(guestCart._id),
          { status: "converted", owner_key: null, updated_at: now() },
          session,
        );
      }
    }
  }
  if (cart) return cart;
  return insert(
    db,
    "carts",
    {
      customer_id: customerId,
      guest_token: customerId ? null : req.guest,
      owner_key: customerId ? `user:${customerId}` : `guest:${req.guest}`,
      items: [],
      status: "active",
      expires_at: customerId ? null : new Date(Date.now() + 30 * 86400000),
    },
    session,
  );
}
async function cartView(db, cart, wishlist = false) {
  const ids = [...new Set(cart.items.map((item) => item.product_id))];
  const products = await productViews(
    db,
    await db
      .collection("products")
      .find({ _id: { $in: ids.map(oid) }, ...active })
      .toArray(),
  );
  const map = new Map(
    products.map((product) => [String(product._id), product]),
  );
  let subtotal = amount(0);
  let totalDiscount = amount(0);
  let total = 0;
  const items = [];
  for (const item of cart.items) {
    const product = map.get(item.product_id);
    const variant = product?.variants.find(
      (variant) =>
        variant.variant_id === item.variant_id || variant.sku === item.sku,
    );
    if (
      wishlist &&
      (!product || product.status !== "active" || !variant?.is_active)
    )
      continue;

    const effectivePrice = variant?.effective_price || variant?.price || item.unit_price_snapshot;
    const originalPrice = variant?.original_price || variant?.price || item.unit_price_snapshot;
    const hasOffer = Boolean(variant?.has_offer);
    const offerBadge = variant?.offer_badge || null;
    const discountAmt = variant?.discount_amount ? amount(variant.discount_amount) : amount(0);

    const summary = variant
      ? {
          name: product.name,
          slug: product.slug,
          media_ids: product.media_ids,
          media_urls: product.media_urls,
          image_url: product.media_urls?.[0] || null,
          price: effectivePrice,
          original_price: originalPrice,
          has_offer: hasOffer,
          offer_badge: offerBadge,
          discount_amount: discountAmt.toString(),
          discount_percentage: variant.discount_percentage || 0,
          offer_title: variant.offer_title || null,
          sku: variant.sku,
          stock_status:
            product.status === "active" && variant.is_active
              ? variant.stock_status
              : "out_of_stock",
          volume_weight: variant.volume_weight,
          variant_title: variant.title || variant.volume_weight,
          title: variant.title || variant.volume_weight,
        }
      : null;

    items.push({
      ...item,
      unit_price_snapshot: effectivePrice,
      original_price: originalPrice,
      has_offer: hasOffer,
      offer_badge: offerBadge,
      product_summary: summary,
    });
    subtotal = subtotal.plus(
      amount(effectivePrice).times(item.quantity || 0),
    );
    totalDiscount = totalDiscount.plus(
      amount(originalPrice).minus(amount(effectivePrice)).times(item.quantity || 0),
    );
    total += item.quantity || 0;
  }
  return {
    ...cart,
    items,
    ...(wishlist
      ? {}
      : {
          summary: {
            subtotal: subtotal.toFixed(2),
            total_discount: totalDiscount.toFixed(2),
            item_count: items.length,
            quantity_total: total,
          },
        }),
  };
}
export function cartRoutes(context) {
  const { db } = context;
  const router = Router();
  router.get("/me", async (req, res) =>
    ok(res, await cartView(db, await cartFor(db, req, res))),
  );
  async function change(req, res, operation) {
    const result = await transaction(context, async (session) => {
      const cart = await cartFor(db, req, res, session);
      let items = cart.items;
      if (operation === "add") {
        const { variant } = await variantFor(db, req.body, session);
        const existing = items.find(
          (item) => item.variant_id === variant.variant_id,
        );
        const quantity = (existing?.quantity || 0) + req.body.quantity;
        if (quantity > 1000) fail("Maximum item quantity exceeded.");
        const activeOffersMap = await getActiveOffersMap(db, session);
        const offerInfo = activeOffersMap.get(variant.variant_id);
        const effectivePrice =
          offerInfo &&
          offerInfo.offer_price > 0 &&
          offerInfo.offer_price < Number(amount(variant.price))
            ? money(offerInfo.offer_price)
            : variant.price;

        if (existing) {
          existing.quantity = quantity;
          existing.unit_price_snapshot = effectivePrice;
          existing.updated_at = now();
        } else
          items.push({
            product_id: req.body.product_id,
            variant_id: variant.variant_id,
            sku: variant.sku,
            quantity: req.body.quantity,
            unit_price_snapshot: effectivePrice,
            added_at: now(),
            updated_at: now(),
          });
      }
      if (operation === "update") {
        const item = items.find(
          (item) => item.variant_id === req.params.variant_id,
        );
        if (!item) fail("Cart item not found.", 404);
        if (req.body.quantity > 1000) fail("Maximum item quantity exceeded.");
        const { variant } = await variantFor(db, item, session);
        const activeOffersMap = await getActiveOffersMap(db, session);
        const offerInfo = activeOffersMap.get(variant.variant_id);
        const effectivePrice =
          offerInfo &&
          offerInfo.offer_price > 0 &&
          offerInfo.offer_price < Number(amount(variant.price))
            ? money(offerInfo.offer_price)
            : variant.price;

        Object.assign(item, {
          quantity: req.body.quantity,
          unit_price_snapshot: effectivePrice,
          updated_at: now(),
        });
      }
      if (operation === "remove")
        items = items.filter(
          (item) => item.variant_id !== req.params.variant_id,
        );
      if (operation === "clear") items = [];
      if (operation === "merge") {
        const guest = await db
          .collection("carts")
          .findOne(
            {
              guest_token: req.body.guest_token,
              customer_id: null,
              status: "active",
              ...active,
            },
            { session },
          );
        if (guest) {
          for (const item of guest.items) {
            const existing = items.find(
              (value) => value.variant_id === item.variant_id,
            );
            if (existing)
              existing.quantity = Math.min(
                1000,
                existing.quantity + item.quantity,
              );
            else items.push(item);
          }
          await update(
            db,
            "carts",
            String(guest._id),
            { status: "converted", items: [], owner_key: null },
            session,
          );
        }
      }
      return update(db, "carts", String(cart._id), { items }, session);
    });
    ok(res, await cartView(db, result));
  }
  router.post("/me/items", validate("CartItemAdd"), (req, res) => {
    if (!req.user) {
      fail("Authentication required. Please sign in to add items to your cart.", 401);
    }
    req.body.quantity ??= 1;
    return change(req, res, "add");
  });
  router.patch(
    "/me/items/:variant_id",
    validate("CartItemUpdate"),
    (req, res) => change(req, res, "update"),
  );
  router.delete("/me/items/:variant_id", (req, res) =>
    change(req, res, "remove"),
  );
  router.delete("/me", (req, res) => change(req, res, "clear"));
  router.post(
    "/merge",
    authenticated,
    validate("CartMergeRequest"),
    (req, res) => change(req, res, "merge"),
  );
  return router;
}
export function wishlistRoutes(context) {
  const { db } = context;
  const router = Router();
  router.use(authenticated);
  async function list(req, session) {
    const customer_id = String(req.user._id);
    return (
      (await db
        .collection("wishlists")
        .findOne({ customer_id, ...active }, { session })) ||
      insert(db, "wishlists", { customer_id, items: [] }, session)
    );
  }
  router.get("/me", async (req, res) =>
    ok(res, await cartView(db, await list(req), true)),
  );
  router.post("/me/items", validate("WishlistItemAdd"), async (req, res) => {
    const result = await transaction(context, async (session) => {
      const wishlist = await list(req, session);
      const { variant } = await variantFor(db, req.body, session, false);
      if (
        !wishlist.items.some((item) => item.variant_id === variant.variant_id)
      )
        wishlist.items.push({
          product_id: req.body.product_id,
          variant_id: variant.variant_id,
          sku: variant.sku,
          added_at: now(),
        });
      return update(
        db,
        "wishlists",
        String(wishlist._id),
        { items: wishlist.items },
        session,
      );
    });
    ok(res, await cartView(db, result, true));
  });
  router.delete("/me/items/:variant_id", async (req, res) => {
    const result = await transaction(context, async (session) => {
      const wishlist = await list(req, session);
      return update(
        db,
        "wishlists",
        String(wishlist._id),
        {
          items: wishlist.items.filter(
            (item) => item.variant_id !== req.params.variant_id,
          ),
        },
        session,
      );
    });
    ok(res, await cartView(db, result, true));
  });
  return router;
}
export async function stockChange(
  db,
  sku,
  warehouseId,
  quantity,
  action,
  session,
  req = null,
  reason = null,
) {
  if (!Number.isSafeInteger(quantity) || (action !== "adjust" && quantity <= 0))
    fail("Invalid stock quantity.");
  const inventory = await db
    .collection("inventories")
    .findOne({ sku, ...active }, { session });
  if (!inventory) fail("Inventory not found.", 404);
  let warehouse = inventory.warehouse_stock.find(
    (warehouse) => warehouse.warehouse_id === warehouseId,
  );
  if (!warehouse && action === "adjust" && quantity >= 0) {
    warehouse = {
      warehouse_id: warehouseId,
      on_hand: 0,
      reserved: 0,
      location_code: null,
    };
    inventory.warehouse_stock.push(warehouse);
  }
  if (!warehouse) fail("Warehouse not found.", 404);
  const before = warehouse.on_hand;
  if (action === "reserve") {
    if (warehouse.on_hand - warehouse.reserved < quantity)
      fail("Insufficient available stock.", 409, "OUT_OF_STOCK");
    warehouse.reserved += quantity;
  } else if (action === "release") {
    if (warehouse.reserved < quantity)
      fail("Cannot release more than reserved quantity.", 409);
    warehouse.reserved -= quantity;
  } else {
    if (warehouse.on_hand + quantity < warehouse.reserved)
      fail("Adjustment would leave physical stock below reserved stock.");
    warehouse.on_hand += quantity;
    if (req?.body.location_code !== undefined)
      warehouse.location_code = req.body.location_code;
  }
  const updated = await update(
    db,
    "inventories",
    String(inventory._id),
    { warehouse_stock: inventory.warehouse_stock },
    session,
  );
  const view = inventoryView(updated);
  await db
    .collection("products")
    .updateOne(
      {
        _id: oid(inventory.product_id),
        "variants.variant_id": inventory.variant_id,
      },
      {
        $set: {
          "variants.$.stock_status":
            view.available_total > 0 ? "in_stock" : "out_of_stock",
          updated_at: now(),
        },
      },
      { session },
    );
  await insert(
    db,
    "inventory_movements",
    {
      sku,
      timestamp: now(),
      action: action.toUpperCase(),
      movement_type: action,
      quantity,
      before,
      after: warehouse.on_hand,
      performed_by: req?.user ? String(req.user._id) : "system",
      reason,
    },
    session,
  );
  return view;
}
export function inventoryRoutes(context) {
  const { db } = context;
  const router = Router();
  router.use(...roles("warehouse", "admin"));
  async function enriched() {
    // Auto-sync missing inventories from active catalog products
    const activeProducts = await db.collection("products").find(active).toArray();
    for (const prod of activeProducts) {
      for (const variant of prod.variants || []) {
        if (!variant.sku) continue;
        const exists = await db
          .collection("inventories")
          .findOne({ sku: variant.sku, ...active });
        if (!exists) {
          await insert(db, "inventories", {
            product_id: String(prod._id),
            variant_id: variant.variant_id,
            sku: variant.sku,
            warehouse_stock: [
              {
                warehouse_id: "WH-MAIN",
                on_hand: 50,
                reserved: 0,
                location_code: "A-01",
              },
            ],
            safety_stock_level: 5,
          });
        }
      }
    }

    const documents = await db
      .collection("inventories")
      .find(active)
      .limit(250)
      .toArray();
    const products = await productViews(
      db,
      await db
        .collection("products")
        .find({ _id: { $in: documents.map((item) => oid(item.product_id)) } })
        .toArray(),
    );
    const map = new Map(products.map((item) => [String(item._id), item]));
    return documents.map((item) => {
      const product = map.get(item.product_id);
      return {
        ...inventoryView(item),
        product_name: product?.name || "",
        variant_name:
          product?.variants.find(
            (variant) => variant.variant_id === item.variant_id,
          )?.title || "",
        product_image: product?.media_urls?.[0] ?? null,
      };
    });
  }
  router.get("/", async (req, res) => ok(res, await enriched()));
  router.get("/alerts/low-stock", async (req, res) =>
    ok(
      res,
      (await enriched()).filter((item) => item.is_low_stock),
    ),
  );
  router.get("/export/csv", roles("admin"), async (req, res) => {
    const rows = await enriched();
    const fields = [
      "sku",
      "product_name",
      "variant_name",
      "on_hand_total",
      "reserved_total",
      "available_total",
      "safety_stock_level",
      "inventory_status",
    ];
    const escape = (value) =>
      '"' +
      String(value ?? "")
        .replace(/^[=+@-]/, "'" + String(value)[0])
        .replaceAll('"', '""') +
      '"';
    res
      .type("text/csv")
      .attachment("inventory.csv")
      .send(
        [
          fields.join(","),
          ...rows.map((row) =>
            fields.map((field) => escape(row[field])).join(","),
          ),
        ].join("\r\n"),
      );
  });
  router.get("/:sku/history", async (req, res) =>
    ok(
      res,
      await db
        .collection("inventory_movements")
        .find({ sku: req.params.sku })
        .sort({ timestamp: -1 })
        .limit(250)
        .toArray(),
    ),
  );
  router.get("/:sku", async (req, res) => {
    const item = await db
      .collection("inventories")
      .findOne({ sku: req.params.sku, ...active });
    if (!item) fail("Inventory not found.", 404);
    ok(res, inventoryView(item));
  });
  router.post(
    "/",
    roles("admin"),
    validate("InventoryCreate"),
    async (req, res) => {
      const result = await transaction(context, async (session) => {
        const { product_id, variant_id, sku } = req.body;
        const product = await get(db, "products", product_id, session);
        if (
          !product.variants.some(
            (variant) =>
              variant.variant_id === variant_id && variant.sku === sku,
          )
        )
          fail("SKU does not match product variant.");
        if (
          await db
            .collection("inventories")
            .findOne({ sku, ...active }, { session })
        )
          fail("Inventory already exists.", 409);
        const warehouses = req.body.warehouse_stock || [];
        if (
          new Set(warehouses.map((item) => item.warehouse_id)).size !==
            warehouses.length ||
          warehouses.some((item) => (item.reserved || 0) > (item.on_hand || 0))
        )
          fail("Invalid warehouse stock.");
        return insert(
          db,
          "inventories",
          {
            product_id,
            variant_id,
            sku,
            warehouse_stock: warehouses.map((item) => ({
              reserved: 0,
              on_hand: 0,
              location_code: null,
              ...item,
            })),
            safety_stock_level: req.body.safety_stock_level || 0,
          },
          session,
        );
      });
      ok(res, inventoryView(result), "Inventory created.", 201);
    },
  );
  for (const [action, method, schema] of [
    ["adjust", "patch", "StockAdjustmentRequest"],
    ["reserve", "post", "StockReservationRequest"],
    ["release", "post", "StockReleaseRequest"],
  ]) {
    router[method](`/:sku/${action}`, validate(schema), async (req, res) =>
      ok(
        res,
        await transaction(context, (session) =>
          stockChange(
            db,
            req.params.sku,
            req.body.warehouse_id,
            req.body.quantity,
            action,
            session,
            req,
            req.body.reason,
          ),
        ),
      ),
    );
  }
  return router;
}
function priceCheckout(subtotal, discount, store) {
  const net = amount(subtotal).minus(discount);
  const tax = net
    .times(amount(store.tax_percentage ?? 5).dividedBy(100))
    .toDecimalPlaces(2);
  // Preserve the original flat fee rule. Its threshold setting is informational.
  const shipping = net.gt(0) ? amount(store.shipping_fee ?? 0) : amount(0);
  return {
    subtotal: money(subtotal),
    discount: money(discount),
    tax_estimate: money(tax),
    shipping_fee: money(shipping),
    grand_total: money(net.plus(tax).plus(shipping)),
  };
}
export async function expireCheckout(db, checkout, session) {
  for (const item of checkout.items || []) {
    try {
      await stockChange(
        db,
        item.sku,
        item.reserved_warehouse_id,
        item.quantity,
        "release",
        session,
      );
    } catch {
      // Safe release: if stock was already released or warehouse reserved count was less, ignore
    }
  }
  return update(
    db,
    "checkouts",
    String(checkout._id),
    { status: "expired" },
    session,
  );
}
export function checkoutRoutes(context) {
  const { db } = context;
  const router = Router();
  router.post(
    "/initiate",
    validate("CheckoutInitiateRequest"),
    async (req, res) => {
      if (!req.user) {
        fail("Authentication required. Please sign in to place an order.", 401);
      }
      const body = req.body;
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
        !/^\+?[\d\s-]{10,16}$/.test(body.shipping_address.phone) ||
        !/^[1-9]\d{5}$/.test(body.shipping_address.pincode)
      )
        fail("Invalid email, phone or pincode.");
      const result = await transaction(context, async (session) => {
        const existing = await db
          .collection("checkouts")
          .findOne(
            { idempotency_key: body.idempotency_key, ...active },
            { session },
          );
        if (existing) {
          owns(req, existing);
          return existing;
        }
        const cart = await get(db, "carts", body.cart_id, session);
        owns(req, cart);
        if (cart.status !== "active" || !cart.items.length)
          fail("Cart is empty or inactive.");
        const previous = await db
          .collection("checkouts")
          .find(
            {
              cart_id: body.cart_id,
              status: { $in: ["initiated", "completed"] },
              ...active,
            },
            { session },
          )
          .toArray();
        for (const checkout of previous) {
          const existingOrder = await db
            .collection("orders")
            .findOne(
              { checkout_id: String(checkout._id), ...active },
              { session },
            );
          if (existingOrder) {
            const isSettled =
              existingOrder.payment_status === "paid" ||
              existingOrder.order_status === "confirmed" ||
              Boolean(existingOrder.proof_submitted_at);
            if (isSettled) {
              fail("Cart already converted to an order.", 409);
            }
            // If previous checkout order was never paid/confirmed, supersede it cleanly
            await update(
              db,
              "orders",
              String(existingOrder._id),
              {
                order_status: "cancelled",
                fulfillment_status: "cancelled",
                cancelled_at: now(),
                cancel_reason: "Superseded by new checkout attempt",
              },
              session,
            );
          }
          await expireCheckout(db, checkout, session);
        }
        const items = [];
        let subtotal = amount(0);
        const activeOffersMap = await getActiveOffersMap(db, session);
        for (const item of cart.items) {
          const { variant } = await variantFor(db, item, session, false);
          const inventory = await db
            .collection("inventories")
            .findOne({ sku: variant.sku, ...active }, { session });
          const warehouse = inventory?.warehouse_stock.find(
            (warehouse) =>
              warehouse.on_hand - warehouse.reserved >= item.quantity,
          );
          if (!warehouse)
            fail(`Insufficient stock for ${variant.sku}.`, 409, "OUT_OF_STOCK");
          await stockChange(
            db,
            variant.sku,
            warehouse.warehouse_id,
            item.quantity,
            "reserve",
            session,
            req,
          );
          const offerInfo = activeOffersMap.get(variant.variant_id);
          const effectivePrice =
            offerInfo &&
            offerInfo.offer_price > 0 &&
            offerInfo.offer_price < Number(amount(variant.price))
              ? money(offerInfo.offer_price)
              : variant.price;

          items.push({
            product_id: item.product_id,
            variant_id: variant.variant_id,
            sku: variant.sku,
            quantity: item.quantity,
            price: effectivePrice,
            original_price: variant.price,
            has_offer: Boolean(offerInfo),
            offer_title: offerInfo?.offer_title || null,
            offer_badge: offerInfo?.badge_text || null,
            reserved_warehouse_id: warehouse.warehouse_id,
          });
          subtotal = subtotal.plus(amount(effectivePrice).times(item.quantity));
        }
        const store = await settings(db, session);
        const checkout = await insert(
          db,
          "checkouts",
          {
            cart_id: body.cart_id,
            customer_id: req.user ? String(req.user._id) : null,
            guest_token: req.user ? null : req.guest,
            email: body.email,
            items,
            shipping_address: { country: "India", ...body.shipping_address },
            ...priceCheckout(subtotal, 0, store),
            coupon_code: null,
            status: "initiated",
            idempotency_key: body.idempotency_key,
            expires_at: new Date(Date.now() + 900000),
          },
          session,
        );
        // Touch the cart so concurrent initiations serialize through MongoDB conflicts.
        await update(
          db,
          "carts",
          String(cart._id),
          { active_checkout_id: String(checkout._id) },
          session,
        );
        await audit(
          db,
          req,
          "INITIATE_CHECKOUT",
          "checkouts",
          checkout._id,
          {},
          session,
        );
        return checkout;
      });
      ok(res, checkoutView(result));
    },
  );
  for (const operation of ["apply-coupon", "complete"]) {
    const middleware =
      operation === "apply-coupon"
        ? [validate("ApplyCouponRequest")]
        : [validate("CompleteCheckoutRequest")];
    router.post(
      `/:checkout_id/${operation}`,
      ...middleware,
      async (req, res) => {
        let expired = false;
        const result = await transaction(context, async (session) => {
          const checkout = await get(
            db,
            "checkouts",
            req.params.checkout_id,
            session,
          );
          owns(req, checkout);
          if (operation === "complete" && checkout.status === "completed")
            return checkout;
          if (checkout.status !== "initiated") fail("Checkout is inactive.");
          if (checkout.expires_at < now()) {
            expired = true;
            return expireCheckout(db, checkout, session);
          }
          if (operation === "complete")
            return update(
              db,
              "checkouts",
              req.params.checkout_id,
              { status: "completed" },
              session,
            );

          const code = req.body.coupon_code.trim().toUpperCase();
          let discount = amount(0);

          // Check dynamic coupon in database
          const couponDoc = await db.collection("coupons").findOne(
            { code, status: "active", ...active },
            { session },
          );

          if (couponDoc) {
            if (couponDoc.valid_until && new Date(couponDoc.valid_until) < new Date()) {
              fail("This coupon code has expired.");
            }
            if (couponDoc.usage_limit && (couponDoc.used_count || 0) >= couponDoc.usage_limit) {
              fail("This coupon usage limit has been reached.");
            }
            const minOrder = parseFloat(String(couponDoc.min_order_amount || 0));
            const subtotalNum = parseFloat(String(checkout.subtotal || 0));
            if (minOrder > 0 && subtotalNum < minOrder) {
              fail(`Minimum order amount of ₹${minOrder} is required for this coupon.`);
            }

            if (couponDoc.discount_type === "percentage") {
              let pctDiscount = amount(checkout.subtotal)
                .times(amount(couponDoc.discount_value).dividedBy(100));
              if (couponDoc.max_discount_amount && pctDiscount.greaterThan(couponDoc.max_discount_amount)) {
                pctDiscount = amount(couponDoc.max_discount_amount);
              }
              discount = pctDiscount.toDecimalPlaces(2);
            } else {
              // Flat amount discount
              const flatVal = amount(couponDoc.discount_value);
              discount = flatVal.greaterThan(amount(checkout.subtotal))
                ? amount(checkout.subtotal)
                : flatVal.toDecimalPlaces(2);
            }
          } else if (code === "WELCOME10") {
            discount = amount(checkout.subtotal)
              .times("0.10")
              .toDecimalPlaces(2);
          } else {
            fail("Invalid or expired coupon code.");
          }

          return update(
            db,
            "checkouts",
            req.params.checkout_id,
            {
              ...priceCheckout(
                checkout.subtotal,
                discount,
                await settings(db, session),
              ),
              coupon_code: code,
            },
            session,
          );
        });
        if (expired)
          fail("Checkout session has expired.", 400, "CHECKOUT_EXPIRED");
        ok(res, checkoutView(result));
      },
    );
  }

  // Remove coupon from checkout
  router.post("/:checkout_id/remove-coupon", async (req, res) => {
    let expired = false;
    const result = await transaction(context, async (session) => {
      const checkout = await get(
        db,
        "checkouts",
        req.params.checkout_id,
        session,
      );
      owns(req, checkout);
      if (checkout.status !== "initiated") fail("Checkout is inactive.");
      if (checkout.expires_at < now()) {
        expired = true;
        return expireCheckout(db, checkout, session);
      }
      return update(
        db,
        "checkouts",
        req.params.checkout_id,
        {
          ...priceCheckout(
            checkout.subtotal,
            0,
            await settings(db, session),
          ),
          coupon_code: null,
        },
        session,
      );
    });
    if (expired)
      fail("Checkout session has expired.", 400, "CHECKOUT_EXPIRED");
    ok(res, checkoutView(result));
  });
  return router;
}
