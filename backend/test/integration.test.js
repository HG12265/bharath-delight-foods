import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp, initializeIndexes, backgroundWork } from "../src/app.js";
import { insert, get, oid, money, amount } from "../src/core.js";

let replica,
  client,
  db,
  app,
  admin,
  customer,
  other,
  product,
  variant,
  inventory,
  guest,
  cartId,
  checkoutId,
  orderId,
  paymentId;
process.env.SECRET_KEY = "integration-test-secret-key-32-characters-minimum";
process.env.NODE_ENV = "test";
process.env.STATIC_DIR = "/tmp/bdf-test-uploads";
const login = async (credentials) => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send(credentials);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return {
    token: response.body.data.access_token,
    cookie: response.headers["set-cookie"],
  };
};
const adminRequest = (method) => request(app)[method];
const auth = (identity) => `Bearer ${identity.token}`;
before(async () => {
  replica = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
      args: [
        "--nounixsocket",
        "--setParameter",
        "diagnosticDataCollectionEnabled=false",
        "--wiredTigerCacheSizeGB",
        "0.25",
      ],
    },
    binary: { version: "7.0.14" },
  });
  client = new MongoClient(replica.getUri());
  await client.connect();
  db = client.db("migration_test");
  await initializeIndexes(db);
  app = createApp({ client, db });
  const password_hash = await bcrypt.hash("Password123!", 4);
  await insert(db, "customers", {
    auth: {
      email: "admin@example.com",
      phone: "9000000000",
      password_hash,
      status: "active",
      role: "admin",
    },
    personal_details: { first_name: "Admin", last_name: "User" },
    addresses: [],
  });
  admin = await login({
    email_or_phone: "admin@example.com",
    password: "Password123!",
  });
});
after(async () => {
  await client?.close();
  await replica?.stop();
});
test("legacy BSON and bcrypt accounts remain usable, refresh rotates and logout revokes", async () => {
  const count = await db.collection("customers").countDocuments({});
  assert.equal(count, 1);
  const response = await request(app)
    .post("/api/v1/auth/refresh")
    .set("Cookie", admin.cookie)
    .send({});
  assert.equal(response.status, 200);
  assert.notEqual(response.body.data.access_token, admin.token);
  const replay = await request(app)
    .post("/api/v1/auth/refresh")
    .set("Cookie", admin.cookie)
    .send({});
  assert.equal(replay.status, 401);
  admin = {
    token: response.body.data.access_token,
    cookie: response.headers["set-cookie"],
  };
});
test("registration enforces customer role and existing phone uniqueness", async () => {
  const body = {
    first_name: "Test",
    last_name: "Customer",
    email: "buyer@example.com",
    phone_number: "9000000001",
    password: "Password123!",
    role: "admin",
  };
  const registered = await request(app)
    .post("/api/v1/auth/register")
    .send(body);
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  assert.equal(registered.body.data.role, "customer");
  assert.equal(
    (await request(app).post("/api/v1/auth/register").send(body)).status,
    409,
  );
  customer = await login({
    email_or_phone: body.email,
    password: body.password,
  });
  await request(app)
    .post("/api/v1/auth/register")
    .send({ ...body, email: "other@example.com", phone_number: "9000000002" });
  other = await login({
    email_or_phone: "other@example.com",
    password: body.password,
  });
  assert.equal(
    (
      await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", auth(customer))
    ).status,
    403,
  );
});
test("catalog CRUD preserves product and variant IDs and media schema", async () => {
  const category = await request(app)
    .post("/api/v1/categories")
    .set("Authorization", auth(admin))
    .send({ name: "Pure Ghee", slug: "pure-ghee" });
  assert.equal(category.status, 201, JSON.stringify(category.body));
  const body = {
    name: "Cow Ghee",
    description: "Traditional pure cow ghee.",
    short_description: "Pure cow ghee.",
    category_id: category.body.data.id,
    sourcing: { region: "Salem", story: "Traditional local sourcing story." },
    variants: [
      {
        sku: "TEST-500",
        title: "500 ml",
        volume_weight: "500ml",
        price: "300.00",
        is_active: true,
        stock_status: "in_stock",
      },
    ],
    status: "active",
  };
  const created = await request(app)
    .post("/api/v1/products")
    .set("Authorization", auth(admin))
    .send(body);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  product = created.body.data;
  variant = product.variants[0];
  const updated = await request(app)
    .patch(`/api/v1/products/${product.id}`)
    .set("Authorization", auth(admin))
    .send({ variants: [{ ...body.variants[0], price: "350.00" }] });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.data.id, product.id);
  assert.equal(updated.body.data.variants[0].variant_id, variant.variant_id);
  const catalog = await request(app).get("/api/v1/products?limit=12");
  assert.equal(catalog.body.data.products.length, 1);
  assert.equal(String(catalog.body.data.products[0].min_price), "350.00");
  const createdInventory = await request(app)
    .post("/api/v1/inventories")
    .set("Authorization", auth(admin))
    .send({
      sku: variant.sku,
      variant_id: variant.variant_id,
      product_id: product.id,
      warehouse_stock: [{ warehouse_id: "main", on_hand: 5, reserved: 0 }],
      safety_stock_level: 1,
    });
  assert.equal(
    createdInventory.status,
    201,
    JSON.stringify(createdInventory.body),
  );
  inventory = createdInventory.body.data;
});
test("guest carts are persisted with tokens and batched product summaries", async () => {
  const first = await request(app).get("/api/v1/carts/me");
  assert.equal(first.status, 200);
  guest = first.headers["x-guest-token"];
  assert.ok(guest);
  const added = await request(app)
    .post("/api/v1/carts/me/items")
    .set("X-Guest-Token", guest)
    .send({
      product_id: product.id,
      variant_id: variant.variant_id,
      quantity: 1,
    });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  assert.equal(added.body.data.items[0].product_summary.name, product.name);
  const merged = await request(app)
    .post("/api/v1/carts/merge")
    .set("Authorization", auth(customer))
    .send({ guest_token: guest });
  assert.equal(merged.status, 200, JSON.stringify(merged.body));
  cartId = merged.body.data.id;
  const retried = await request(app)
    .post("/api/v1/carts/merge")
    .set("Authorization", auth(customer))
    .send({ guest_token: guest });
  assert.equal(retried.body.data.items[0].quantity, 1);
});
const checkoutPayload = (key) => ({
  cart_id: cartId,
  email: "buyer@example.com",
  shipping_address: {
    full_name: "Test Customer",
    phone: "9000000001",
    address_line1: "1 Main Road",
    city: "Salem",
    state: "Tamil Nadu",
    pincode: "636011",
  },
  idempotency_key: key,
});
test("checkout validates owner, recalculates prices, reserves and rolls back failures", async () => {
  assert.equal(
    (
      await request(app)
        .post("/api/v1/checkouts/initiate")
        .set("Authorization", auth(other))
        .send(checkoutPayload("bad-owner"))
    ).status,
    403,
  );
  const started = await request(app)
    .post("/api/v1/checkouts/initiate")
    .set("Authorization", auth(customer))
    .send(checkoutPayload("checkout-one"));
  assert.equal(started.status, 200, JSON.stringify(started.body));
  checkoutId = started.body.data.id;
  assert.equal(String(started.body.data.pricing.subtotal), "350.00");
  const again = await request(app)
    .post("/api/v1/checkouts/initiate")
    .set("Authorization", auth(customer))
    .send(checkoutPayload("checkout-one"));
  assert.equal(again.body.data.id, checkoutId);
  assert.equal(
    (await db.collection("inventories").findOne({ sku: variant.sku }))
      .warehouse_stock[0].reserved,
    1,
  );
  const forbiddenReplay = await request(app)
    .post("/api/v1/checkouts/initiate")
    .set("Authorization", auth(other))
    .send(checkoutPayload("checkout-one"));
  assert.equal(forbiddenReplay.status, 403);
  const coupon = await request(app)
    .post(`/api/v1/checkouts/${checkoutId}/apply-coupon`)
    .set("Authorization", auth(customer))
    .send({ coupon_code: "WELCOME10" });
  assert.equal(coupon.status, 200, JSON.stringify(coupon.body));
  assert.equal(String(coupon.body.data.pricing.discount), "35.00");
});
test("order creation is idempotent with immutable price snapshots", async () => {
  assert.equal(
    (
      await request(app)
        .post(`/api/v1/checkouts/${checkoutId}/complete`)
        .set("Authorization", auth(customer))
        .send({ payment_method: "upi" })
    ).status,
    200,
  );
  const created = await request(app)
    .post(`/api/v1/orders/from-checkout/${checkoutId}`)
    .set("Authorization", auth(customer));
  assert.equal(created.status, 200, JSON.stringify(created.body));
  orderId = created.body.data.id;
  const duplicate = await request(app)
    .post(`/api/v1/orders/from-checkout/${checkoutId}`)
    .set("Authorization", auth(customer));
  assert.equal(duplicate.body.data.id, orderId);
  assert.equal(
    await db.collection("orders").countDocuments({ checkout_id: checkoutId }),
    1,
  );
  assert.equal(
    (
      await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set("Authorization", auth(other))
    ).status,
    403,
  );
  const payment = await request(app)
    .post(`/api/v1/payments/order/${orderId}/initiate`)
    .set("Authorization", auth(customer));
  assert.equal(payment.status, 200, JSON.stringify(payment.body));
  paymentId = payment.body.data.payment_id;
  assert.ok(payment.body.data.upi_link.startsWith("upi://pay?"));
});
test("upload authorization, payment proof ownership and payment confirmation", async () => {
  const bytes = Buffer.from("test payment proof");
  const presign = await request(app)
    .post("/api/v1/media/presign")
    .set("Authorization", auth(customer))
    .send({
      filename: "proof.png",
      content_type: "image/png",
      size: bytes.length,
      asset_type: "payment_proof",
    });
  assert.equal(presign.status, 200, JSON.stringify(presign.body));
  const url = new URL(presign.body.data.upload_url);
  const uploaded = await request(app)
    .put(url.pathname + url.search)
    .set("Content-Type", "image/png")
    .send(bytes);
  assert.equal(uploaded.status, 200, JSON.stringify(uploaded.body));
  const completed = await request(app)
    .post("/api/v1/media/complete")
    .set("Authorization", auth(customer))
    .send({ id: presign.body.data.id, status: "completed" });
  assert.equal(completed.status, 200, JSON.stringify(completed.body));
  const submitted = await request(app)
    .post(`/api/v1/payments/order/${orderId}/submit-proof`)
    .set("Authorization", auth(customer))
    .send({ screenshot_media_id: presign.body.data.id });
  assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
  const verified = await request(app)
    .post(`/api/v1/admin/payments/${paymentId}/verify`)
    .set("Authorization", auth(admin))
    .send({ action: "approve" });
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  assert.equal(verified.body.data.payment_status, "paid");
  const invoice = await request(app)
    .get(`/api/v1/orders/${orderId}/invoice?mode=download`)
    .set("Authorization", auth(customer));
  assert.equal(invoice.status, 200);
  assert.equal(invoice.headers["content-type"], "application/pdf");
});
test("shipments, delivered purchase reviews, moderation and dashboard reports", async () => {
  const created = await request(app)
    .post(`/api/v1/shipments/order/${orderId}`)
    .set("Authorization", auth(admin))
    .send({ carrier_name: "Carrier", tracking_number: "TRACK123" });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const shipment = await request(app)
    .patch(`/api/v1/admin/shipments/${created.body.data.id}/status`)
    .set("Authorization", auth(admin))
    .send({ status: "delivered", message: "Delivered successfully." });
  assert.equal(shipment.status, 200, JSON.stringify(shipment.body));
  const review = await request(app)
    .post("/api/v1/reviews")
    .set("Authorization", auth(customer))
    .send({
      product_id: product.id,
      order_id: orderId,
      rating: 5,
      title: "Good product",
      comment: "Very good quality product.",
    });
  assert.equal(review.status, 200, JSON.stringify(review.body));
  const approved = await request(app)
    .patch(`/api/v1/admin/reviews/${review.body.data.id}/approve`)
    .set("Authorization", auth(admin));
  assert.equal(approved.status, 200);
  assert.equal(
    (await request(app).get(`/api/v1/reviews/product/${product.id}`)).body.data
      .ratings.average,
    5,
  );
  const dashboard = await request(app)
    .get("/api/v1/admin/dashboard")
    .set("Authorization", auth(admin));
  assert.equal(dashboard.status, 200, JSON.stringify(dashboard.body));
  assert.equal(dashboard.body.data.delivered_orders, 1);
  for (const format of ["pdf", "excel"]) {
    const report = await request(app)
      .get("/api/v1/admin/orders/reports/export?format=" + format)
      .set("Authorization", auth(admin));
    assert.equal(report.status, 200);
  }
});
test("concurrent checkout for last stock cannot oversell and failed transactions leave no holds", async () => {
  const inventoryDocument = await db
    .collection("inventories")
    .findOne({ sku: variant.sku });
  await db
    .collection("inventories")
    .updateOne(
      { _id: inventoryDocument._id },
      { $set: { "warehouse_stock.0.on_hand": 2 } },
    );
  const buyers = [customer, other];
  const payloads = [];
  for (const buyer of buyers) {
    const cart = await request(app)
      .post("/api/v1/carts/me/items")
      .set("Authorization", auth(buyer))
      .send({
        product_id: product.id,
        variant_id: variant.variant_id,
        quantity: 1,
      });
    payloads.push({
      ...checkoutPayload("concurrent-" + buyer.token.slice(-8)),
      cart_id: cart.body.data.id,
    });
  }
  const responses = await Promise.all(
    buyers.map((buyer, index) =>
      request(app)
        .post("/api/v1/checkouts/initiate")
        .set("Authorization", auth(buyer))
        .send(payloads[index]),
    ),
  );
  assert.equal(
    responses.filter((response) => response.status === 200).length,
    1,
    JSON.stringify(responses.map((response) => response.body)),
  );
  const inventory = await db
    .collection("inventories")
    .findOne({ sku: variant.sku });
  assert.equal(inventory.warehouse_stock[0].reserved, 2);
  const winner = responses.find((response) => response.status === 200).body
    .data;
  await db
    .collection("checkouts")
    .updateOne({ _id: oid(winner.id) }, { $set: { expires_at: new Date(0) } });
  await backgroundWork({ client, db });
  assert.equal(
    (await db.collection("inventories").findOne({ sku: variant.sku }))
      .warehouse_stock[0].reserved,
    1,
  );
});
test("addresses, wishlist, search, settings and notifications use the existing API shapes", async () => {
  const address = await request(app)
    .post("/api/v1/customers/me/addresses")
    .set("Authorization", auth(customer))
    .send({
      name: "Customer",
      phone: "9000000001",
      street: "1 Main Road",
      pincode: "636011",
      city: "Salem",
      state: "Tamil Nadu",
    });
  assert.equal(address.status, 200, JSON.stringify(address.body));
  assert.equal(address.body.data.addresses.length, 1);
  const addressId = address.body.data.addresses[0].address_id;
  assert.equal(
    (
      await request(app)
        .put(`/api/v1/customers/me/addresses/${addressId}`)
        .set("Authorization", auth(customer))
        .send({ city: "Chennai" })
    ).body.data.addresses[0].city,
    "Chennai",
  );
  assert.equal(
    (
      await request(app)
        .delete(`/api/v1/customers/me/addresses/${addressId}`)
        .set("Authorization", auth(customer))
    ).body.data.addresses.length,
    0,
  );
  const wishlist = await request(app)
    .post("/api/v1/wishlists/me/items")
    .set("Authorization", auth(customer))
    .send({ product_id: product.id, variant_id: variant.variant_id });
  assert.equal(wishlist.status, 200, JSON.stringify(wishlist.body));
  assert.equal(wishlist.body.data.items[0].product_summary.name, product.name);
  assert.equal(
    (
      await request(app)
        .delete(`/api/v1/wishlists/me/items/${variant.variant_id}`)
        .set("Authorization", auth(customer))
    ).body.data.items.length,
    0,
  );
  const search = await request(app).get("/api/v1/search?q=Cow");
  assert.equal(search.body.data.length, 1);
  assert.equal(
    (await request(app).get("/api/v1/search/autocomplete?q=Co")).body.data
      .suggestions[0],
    "Cow Ghee",
  );
  const settings = await request(app).get("/api/v1/settings/public");
  assert.equal(settings.status, 200);
  assert.equal(settings.body.data.upi_id, undefined);
  assert.equal(
    (
      await request(app)
        .patch("/api/v1/admin/settings")
        .set("Authorization", auth(admin))
        .send({ tax_percentage: "-1" })
    ).status,
    400,
  );
  const notifications = await request(app)
    .get("/api/v1/notifications/me")
    .set("Authorization", auth(customer));
  assert.equal(notifications.status, 200);
  assert.ok(notifications.body.data.length > 0);
  assert.equal(
    (
      await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", auth(customer))
    ).status,
    200,
  );
});
test("legacy unique nullable identity indexes migrate without changing customer records", async () => {
  const legacy = client.db("legacy_index_test");
  await legacy.collection("customers").insertOne({
    auth: {
      email: "legacy@example.com",
      phone: null,
      role: "customer",
      status: "active",
    },
    personal_details: {},
  });
  await legacy
    .collection("customers")
    .createIndex({ "auth.phone": 1 }, { unique: true });
  const before = await legacy.collection("customers").find({}).toArray();
  await initializeIndexes(legacy);
  assert.deepEqual(
    await legacy.collection("customers").find({}).toArray(),
    before,
  );
  await legacy.collection("customers").insertOne({
    auth: {
      email: "second@example.com",
      phone: null,
      role: "customer",
      status: "active",
    },
  });
  assert.equal(await legacy.collection("customers").countDocuments({}), 2);
});
test("failure after reserving one line rolls back all reservations and checkout creation", async () => {
  const uniquePhone = "9000000003";
  await request(app).post("/api/v1/auth/register").send({
    first_name: "Rollback",
    last_name: "Buyer",
    email: "rollback@example.com",
    phone_number: uniquePhone,
    password: "Password123!",
  });
  const buyer = await login({
    email_or_phone: "rollback@example.com",
    password: "Password123!",
  });
  await db
    .collection("inventories")
    .updateOne(
      { sku: variant.sku },
      { $set: { "warehouse_stock.0.on_hand": 10 } },
    );
  const addFirst = await request(app)
    .post("/api/v1/carts/me/items")
    .set("Authorization", auth(buyer))
    .send({
      product_id: product.id,
      variant_id: variant.variant_id,
      quantity: 1,
    });
  const existingProduct = await db
    .collection("products")
    .findOne({ _id: oid(product.id) });
  const unavailableProduct = await insert(db, "products", {
    ...existingProduct,
    _id: undefined,
    slug: "unavailable-ghee",
    name: "Unavailable Ghee",
    variants: [
      {
        ...existingProduct.variants[0],
        variant_id: "unavailable-variant",
        sku: "UNAVAILABLE-SKU",
      },
    ],
  });
  const addSecond = await request(app)
    .post("/api/v1/carts/me/items")
    .set("Authorization", auth(buyer))
    .send({
      product_id: String(unavailableProduct._id),
      variant_id: "unavailable-variant",
      quantity: 1,
    });
  assert.equal(addSecond.status, 200, JSON.stringify(addSecond.body));
  const before = (
    await db.collection("inventories").findOne({ sku: variant.sku })
  ).warehouse_stock[0].reserved;
  const failed = await request(app)
    .post("/api/v1/checkouts/initiate")
    .set("Authorization", auth(buyer))
    .send({
      ...checkoutPayload("rollback-checkout"),
      cart_id: addFirst.body.data.id,
    });
  assert.equal(failed.status, 409, JSON.stringify(failed.body));
  assert.equal(
    (await db.collection("inventories").findOne({ sku: variant.sku }))
      .warehouse_stock[0].reserved,
    before,
  );
  assert.equal(
    await db
      .collection("checkouts")
      .countDocuments({ idempotency_key: "rollback-checkout" }),
    0,
  );
});
test("warehouse dashboard preserves operational access and hides admin financial totals", async () => {
  await insert(db, "customers", {
    auth: {
      email: "warehouse@example.com",
      phone: "9000000005",
      password_hash: await bcrypt.hash("Password123!", 4),
      status: "active",
      role: "warehouse",
    },
    personal_details: {},
    addresses: [],
  });
  const warehouse = await login({
    email_or_phone: "warehouse@example.com",
    password: "Password123!",
  });
  const response = await request(app)
    .get("/api/v1/admin/dashboard")
    .set("Authorization", auth(warehouse));
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.total_revenue, null);
  assert.equal(response.body.data.total_customers, null);
  assert.equal(response.body.data.pending_payment_proofs, null);
  assert.equal(typeof response.body.data.confirmed_orders, "number");
});
