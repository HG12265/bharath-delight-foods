import { ObjectId, Decimal128 } from "mongodb";
import Decimal from "decimal.js";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import fs from "node:fs";
import crypto from "node:crypto";

export const active = { is_deleted: { $ne: true } };
export const now = () => new Date();
export const uid = () => crypto.randomUUID();
export const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
export const amount = (value) => new Decimal(String(value ?? 0));
export const money = (value) => Decimal128.fromString(amount(value).toFixed(2));
export const fail = (message, status = 400, code = "INVALID_REQUEST") => {
  const error = new Error(message);
  Object.assign(error, { status, code });
  throw error;
};
export function oid(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value))
    fail("Invalid record identifier.", 400, "INVALID_IDENTIFIER");
  return new ObjectId(value);
}
export function json(value) {
  if (value == null) return value;
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Decimal128) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(json);
  if (typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value))
      if (key !== "_id") result[key] = json(item);
    if (value._id) result.id = String(value._id);
    return result;
  }
  return value;
}
export function ok(
  res,
  data = null,
  message = "Request completed successfully.",
  status = 200,
  meta = null,
) {
  return res
    .status(status)
    .json({ success: true, message, data: json(data), meta, errors: null });
}
export const pick = (object, keys) =>
  Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(object, key))
      .map((key) => [key, object[key]]),
  );
export const limit = (value, max = 250, fallback = 100) =>
  Math.min(max, Math.max(1, Number.parseInt(value, 10) || fallback));
export const skip = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const regex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function get(db, collection, id, session) {
  const document = await db
    .collection(collection)
    .findOne({ _id: oid(id), ...active }, { session });
  if (!document) fail("Record not found.", 404, "NOT_FOUND");
  return document;
}
export async function insert(db, collection, data, session) {
  const document = {
    created_at: now(),
    updated_at: now(),
    is_deleted: false,
    node_version: 1,
    ...data,
  };
  const result = await db
    .collection(collection)
    .insertOne(document, { session });
  document._id = result.insertedId;
  return document;
}
export async function update(db, collection, id, data, session) {
  const document = await db
    .collection(collection)
    .findOneAndUpdate(
      { _id: oid(id), ...active },
      { $set: { ...data, updated_at: now() } },
      { session, returnDocument: "after" },
    );
  if (!document) fail("Record not found.", 404, "NOT_FOUND");
  return document;
}
export function owns(req, document) {
  if (req.user?.auth.role === "admin" || req.user?.auth.role === "warehouse")
    return;
  const userId = req.user ? String(req.user._id) : null;
  const allowed = userId
    ? document.customer_id === userId
    : !document.customer_id && req.guest && document.guest_token === req.guest;
  if (!allowed) fail("Access forbidden.", 403, "FORBIDDEN");
}
export function authenticated(req, res, next) {
  if (!req.user)
    return next(
      Object.assign(new Error("Authentication required."), {
        status: 401,
        code: "UNAUTHORIZED",
      }),
    );
  next();
}
export function roles(...allowed) {
  return [
    authenticated,
    (req, res, next) => {
      if (
        req.user.auth.role !== "admin" &&
        !allowed.includes(req.user.auth.role)
      )
        return next(
          Object.assign(new Error("Access forbidden."), {
            status: 403,
            code: "FORBIDDEN",
          }),
        );
      next();
    },
  ];
}
export async function transaction(context, work) {
  const session = context.client.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}
export async function audit(
  db,
  req,
  action,
  collection,
  id,
  metadata = {},
  session,
) {
  await insert(
    db,
    "audit_logs",
    {
      action,
      target_collection: collection,
      target_id: String(id),
      user_id: req.user ? String(req.user._id) : req.guest,
      ip_address: req.ip,
      metadata,
      timestamp: now(),
    },
    session,
  );
}
export async function notify(
  db,
  target,
  type,
  title,
  message,
  metadata = {},
  session,
) {
  return insert(
    db,
    "notifications",
    {
      target_user_id: target,
      role_target: target ? null : "admin",
      type,
      title,
      message,
      metadata,
      is_read: false,
      read_at: null,
    },
    session,
  );
}
const contracts = JSON.parse(
  fs.readFileSync(new URL("./contracts.json", import.meta.url)),
);
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validators = new Map();
export function validate(name) {
  if (!validators.has(name)) validators.set(name, ajv.compile(contracts[name]));
  const validator = validators.get(name);
  return (req, res, next) => {
    if (!validator(req.body))
      return next(
        Object.assign(new Error("Request validation failed."), {
          status: 422,
          code: "VALIDATION_ERROR",
          details: validator.errors,
        }),
      );
    next();
  };
}
export async function settings(db, session) {
  const existing = await db.collection("settings").findOne(active, { session });
  if (existing) return existing;
  const defaults = JSON.parse(
    fs.readFileSync(new URL("./settings-defaults.json", import.meta.url)),
  );
  for (const key of [
    "tax_percentage",
    "shipping_fee",
    "free_shipping_threshold",
  ])
    defaults[key] = money(defaults[key]);
  return db
    .collection("settings")
    .findOneAndUpdate(
      { _id: new ObjectId("000000000000000000000001") },
      {
        $setOnInsert: {
          ...defaults,
          created_at: now(),
          updated_at: now(),
          is_deleted: false,
          node_version: 1,
        },
      },
      { upsert: true, returnDocument: "after", session },
    );
}
export async function productViews(db, products, session) {
  const ids = [
    ...new Set(products.flatMap((product) => product.media_ids || [])),
  ].filter((id) => /^[a-f\d]{24}$/i.test(id));
  const media = await db
    .collection("media_assets")
    .find(
      { _id: { $in: ids.map(oid) }, ...active, status: "completed" },
      { session },
    )
    .toArray();
  const urls = new Map(
    media.map((asset) => [String(asset._id), asset.public_url]),
  );
  return products.map((product) => {
    const prices = (product.variants || [])
      .filter((variant) => variant.is_active)
      .map((variant) => amount(variant.price));
    const min = prices.length ? Decimal.min(...prices).toFixed(2) : "0.00";
    return {
      ...product,
      min_price: product.min_price ?? min,
      display_price: product.display_price ?? min,
      media_urls: (product.media_ids || [])
        .map((id) => urls.get(id))
        .filter(Boolean),
    };
  });
}
export function inventoryView(document) {
  const onHand = document.warehouse_stock.reduce(
    (sum, item) => sum + item.on_hand,
    0,
  );
  const reserved = document.warehouse_stock.reduce(
    (sum, item) => sum + item.reserved,
    0,
  );
  const available = onHand - reserved;
  const isLow = available <= document.safety_stock_level;
  return {
    ...document,
    on_hand_total: onHand,
    reserved_total: reserved,
    available_total: available,
    is_low_stock: isLow,
    inventory_status:
      available <= 0 ? "out_of_stock" : isLow ? "low_stock" : "healthy",
  };
}
export function checkoutView(document) {
  return {
    ...document,
    pricing: pick(document, [
      "subtotal",
      "tax_estimate",
      "shipping_fee",
      "coupon_code",
      "discount",
      "grand_total",
    ]),
  };
}
