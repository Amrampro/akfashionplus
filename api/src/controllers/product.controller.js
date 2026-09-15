import { transaction } from "../config/database.js";
import * as Product from "../models/product.model.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { toAoa } from "../utils/currency.js";

const languages = new Set(["fr", "en", "pt"]);

function requestLanguage(req) {
  return languages.has(req.lang) ? req.lang : "fr";
}

function productPayload(body, userId = null) {
  return {
    category_id: body.category_id,
    sku: body.sku,
    slug: body.slug,
    name_fr: body.name_fr,
    name_en: body.name_en,
    name_pt: body.name_pt,
    description_fr: body.description_fr || null,
    description_en: body.description_en || null,
    description_pt: body.description_pt || null,
    condition_type: body.condition_type || "new",
    sale_enabled: Boolean(body.sale_enabled ?? true),
    rental_enabled: Boolean(body.rental_enabled ?? false),
    sale_price_eur: body.sale_price_eur ?? null,
    rental_price_per_day_eur: body.rental_price_per_day_eur ?? null,
    rental_deposit_eur: body.rental_deposit_eur ?? 0,
    minimum_rental_days: body.minimum_rental_days ?? 1,
    maximum_rental_days: body.maximum_rental_days ?? null,
    featured: Boolean(body.featured ?? false),
    status: body.status || "active",
    created_by: userId,
  };
}

function defaultVariantFromProduct(body) {
  const sku = String(body.sku || "").trim();
  if (!sku) return null;

  return {
    sku: `${sku}-STD`,
    size: body.default_size || "Unique",
    color_name: body.default_color_name || null,
    color_hex: body.default_color_hex || "#071846",
    barcode: null,
    sale_price_eur: body.sale_price_eur ?? null,
    rental_price_per_day_eur: body.rental_price_per_day_eur ?? null,
    rental_deposit_eur: body.rental_deposit_eur ?? 0,
    stock_quantity: Number(body.initial_stock_quantity ?? 1),
    reserved_quantity: 0,
    status: "active",
  };
}

async function ensureActiveVariant(productId, body, connection) {
  const hasActiveVariant = await Product.hasActiveVariant(
    productId,
    connection,
  );
  if (hasActiveVariant) return;

  const product = await Product.findProductCoreById(productId, connection);
  const variant = defaultVariantFromProduct({
    ...product,
    ...body,
    sku: body.sku || product?.sku,
    sale_price_eur: body.sale_price_eur ?? product?.sale_price_eur,
    rental_price_per_day_eur:
      body.rental_price_per_day_eur ?? product?.rental_price_per_day_eur,
    rental_deposit_eur: body.rental_deposit_eur ?? product?.rental_deposit_eur,
  });
  if (!variant) return;

  await Product.createVariant(productId, variant, connection);
}

function validateProduct(body) {
  const required = [
    "category_id",
    "sku",
    "slug",
    "name_fr",
    "name_en",
    "name_pt",
  ];
  const missing = required.filter(
    (field) => body[field] === undefined || body[field] === "",
  );

  if (missing.length) {
    return `Missing required product fields: ${missing.join(", ")}`;
  }

  if (!["new", "second_hand"].includes(body.condition_type || "new")) {
    return "Invalid product condition";
  }

  if (
    body.status &&
    !["draft", "active", "inactive", "archived"].includes(body.status)
  ) {
    return "Invalid product status";
  }

  return null;
}

export async function listProducts(req, res) {
  const result = await Product.listProducts({
    lang: requestLanguage(req),
    query: req.query,
  });

  const exchangeRate = await Product.getCurrentExchangeRate();
  const data = result.rows.map((product) => ({
    ...product,
    sale_price_eur: product.effective_sale_price_eur ?? product.sale_price_eur,
    rental_price_per_day_eur:
      product.effective_rental_price_per_day_eur ??
      product.rental_price_per_day_eur,
    rental_deposit_eur:
      product.effective_rental_deposit_eur ?? product.rental_deposit_eur,
    sale_price_aoa: toAoa(
      product.effective_sale_price_eur ?? product.sale_price_eur,
      exchangeRate,
    ),
  }));

  return ok(res, data, "ok", result.meta);
}

export async function getProduct(req, res) {
  const product = await Product.findPublicProductBySlug(
    req.params.slug,
    requestLanguage(req),
  );

  if (!product) {
    return fail(res, 404, "Product not found");
  }

  const [variants, images, reviews, exchangeRate] = await Promise.all([
    Product.listVariants(product.id),
    Product.listImages(product.id),
    Product.listPublishedReviews(product.id),
    Product.getCurrentExchangeRate(),
  ]);

  return ok(res, {
    ...product,
    sale_price_eur: product.effective_sale_price_eur ?? product.sale_price_eur,
    rental_price_per_day_eur:
      product.effective_rental_price_per_day_eur ??
      product.rental_price_per_day_eur,
    rental_deposit_eur:
      product.effective_rental_deposit_eur ?? product.rental_deposit_eur,
    sale_price_aoa: toAoa(
      product.effective_sale_price_eur ?? product.sale_price_eur,
      exchangeRate,
    ),
    variants,
    images,
    reviews,
  });
}

export async function getAdminProduct(req, res) {
  const product = await Product.findAdminProductById(
    req.params.id,
    requestLanguage(req),
  );

  if (!product) {
    return fail(res, 404, "Product not found");
  }

  const [variants, images, reviews, exchangeRate] = await Promise.all([
    Product.listVariants(product.id),
    Product.listImages(product.id),
    Product.listPublishedReviews(product.id),
    Product.getCurrentExchangeRate(),
  ]);

  return ok(res, {
    ...product,
    sale_price_aoa: toAoa(product.sale_price_eur, exchangeRate),
    variants,
    images,
    reviews,
  });
}

export async function createProduct(req, res) {
  const validationError = validateProduct(req.body);
  if (validationError) return fail(res, 422, validationError);

  const product = await transaction(async (connection) => {
    const result = await Product.createProduct(
      productPayload(req.body, req.user.id),
      connection,
    );

    const variants = Array.isArray(req.body.variants)
      ? req.body.variants.filter((variant) => variant?.sku)
      : [];

    if (variants.length) {
      for (const variant of variants) {
        await Product.createVariant(result.insertId, variant, connection);
      }
    } else {
      await ensureActiveVariant(result.insertId, req.body, connection);
    }

    if (Array.isArray(req.body.images)) {
      for (const image of req.body.images) {
        await Product.createImage(result.insertId, image, connection);
      }
    }

    return { id: result.insertId };
  });

  return created(res, product, "Product created");
}

export async function updateProduct(req, res) {
  const allowed = [
    "category_id",
    "sku",
    "slug",
    "name_fr",
    "name_en",
    "name_pt",
    "description_fr",
    "description_en",
    "description_pt",
    "condition_type",
    "sale_enabled",
    "rental_enabled",
    "sale_price_eur",
    "rental_price_per_day_eur",
    "rental_deposit_eur",
    "minimum_rental_days",
    "maximum_rental_days",
    "featured",
    "status",
  ];

  const payload = Object.fromEntries(
    allowed
      .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
      .map((field) => [field, req.body[field]]),
  );

  if (!Object.keys(payload).length) {
    return fail(res, 422, "No valid product fields provided");
  }

  await transaction(async (connection) => {
    await Product.updateProduct(req.params.id, payload, connection);
    if (payload.status === "active") {
      await ensureActiveVariant(req.params.id, req.body, connection);
    }
  });
  return ok(res, null, "Product updated");
}

export async function archiveProduct(req, res) {
  await Product.updateProduct(req.params.id, { status: "archived" });
  return ok(res, null, "Product archived");
}

export async function deleteProduct(req, res) {
  const blockers = await Product.countProductDeleteBlockers(req.params.id);
  const hasHistory =
    Number(blockers.order_items || 0) > 0 ||
    Number(blockers.cart_items || 0) > 0 ||
    Number(blockers.inventory_movements || 0) > 0;

  if (hasHistory) {
    return fail(
      res,
      409,
      "Ce produit ne peut pas etre supprime car il est deja lie a des commandes, paniers ou mouvements de stock. Archivez-le plutot pour le retirer du site public.",
      blockers,
    );
  }

  await Product.deleteProduct(req.params.id);
  return ok(res, null, "Product deleted");
}

export async function createVariant(req, res) {
  const result = await Product.createVariant(req.params.productId, req.body);
  return created(res, { id: result.insertId }, "Variant created");
}

export async function updateVariant(req, res) {
  await Product.updateVariant(req.params.variantId, req.body);
  return ok(res, null, "Variant updated");
}

export async function createImage(req, res) {
  const result = await Product.createImage(req.params.productId, req.body);
  return created(res, { id: result.insertId }, "Image created");
}

export async function uploadProductImage(req, res) {
  if (!req.file) {
    return fail(res, 422, "Image file is required");
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`;
  const result = await Product.createImage(req.params.productId, {
    image_url: imageUrl,
    alt_text: req.body.alt_text || null,
    is_primary: req.body.is_primary === "true" || req.body.is_primary === "1",
    sort_order: req.body.sort_order ?? 0,
  });

  return created(
    res,
    { id: result.insertId, image_url: imageUrl },
    "Image uploaded",
  );
}

export async function deleteImage(req, res) {
  await Product.deleteImage(req.params.imageId);
  return ok(res, null, "Image deleted");
}

export async function updateImage(req, res) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "image_url")) {
    payload.image_url = req.body.image_url;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "alt_text")) {
    payload.alt_text = req.body.alt_text || null;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "is_primary")) {
    payload.is_primary = Boolean(req.body.is_primary);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "sort_order")) {
    payload.sort_order = req.body.sort_order ?? 0;
  }

  await Product.updateImage(req.params.imageId, payload);
  return ok(res, null, "Image updated");
}

export default {
  listProducts,
  getAdminProduct,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  createImage,
  uploadProductImage,
  updateImage,
  deleteImage,
};
