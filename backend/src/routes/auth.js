import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import rateLimit from "express-rate-limit";
import {
  active,
  now,
  uid,
  hash,
  oid,
  fail,
  ok,
  insert,
  update,
  get,
  authenticated,
  roles,
  validate,
  pick,
} from "../core.js";

export const publicUser = (customer) => ({
  id: String(customer._id),
  email: customer.auth.email ?? null,
  phone: customer.auth.phone ?? null,
  role: customer.auth.role,
  personal_details: customer.personal_details || {},
});
export const profile = (customer) => ({
  ...publicUser(customer),
  status: customer.auth.status,
  addresses: customer.addresses || [],
  created_at: customer.created_at,
});
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  path: "/",
  maxAge: 30 * 86400000,
});

export function authContext(db) {
  return async (req, res, next) => {
    try {
      req.guest = req.get("X-Guest-Token") || null;
      const token = req.get("Authorization")?.replace(/^Bearer /i, "");
      if (token) {
        let payload;
        try {
          payload = jwt.verify(token, process.env.SECRET_KEY, {
            algorithms: ["HS256"],
          });
        } catch {
          fail("Invalid or expired access token.", 401, "UNAUTHORIZED");
        }
        if (payload.type && payload.type !== "access")
          fail("Invalid access token.", 401, "UNAUTHORIZED");
        if (
          await db.collection("token_blacklist").findOne({ _id: hash(token) })
        )
          fail("Session revoked.", 401, "UNAUTHORIZED");
        req.user = await db
          .collection("customers")
          .findOne({
            _id: oid(payload.sub),
            ...active,
            "auth.status": "active",
          });
        if (!req.user)
          fail("Account inactive or unavailable.", 401, "UNAUTHORIZED");
        req.accessToken = token;
        req.tokenPayload = payload;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
async function issue(db, customer, res, previousHash = null) {
  const subject = String(customer._id);
  const access = jwt.sign(
    { sub: subject, role: customer.auth.role, type: "access", jti: uid() },
    process.env.SECRET_KEY,
    {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 11520) * 60,
    },
  );
  const refresh = jwt.sign(
    { sub: subject, role: customer.auth.role, type: "refresh", jti: uid() },
    process.env.SECRET_KEY,
    { expiresIn: "30d" },
  );
  const filter = { _id: customer._id, ...active, "auth.status": "active" };
  if (previousHash) filter["auth.refresh_token_hash"] = previousHash;
  const result = await db
    .collection("customers")
    .updateOne(filter, {
      $set: { "auth.refresh_token_hash": hash(refresh), updated_at: now() },
    });
  if (!result.matchedCount)
    fail("Refresh token has already been used.", 401, "UNAUTHORIZED");
  res.cookie("refresh_token", refresh, cookieOptions());
  return {
    access_token: access,
    token_type: "bearer",
    role: customer.auth.role,
    user: publicUser(customer),
  };
}
export function authRoutes(context) {
  const { db } = context;
  const router = Router();
  const limiter = rateLimit({
    windowMs: 600000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });
  router.post(
    "/register",
    limiter,
    validate("RegisterRequest"),
    async (req, res) => {
      const body = req.body;
      if (!body.email && !body.phone_number)
        fail("Email or phone is required.");
      const alternatives = [{ "auth.phone": body.phone_number }];
      if (body.email)
        alternatives.push({ "auth.email": body.email.toLowerCase().trim() });
      if (
        await db
          .collection("customers")
          .findOne({ $or: alternatives, ...active })
      )
        fail(
          "A user with this email or phone number is already registered.",
          409,
        );
      const customer = await insert(db, "customers", {
        auth: {
          email: body.email?.toLowerCase().trim() ?? null,
          phone: body.phone_number,
          password_hash: await bcrypt.hash(body.password, 12),
          status: "active",
          refresh_token_hash: null,
          role: "customer",
        },
        personal_details: pick(body, ["first_name", "last_name"]),
        addresses: [],
        b2b_profile: null,
      });
      ok(
        res,
        publicUser(customer),
        "User account registered successfully.",
        201,
      );
    },
  );
  router.post("/login", limiter, validate("LoginRequest"), async (req, res) => {
    const username = req.body.email_or_phone.trim();
    const customer = await db
      .collection("customers")
      .findOne({
        $or: [
          { "auth.email": username.toLowerCase() },
          { "auth.phone": username },
        ],
        ...active,
      });
    if (
      !customer?.auth.password_hash ||
      !(await bcrypt.compare(req.body.password, customer.auth.password_hash))
    )
      fail("Invalid credentials.", 401, "UNAUTHORIZED");
    if (customer.auth.status !== "active")
      fail("User account is inactive or suspended.", 401, "UNAUTHORIZED");
    ok(
      res,
      await issue(db, customer, res),
      "Authentication completed successfully.",
    );
  });
  router.post("/refresh", async (req, res) => {
    const token = req.cookies.refresh_token;
    if (!token) fail("Refresh token missing.", 401, "UNAUTHORIZED");
    let payload;
    try {
      payload = jwt.verify(token, process.env.SECRET_KEY, {
        algorithms: ["HS256"],
      });
    } catch {
      fail("Invalid or expired refresh token.", 401, "UNAUTHORIZED");
    }
    if (payload.type && payload.type !== "refresh")
      fail("Invalid refresh token.", 401, "UNAUTHORIZED");
    const customer = await db
      .collection("customers")
      .findOne({
        _id: oid(payload.sub),
        ...active,
        "auth.status": "active",
        "auth.refresh_token_hash": hash(token),
      });
    if (!customer)
      fail(
        "Session unavailable or refresh token already used.",
        401,
        "UNAUTHORIZED",
      );
    ok(
      res,
      await issue(db, customer, res, hash(token)),
      "Session credentials updated.",
    );
  });
  router.post("/logout", async (req, res) => {
    res.clearCookie("refresh_token", { ...cookieOptions(), maxAge: undefined });
    if (req.user) {
      await update(db, "customers", String(req.user._id), {
        "auth.refresh_token_hash": null,
      });
      await db
        .collection("token_blacklist")
        .updateOne(
          { _id: hash(req.accessToken) },
          { $set: { expires_at: new Date(req.tokenPayload.exp * 1000) } },
          { upsert: true },
        );
    }
    ok(res, null, "Session logged out successfully.");
  });
  router.get("/session", (req, res) =>
    ok(res, {
      authenticated: Boolean(req.user),
      user: req.user ? publicUser(req.user) : null,
    }),
  );
  router.get("/me", authenticated, (req, res) => ok(res, publicUser(req.user)));
  router.post(
    "/otp/request",
    limiter,
    validate("OTPRequest"),
    async (req, res) => {
      const phone = req.body.phone_number;
      const code = String(crypto.randomInt(100000, 1000000));
      await db
        .collection("otp_sessions")
        .updateOne(
          { _id: phone },
          {
            $set: {
              code_hash: hash(code),
              attempts: 0,
              expires_at: new Date(Date.now() + 300000),
            },
          },
          { upsert: true },
        );
      if (process.env.OTP_WEBHOOK_URL) {
        const response = await fetch(process.env.OTP_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify({ phone, code }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) fail("OTP delivery failed.", 502);
      } else if (
        process.env.NODE_ENV !== "production" &&
        process.env.DEV_OTP_LOG === "true"
      ) {
        console.info(`Development OTP for ${phone}: ${code}`);
      } else
        fail(
          "OTP delivery provider is not configured.",
          503,
          "OTP_NOT_CONFIGURED",
        );
      ok(res, null, "Verification code dispatched successfully.");
    },
  );
  router.post(
    "/otp/verify",
    limiter,
    validate("OTPVerify"),
    async (req, res) => {
      const phone = req.body.phone_number;
      const attempt = await db
        .collection("otp_sessions")
        .findOneAndUpdate(
          { _id: phone, attempts: { $lt: 3 }, expires_at: { $gt: now() } },
          { $inc: { attempts: 1 } },
          { returnDocument: "before" },
        );
      if (!attempt || attempt.code_hash !== hash(req.body.otp_code))
        fail("Invalid or expired verification code.", 401, "UNAUTHORIZED");
      const consumed = await db
        .collection("otp_sessions")
        .deleteOne({ _id: phone, code_hash: attempt.code_hash });
      if (!consumed.deletedCount)
        fail("Verification code already used.", 401, "UNAUTHORIZED");
      let customer = await db
        .collection("customers")
        .findOne({ "auth.phone": phone, ...active });
      if (!customer)
        customer = await insert(db, "customers", {
          auth: {
            phone,
            email: null,
            status: "active",
            role: "customer",
            password_hash: null,
            refresh_token_hash: null,
          },
          personal_details: {},
          addresses: [],
        });
      if (customer.auth.status !== "active")
        fail("Account inactive.", 401, "UNAUTHORIZED");
      ok(res, await issue(db, customer, res));
    },
  );
  router.post(
    "/google",
    limiter,
    validate("GoogleLoginRequest"),
    async (req, res) => {
      if (!process.env.GOOGLE_CLIENT_ID)
        fail("Google authentication is not configured.", 503);
      const verifier = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      let payload;
      try {
        payload = (
          await verifier.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,
          })
        ).getPayload();
      } catch {
        fail("Invalid Google credential.", 401, "UNAUTHORIZED");
      }
      if (!payload.email_verified || !payload.email)
        fail("Google email is not verified.", 401, "UNAUTHORIZED");
      const email = payload.email.toLowerCase();
      let customer = await db
        .collection("customers")
        .findOne({ "auth.email": email, ...active });
      if (!customer)
        customer = await insert(db, "customers", {
          auth: {
            email,
            phone: null,
            password_hash: null,
            refresh_token_hash: null,
            role: "customer",
            status: "active",
          },
          personal_details: {
            first_name: payload.given_name || payload.name,
            last_name: payload.family_name || "",
            avatar_url: payload.picture,
          },
          addresses: [],
        });
      if (customer.auth.status !== "active")
        fail("Account inactive.", 401, "UNAUTHORIZED");
      ok(res, await issue(db, customer, res));
    },
  );
  return router;
}
export function customerRoutes({ db, client }) {
  const router = Router();
  router.use(authenticated);
  router.get("/me", (req, res) => ok(res, profile(req.user)));
  router.patch("/me", validate("ProfileUpdate"), async (req, res) => {
    const fields = Object.fromEntries(
      Object.entries(
        pick(req.body, ["first_name", "last_name", "avatar_url"]),
      ).map(([key, value]) => [`personal_details.${key}`, value]),
    );
    ok(
      res,
      profile(await update(db, "customers", String(req.user._id), fields)),
    );
  });
  async function addressChange(req, res, operation) {
    const session = client.startSession();
    let customer;
    try {
      await session.withTransaction(async () => {
        customer = await get(db, "customers", String(req.user._id), session);
        let addresses = customer.addresses || [];
        if (operation === "create")
          addresses.push({
            ...pick(req.body, [
              "name",
              "phone",
              "street",
              "landmark",
              "pincode",
              "city",
              "state",
              "is_default_shipping",
              "is_default_billing",
            ]),
            address_id: uid(),
            is_default_shipping:
              req.body.is_default_shipping ?? addresses.length === 0,
            is_default_billing:
              req.body.is_default_billing ?? addresses.length === 0,
          });
        const selectedId =
          operation === "create"
            ? addresses.at(-1).address_id
            : req.params.address_id;
        const selected = addresses.find(
          (address) => address.address_id === selectedId,
        );
        if (!selected) fail("Address not found.", 404);
        if (operation === "update")
          Object.assign(
            selected,
            pick(req.body, [
              "name",
              "phone",
              "street",
              "landmark",
              "pincode",
              "city",
              "state",
              "is_default_shipping",
              "is_default_billing",
            ]),
          );
        if (operation === "default") {
          const type = req.query.default_type || "both";
          if (!["shipping", "billing", "both"].includes(type))
            fail("Invalid default address type.");
          if (type !== "billing") selected.is_default_shipping = true;
          if (type !== "shipping") selected.is_default_billing = true;
        }
        for (const flag of ["is_default_shipping", "is_default_billing"])
          if (selected[flag])
            for (const address of addresses)
              if (address !== selected) address[flag] = false;
        if (operation === "delete")
          addresses = addresses.filter((address) => address !== selected);
        customer = await update(
          db,
          "customers",
          String(customer._id),
          { addresses },
          session,
        );
      });
    } finally {
      await session.endSession();
    }
    ok(res, profile(customer));
  }
  router.post("/me/addresses", validate("AddressCreate"), (req, res) =>
    addressChange(req, res, "create"),
  );
  router.put(
    "/me/addresses/:address_id",
    validate("AddressUpdate"),
    (req, res) => addressChange(req, res, "update"),
  );
  router.delete("/me/addresses/:address_id", (req, res) =>
    addressChange(req, res, "delete"),
  );
  router.patch("/me/addresses/:address_id/default", (req, res) =>
    addressChange(req, res, "default"),
  );
  for (const field of ["email", "phone"])
    router.patch(
      `/me/${field}`,
      validate(field === "email" ? "EmailUpdate" : "PhoneUpdate"),
      async (req, res) => {
        const value =
          field === "email"
            ? req.body[field].toLowerCase().trim()
            : req.body[field];
        if (
          await db
            .collection("customers")
            .findOne({
              [`auth.${field}`]: value,
              _id: { $ne: req.user._id },
              ...active,
            })
        )
          fail(`${field} already registered.`, 409);
        ok(
          res,
          profile(
            await update(db, "customers", String(req.user._id), {
              [`auth.${field}`]: value,
            }),
          ),
        );
      },
    );
  router.delete("/me", async (req, res) => {
    await update(db, "customers", String(req.user._id), {
      is_deleted: true,
      deleted_at: now(),
      "auth.status": "inactive",
      "auth.refresh_token_hash": null,
    });
    ok(res);
  });
  router.patch(
    "/:id/status",
    roles("admin"),
    validate("StatusUpdate"),
    async (req, res) => {
      if (!["active", "suspended", "inactive"].includes(req.body.status))
        fail("Invalid customer status.");
      ok(
        res,
        profile(
          await update(db, "customers", req.params.id, {
            "auth.status": req.body.status,
            "auth.refresh_token_hash": null,
          }),
        ),
      );
    },
  );
  return router;
}
