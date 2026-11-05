import { Router, raw } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import {
  active,
  now,
  uid,
  fail,
  ok,
  get,
  insert,
  update,
  authenticated,
  roles,
  validate,
} from "../core.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const rules = {
  product_image: {
    types: [...imageTypes, "image/gif", "image/svg+xml"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"],
    max: 5,
  },
  blog_image: {
    types: [...imageTypes, "image/gif"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    max: 5,
  },
  avatar: {
    types: imageTypes,
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    max: 2,
  },
  payment_proof: {
    types: [...imageTypes, "image/jpg"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    max: 5,
  },
  certificate_pdf: {
    types: ["application/pdf"],
    extensions: [".pdf"],
    max: 10,
  },
  packaging_file: {
    types: [
      ...imageTypes,
      "application/pdf",
      "image/svg+xml",
      "application/zip",
      "application/x-zip-compressed",
    ],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".svg", ".zip"],
    max: 20,
  },
  video: {
    types: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
    extensions: [".mp4", ".webm", ".ogg", ".mov"],
    max: 100,
  },
};
rules.category_image = rules.product_image;

export function mediaRoutes({ db }) {
  const router = Router();
  const staticRoot = path.resolve(process.env.STATIC_DIR || "static");

  const checkOwner = (req, asset) => {
    if (asset.asset_type === "payment_proof" && !req.user) {
      if (asset.uploaded_by !== (req.guest || "guest") && asset.uploaded_by !== "guest") {
        fail("Access forbidden.", 403);
      }
      return;
    }
    if (
      !req.user ||
      (asset.uploaded_by !== String(req.user._id) &&
        req.user.auth.role !== "admin")
    )
      fail("Access forbidden.", 403);
  };

  router.get("/health", (req, res) =>
    ok(res, { status: "healthy", provider: "local", storage_provider: "local" }),
  );

  router.post(
    "/presign",
    validate("PresignRequest"),
    async (req, res) => {
      const body = req.body;
      if (body.asset_type !== "payment_proof" && !req.user) {
        fail("Authentication required.", 401, "UNAUTHORIZED");
      }
      const rule = rules[body.asset_type];
      if (
        !rule ||
        !rule.types.includes(body.content_type) ||
        !rule.extensions.includes(path.extname(body.filename).toLowerCase())
      )
        fail("Unsupported media type or file extension.");
      if (
        !Number.isSafeInteger(body.size) ||
        body.size <= 0 ||
        body.size >
          Math.min(
            rule.max * 1048576,
            Number(process.env.MAX_REQUEST_SIZE_BYTES || 16777216),
          )
      )
        fail("Invalid upload size.");
      const userId = req.user ? String(req.user._id) : (req.guest || "guest");
      if (
        [
          "product_image",
          "category_image",
          "blog_image",
          "certificate_pdf",
          "packaging_file",
          "video",
        ].includes(body.asset_type) &&
        (!req.user || !["admin", "warehouse"].includes(req.user.auth.role))
      )
        fail("Staff access is required for catalog media.", 403);
      const filename = path
        .basename(body.filename)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `media/${body.asset_type}/${userId}/${uid()}-${filename}`;
      const origin = (
        process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");
      const publicUrl = `${origin}/static/${key}`;
      const asset = await insert(db, "media_assets", {
        original_filename: body.filename,
        content_type: body.content_type,
        size: body.size,
        storage_key: key,
        public_url: publicUrl,
        uploaded_by: userId,
        asset_type: body.asset_type,
        status: "pending",
        storage_provider: "local",
      });

      const grant = jwt.sign(
        { type: "upload", asset_id: String(asset._id), storage_key: key },
        process.env.SECRET_KEY,
        { expiresIn: "1h" },
      );
      const uploadUrl = `${origin}/api/v1/media/upload/mock/${key}?grant=${encodeURIComponent(grant)}`;

      ok(res, {
        id: String(asset._id),
        upload_url: uploadUrl,
        public_url: publicUrl,
        storage_key: key,
      });
    },
  );

  router.put(
    "/upload/mock/*storage_key",
    raw({
      type: "*/*",
      limit: Number(process.env.MAX_REQUEST_SIZE_BYTES || 16777216),
    }),
    async (req, res) => {
      let grant;
      try {
        grant = jwt.verify(
          String(req.query.grant || ""),
          process.env.SECRET_KEY,
          { algorithms: ["HS256"] },
        );
      } catch {
        fail("Upload authorization is invalid or expired.", 401);
      }
      const key = Array.isArray(req.params.storage_key)
        ? req.params.storage_key.join("/")
        : req.params.storage_key;
      if (grant.type !== "upload" || grant.storage_key !== key)
        fail("Upload authorization mismatch.", 403);
      const asset = await get(db, "media_assets", grant.asset_id);
      if (asset.status !== "pending" || asset.uploaded_at)
        fail("Upload has already been completed.", 409);
      if (!Buffer.isBuffer(req.body) || req.body.length !== asset.size)
        fail("Upload size does not match the declared size.");
      if (req.get("Content-Type")?.split(";")[0] !== asset.content_type)
        fail("Upload content type mismatch.");

      const destination = path.resolve(staticRoot, key);
      if (!destination.startsWith(staticRoot + path.sep))
        fail("Invalid storage path.");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, req.body, { flag: "wx" });

      await update(db, "media_assets", String(asset._id), {
        uploaded_at: now(),
        public_url: asset.public_url,
      });
      ok(res, { storage_key: key, public_url: asset.public_url });
    },
  );

  router.post(
    "/complete",
    validate("UploadCompleteRequest"),
    async (req, res) => {
      const asset = await get(db, "media_assets", req.body.id);
      checkOwner(req, asset);
      if (!["completed", "failed"].includes(req.body.status))
        fail("Invalid completion status.");
      if (req.body.status === "completed") {
        if (!asset.uploaded_at && asset.status !== "completed")
          fail("Upload the file before confirming completion.");
      }
      ok(
        res,
        await update(db, "media_assets", req.body.id, {
          status: req.body.status,
        }),
      );
    },
  );

  router.get("/:id", async (req, res) => {
    const asset = await get(db, "media_assets", req.params.id);
    if (asset.asset_type === "payment_proof") {
      const isOwner = req.user
        ? (asset.uploaded_by === String(req.user._id) || ["admin", "warehouse"].includes(req.user.auth.role))
        : (asset.uploaded_by === (req.guest || "guest") || asset.uploaded_by === "guest");
      if (!isOwner) fail("Access forbidden.", 403);
    }
    ok(res, asset);
  });

  router.delete("/:id", authenticated, async (req, res) => {
    const asset = await get(db, "media_assets", req.params.id);
    checkOwner(req, asset);
    await update(db, "media_assets", req.params.id, {
      is_deleted: true,
      deleted_at: now(),
    });
    ok(res);
  });

  return router;
}
