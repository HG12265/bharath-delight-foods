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
  slugify,
  regex,
  productViews,
  money,
  amount,
  audit,
  transaction,
} from "../core.js";

const productFields = [
  "name",
  "slug",
  "description",
  "short_description",
  "category_id",
  "media_ids",
  "sourcing",
  "attributes",
  "variants",
  "seo",
  "tags",
  "search_keywords",
  "is_featured",
  "status",
];
const categoryFields = [
  "name",
  "slug",
  "description",
  "image_id",
  "parent_id",
  "sort_order",
  "is_active",
];
export function categoryRoutes(context) {
  const { db } = context;
  const router = Router();
  const list = (filter) =>
    db
      .collection("categories")
      .find({ ...active, ...filter })
      .sort({ sort_order: 1, name: 1 })
      .limit(250)
      .toArray();
  router.get("/", async (req, res) => ok(res, await list({ is_active: true })));
  router.get("/admin/all", roles("admin", "warehouse"), async (req, res) =>
    ok(res, await list({})),
  );
  router.get("/tree", async (req, res) => {
    const documents = await list({ is_active: true });
    const build = (parent = null, ancestors = new Set()) =>
      documents
        .filter(
          (document) =>
            (document.parent_id || null) === parent &&
            !ancestors.has(String(document._id)),
        )
        .map((document) => ({
          ...document,
          children: build(
            String(document._id),
            new Set([...ancestors, String(document._id)]),
          ),
        }));
    ok(res, build());
  });
  async function save(req, res, id = null) {
    const document = await transaction(context, async (session) => {
      const existing = id ? await get(db, "categories", id, session) : null;
      const data = pick(req.body, categoryFields);
      const slug = data.slug || (existing?.slug ?? slugify(data.name));
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail("Invalid category slug.");
      if (
        await db
          .collection("categories")
          .findOne(
            {
              slug,
              ...active,
              ...(existing ? { _id: { $ne: existing._id } } : {}),
            },
            { session },
          )
      )
        fail("Category slug already exists.", 409);
      let parentId =
        data.parent_id === undefined ? existing?.parent_id : data.parent_id;
      let level = 0;
      const visited = new Set(id ? [id] : []);
      while (parentId) {
        if (visited.has(parentId))
          fail("Category hierarchy cannot contain a cycle.");
        visited.add(parentId);
        const parent = await get(db, "categories", parentId, session);
        level++;
        parentId = parent.parent_id;
      }
      if (level > 8) fail("Category hierarchy is too deep.");
      const values = { ...data, slug, level };
      const saved = id
        ? await update(db, "categories", id, values, session)
        : await insert(
            db,
            "categories",
            {
              description: null,
              image_id: null,
              parent_id: null,
              sort_order: 0,
              is_active: true,
              ...values,
            },
            session,
          );
      await audit(
        db,
        req,
        id ? "UPDATE_CATEGORY" : "CREATE_CATEGORY",
        "categories",
        saved._id,
        {},
        session,
      );
      return saved;
    });
    ok(res, document, "Category saved successfully.", id ? 200 : 201);
  }
  router.post("/", roles("admin"), validate("CategoryCreate"), (req, res) =>
    save(req, res),
  );
  router.patch("/:id", roles("admin"), validate("CategoryUpdate"), (req, res) =>
    save(req, res, req.params.id),
  );
  router.patch(
    "/:id/status",
    roles("admin"),
    validate("CategoryStatusUpdate"),
    (req, res) => save(req, res, req.params.id),
  );
  router.delete("/:id", roles("admin"), async (req, res) => {
    await get(db, "categories", req.params.id);
    if (
      (await db
        .collection("categories")
        .findOne({ parent_id: req.params.id, ...active })) ||
      (await db
        .collection("products")
        .findOne({ category_id: req.params.id, ...active }))
    )
      fail("Category has products or child categories.");
    await update(db, "categories", req.params.id, {
      is_deleted: true,
      deleted_at: now(),
    });
    ok(res);
  });
  router.get("/:slug", async (req, res) => {
    const category = await db
      .collection("categories")
      .findOne({ slug: req.params.slug, is_active: true, ...active });
    if (!category) fail("Category not found.", 404);
    ok(res, category);
  });
  return router;
}
export function productRoutes(context) {
  const { db } = context;
  const router = Router();
  router.get("/", async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageLimit = limit(req.query.limit, 48, 12);
    const filter = { status: "active", ...active };
    if (req.query.category_id)
      filter.category_id = String(req.query.category_id);
    if (req.query.category_slug) {
      const category = await db
        .collection("categories")
        .findOne({
          slug: String(req.query.category_slug),
          is_active: true,
          ...active,
        });
      filter.category_id = category ? String(category._id) : "__missing__";
    }
    if (req.query.is_featured !== undefined)
      filter.is_featured = req.query.is_featured === "true";
    if (req.query.search) {
      const match = {
        $regex: regex(String(req.query.search).trim().slice(0, 100)),
        $options: "i",
      };
      filter.$or = [
        "name",
        "description",
        "short_description",
        "search_keywords",
      ].map((field) => ({ [field]: match }));
    }
    const sort = String(req.query.sort || "");
    let sortBy = { created_at: -1, _id: -1 };
    if (
      [
        "price_asc",
        "price:low-to-high",
        "price_low_high",
        "price-low-high",
      ].includes(sort)
    )
      sortBy = { min_price: 1, _id: 1 };
    if (
      [
        "price_desc",
        "price:high-to-low",
        "price_high_low",
        "price-high-low",
      ].includes(sort)
    )
      sortBy = { min_price: -1, _id: -1 };
    if (["featured", "is_featured"].includes(sort))
      sortBy = { is_featured: -1, created_at: -1, _id: -1 };
    const [documents, count] = await Promise.all([
      db
        .collection("products")
        .find(filter)
        .sort(sortBy)
        .skip((page - 1) * pageLimit)
        .limit(pageLimit)
        .toArray(),
      db.collection("products").countDocuments(filter),
    ]);
    ok(res, {
      products: await productViews(db, documents),
      total_count: count,
      page,
      limit: pageLimit,
      has_more: page * pageLimit < count,
    });
  });
  router.get("/admin/all", roles("admin", "warehouse"), async (req, res) => {
    const filter = { ...active };
    if (req.query.category_id)
      filter.category_id = String(req.query.category_id);
    ok(
      res,
      await productViews(
        db,
        await db
          .collection("products")
          .find(filter)
          .skip(skip(req.query.skip))
          .limit(limit(req.query.limit))
          .toArray(),
      ),
    );
  });
  async function save(req, res, id = null) {
    const result = await transaction(context, async (session) => {
      const existing = id ? await get(db, "products", id, session) : null;
      const fields = pick(req.body, productFields);
      const product = {
        description: "",
        short_description: "",
        media_ids: [],
        attributes: [],
        variants: [],
        seo: { meta_title: null, meta_description: null, meta_keywords: [] },
        ratings: {
          average_rating: 0,
          review_count: 0,
          total_reviews: 0,
          star_1_count: 0,
          star_2_count: 0,
          star_3_count: 0,
          star_4_count: 0,
          star_5_count: 0,
        },
        tags: [],
        search_keywords: [],
        is_featured: false,
        status: "draft",
        ...existing,
        ...fields,
      };
      product.slug = fields.slug || existing?.slug || slugify(product.name);
      if (!["draft", "active", "archived"].includes(product.status))
        fail("Invalid product status.");
      const category = await get(
        db,
        "categories",
        product.category_id,
        session,
      );
      if (!category.is_active) fail("Product category is inactive.");
      if (
        await db
          .collection("products")
          .findOne(
            {
              slug: product.slug,
              ...active,
              ...(existing ? { _id: { $ne: existing._id } } : {}),
            },
            { session },
          )
      )
        fail("Product slug already exists.", 409);
      const seen = new Set();
      product.variants = product.variants.map((variant) => {
        const sku = variant.sku.trim().toUpperCase();
        if (!sku || seen.has(sku)) fail("Variant SKUs must be unique.");
        seen.add(sku);
        const previous = existing?.variants?.find((item) => item.sku === sku);
        return {
          ...pick(variant, [
            "title",
            "volume_weight",
            "stock_status",
            "is_active",
          ]),
          stock_status: variant.stock_status || "in_stock",
          is_active: variant.is_active ?? true,
          variant_id: previous?.variant_id || variant.variant_id || uid(),
          sku,
          price: money(variant.price),
        };
      });
      if (
        seen.size &&
        (await db
          .collection("products")
          .findOne(
            {
              "variants.sku": { $in: [...seen] },
              ...active,
              ...(existing ? { _id: { $ne: existing._id } } : {}),
            },
            { session },
          ))
      )
        fail("SKU already belongs to another product.", 409);
      for (const mediaId of product.media_ids) {
        const asset = await get(db, "media_assets", mediaId, session);
        if (asset.status !== "completed")
          fail("Product media upload is incomplete.");
      }
      const prices = product.variants
        .filter((variant) => variant.is_active)
        .map((variant) => amount(variant.price));
      product.min_price = money(
        prices.length
          ? prices.reduce((min, value) => (min.lt(value) ? min : value))
          : 0,
      );
      product.display_price = product.min_price;
      let saved;
      if (id) {
        delete product._id;
        saved = await update(db, "products", id, product, session);
      } else {
        saved = await insert(db, "products", product, session);
      }

      // Automatically ensure an inventory record exists in the registry for each variant
      for (const variant of saved.variants || []) {
        if (!variant.sku) continue;
        const existingInv = await db
          .collection("inventories")
          .findOne({ sku: variant.sku, ...active }, { session });
        if (!existingInv) {
          await insert(
            db,
            "inventories",
            {
              product_id: String(saved._id),
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
            },
            session,
          );
        } else if (
          existingInv.product_id !== String(saved._id) ||
          existingInv.variant_id !== variant.variant_id
        ) {
          await update(
            db,
            "inventories",
            String(existingInv._id),
            {
              product_id: String(saved._id),
              variant_id: variant.variant_id,
            },
            session,
          );
        }
      }
      await audit(
        db,
        req,
        existing ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
        "products",
        saved._id,
        {},
        session,
      );
      return saved;
    });
    ok(res, (await productViews(db, [result]))[0]);
  }
  router.post("/", roles("admin"), validate("ProductCreate"), (req, res) =>
    save(req, res),
  );
  router.patch("/:id", roles("admin"), validate("ProductUpdate"), (req, res) =>
    save(req, res, req.params.id),
  );
  router.patch(
    "/:id/status",
    roles("admin"),
    validate("ProductStatusUpdate"),
    (req, res) => save(req, res, req.params.id),
  );
  router.delete("/:id", roles("admin"), async (req, res) => {
    await update(db, "products", req.params.id, {
      is_deleted: true,
      deleted_at: now(),
    });
    ok(res);
  });
  const getProductBySlugHandler = async (req, res) => {
    let slug = req.params.slug;
    if (slug === "uthukuli-ghee") slug = "uthukuli-pure-cow-ghee";
    if (slug === "rasipuram-ghee") slug = "rasipuram-pure-ghee";
    const product = await db
      .collection("products")
      .findOne({ slug, status: "active", ...active });
    if (!product) fail("Product not found.", 404);
    ok(res, (await productViews(db, [product]))[0]);
  };
  router.get("/slug/:slug", getProductBySlugHandler);
  router.get("/:slug", getProductBySlugHandler);
  return router;
}
export function searchRoutes({ db }) {
  const router = Router();
  router.get("/autocomplete", async (req, res) => {
    const q = String(req.query.q || "").slice(0, 100);
    const matches = await db
      .collection("products")
      .find({
        ...active,
        status: "active",
        name: { $regex: "^" + regex(q), $options: "i" },
      })
      .project({ name: 1 })
      .limit(10)
      .toArray();
    ok(res, { suggestions: [...new Set(matches.map((item) => item.name))] });
  });
  router.get("/trending", async (req, res) =>
    ok(res, {
      trending: await db
        .collection("search_analytics")
        .aggregate([
          { $group: { _id: "$query", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit(req.query.limit, 50, 10) },
          { $project: { _id: 0, query: "$_id", count: 1 } },
        ])
        .toArray(),
    }),
  );
  router.get("/", async (req, res) => {
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 100);
    if (!q) fail("Search query is required.");
    const category = req.query.type === "category";
    const collection = category ? "categories" : "products";
    const filter = {
      ...active,
      ...(category ? { is_active: true } : { status: "active" }),
      name: { $regex: regex(q), $options: "i" },
    };
    if (!category && req.query.category_id)
      filter.category_id = String(req.query.category_id);
    const pageLimit = limit(req.query.limit, 100, 10);
    const offset = skip(req.query.skip);
    const [documents, count] = await Promise.all([
      db
        .collection(collection)
        .find(filter)
        .skip(offset)
        .limit(pageLimit)
        .toArray(),
      db.collection(collection).countDocuments(filter),
    ]);
    await insert(db, "search_analytics", {
      query: q,
      target_type: category ? "category" : "product",
      results_count: count,
      customer_id: req.user ? String(req.user._id) : null,
    });
    ok(
      res,
      category ? documents : await productViews(db, documents),
      "Search completed successfully.",
      200,
      {
        page: Math.floor(offset / pageLimit) + 1,
        limit: pageLimit,
        total_docs: count,
        total_pages: Math.ceil(count / pageLimit),
        has_next: offset + pageLimit < count,
        has_prev: offset > 0,
      },
    );
  });
  return router;
}
