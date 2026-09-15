import { db, query } from "../config/database.js";

const productColumns = (lang) => `
  p.id,
  p.category_id,
  p.sku,
  p.slug,
  p.condition_type,
  p.sale_enabled,
  p.rental_enabled,
  p.sale_price_eur,
  p.rental_price_per_day_eur,
  p.rental_deposit_eur,
  p.minimum_rental_days,
  p.maximum_rental_days,
  p.featured,
  p.status,
  pv_default.id AS default_variant_id,
  pv_default.sku AS default_variant_sku,
  pv_default.size AS default_variant_size,
  pv_default.color_name AS default_variant_color_name,
  pv_default.color_hex AS default_variant_color_hex,
  pv_default.stock_quantity AS default_variant_stock_quantity,
  pv_default.reserved_quantity AS default_variant_reserved_quantity,
  COALESCE(pv_default.sale_price_eur, p.sale_price_eur) AS effective_sale_price_eur,
  COALESCE(
    pv_default.rental_price_per_day_eur,
    p.rental_price_per_day_eur
  ) AS effective_rental_price_per_day_eur,
  COALESCE(
    pv_default.rental_deposit_eur,
    p.rental_deposit_eur
  ) AS effective_rental_deposit_eur,
  p.name_${lang} AS name,
  p.description_${lang} AS description,
  c.name_${lang} AS category_name,
  COALESCE(img.image_url, '') AS image_url,
  COALESCE(r.total_reviews, 0) AS total_reviews,
  COALESCE(r.average_rating, 0) AS average_rating
`;

const defaultVariantJoin = `
  INNER JOIN product_variants pv_default ON pv_default.id = (
    SELECT pv.id
    FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.status = 'active'
    ORDER BY
      (pv.stock_quantity - pv.reserved_quantity) DESC,
      pv.id ASC
    LIMIT 1
  )
`;

const optionalDefaultVariantJoin = defaultVariantJoin.replace(
  "INNER JOIN",
  "LEFT JOIN",
);

const coverImageJoin = `
  LEFT JOIN product_images img ON img.id = (
    SELECT pi.id
    FROM product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
    LIMIT 1
  )
`;

export async function getCurrentExchangeRate(connection = db) {
  const [rows] = await connection.execute(
    "SELECT rate FROM v_current_exchange_rate LIMIT 1",
  );
  return Number(rows[0]?.rate || 1000);
}

export async function listProducts({ lang = "fr", query: filters = {} }) {
  const limit = Math.min(Math.max(Number(filters.limit || 24), 1), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const includeInactive =
    filters.admin === "1" || filters.include_inactive === "1";
  const where = includeInactive ? ["1 = 1"] : ["p.status = 'active'"];
  const params = { limit, offset };

  if (filters.q) {
    where.push(
      `(p.name_${lang} LIKE :q OR p.description_${lang} LIKE :q OR p.sku LIKE :q)`,
    );
    params.q = `%${filters.q}%`;
  }

  if (filters.category_id) {
    where.push("p.category_id = :category_id");
    params.category_id = filters.category_id;
  }

  if (
    includeInactive &&
    ["draft", "active", "inactive", "archived"].includes(filters.status)
  ) {
    where.push("p.status = :status");
    params.status = filters.status;
  }

  if (["new", "second_hand"].includes(filters.condition_type)) {
    where.push("p.condition_type = :condition_type");
    params.condition_type = filters.condition_type;
  }

  if (filters.rental === "1") where.push("p.rental_enabled = TRUE");
  if (filters.sale === "1") where.push("p.sale_enabled = TRUE");
  if (filters.featured === "1") where.push("p.featured = TRUE");

  const sqlWhere = where.join(" AND ");
  const variantJoin = includeInactive
    ? optionalDefaultVariantJoin
    : defaultVariantJoin;
  const orderBy = includeInactive
    ? "p.created_at DESC, p.id DESC"
    : "p.featured DESC, p.created_at DESC, p.id DESC";

  const rows = await query(
    `SELECT ${productColumns(lang)}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${variantJoin}
     LEFT JOIN v_product_ratings r ON r.product_id = p.id
     ${coverImageJoin}
     WHERE ${sqlWhere}
     ORDER BY ${orderBy}
     LIMIT :limit OFFSET :offset`,
    params,
  );

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total
     FROM products p
     ${variantJoin}
     WHERE ${sqlWhere}`,
    params,
  );

  return { rows, meta: { page, limit, total } };
}

export async function findAdminProductById(productId, lang = "fr") {
  const rows = await query(
    `SELECT
      ${productColumns(lang)},
      p.name_fr,
      p.name_en,
      p.name_pt,
      p.description_fr,
      p.description_en,
      p.description_pt
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${optionalDefaultVariantJoin}
     LEFT JOIN v_product_ratings r ON r.product_id = p.id
     ${coverImageJoin}
     WHERE p.id = :id
     LIMIT 1`,
    { id: productId },
  );
  return rows[0] || null;
}

export async function findPublicProductBySlug(slug, lang = "fr") {
  const rows = await query(
    `SELECT ${productColumns(lang)}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${defaultVariantJoin}
     LEFT JOIN v_product_ratings r ON r.product_id = p.id
     ${coverImageJoin}
     WHERE p.slug = :slug AND p.status = 'active'
     LIMIT 1`,
    { slug },
  );
  return rows[0] || null;
}

export async function listVariants(productId) {
  return query(
    `SELECT *
     FROM product_variants
     WHERE product_id = :product_id
     ORDER BY color_name, size`,
    { product_id: productId },
  );
}

export async function hasActiveVariant(productId, connection = db) {
  const [rows] = await connection.execute(
    `SELECT id
     FROM product_variants
     WHERE product_id = ? AND status = 'active'
     LIMIT 1`,
    [productId],
  );
  return Boolean(rows[0]);
}

export async function findProductCoreById(productId, connection = db) {
  const [rows] = await connection.execute(
    `SELECT
      id,
      sku,
      sale_price_eur,
      rental_price_per_day_eur,
      rental_deposit_eur
     FROM products
     WHERE id = ?
     LIMIT 1`,
    [productId],
  );
  return rows[0] || null;
}

export async function listImages(productId) {
  return query(
    `SELECT *
     FROM product_images
     WHERE product_id = :product_id
     ORDER BY is_primary DESC, sort_order`,
    { product_id: productId },
  );
}

export async function listPublishedReviews(productId) {
  return query(
    `SELECT pr.rating, pr.title, pr.comment, pr.created_at, u.first_name
     FROM product_reviews pr
     INNER JOIN users u ON u.id = pr.user_id
     WHERE pr.product_id = :product_id AND pr.status = 'published'
     ORDER BY pr.created_at DESC
     LIMIT 20`,
    { product_id: productId },
  );
}

export async function createProduct(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO products (
      category_id,
      sku,
      slug,
      name_fr,
      name_en,
      name_pt,
      description_fr,
      description_en,
      description_pt,
      condition_type,
      sale_enabled,
      rental_enabled,
      sale_price_eur,
      rental_price_per_day_eur,
      rental_deposit_eur,
      minimum_rental_days,
      maximum_rental_days,
      featured,
      status,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.category_id,
      payload.sku,
      payload.slug,
      payload.name_fr,
      payload.name_en,
      payload.name_pt,
      payload.description_fr,
      payload.description_en,
      payload.description_pt,
      payload.condition_type,
      payload.sale_enabled,
      payload.rental_enabled,
      payload.sale_price_eur,
      payload.rental_price_per_day_eur,
      payload.rental_deposit_eur,
      payload.minimum_rental_days,
      payload.maximum_rental_days,
      payload.featured,
      payload.status,
      payload.created_by,
    ],
  );
  return result;
}

export async function updateProduct(productId, payload, connection = db) {
  const keys = Object.keys(payload);
  const [result] = await connection.execute(
    `UPDATE products
     SET ${keys.map((key) => `${key} = :${key}`).join(", ")}
     WHERE id = :id`,
    { id: productId, ...payload },
  );
  return result;
}

export async function countProductDeleteBlockers(productId) {
  const rows = await query(
    `SELECT
      (SELECT COUNT(*) FROM order_items WHERE product_id = :id) AS order_items,
      (
        SELECT COUNT(*)
        FROM cart_items ci
        INNER JOIN product_variants pv ON pv.id = ci.product_variant_id
        WHERE pv.product_id = :id
      ) AS cart_items,
      (
        SELECT COUNT(*)
        FROM inventory_movements im
        INNER JOIN product_variants pv ON pv.id = im.product_variant_id
        WHERE pv.product_id = :id
      ) AS inventory_movements`,
    { id: productId },
  );
  return rows[0] || {};
}

export async function deleteProduct(productId) {
  return query("DELETE FROM products WHERE id = :id", { id: productId });
}

export async function createVariant(productId, payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO product_variants (
      product_id,
      sku,
      size,
      color_name,
      color_hex,
      barcode,
      sale_price_eur,
      rental_price_per_day_eur,
      rental_deposit_eur,
      stock_quantity,
      reserved_quantity,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      payload.sku,
      payload.size || null,
      payload.color_name || null,
      payload.color_hex || null,
      payload.barcode || null,
      payload.sale_price_eur ?? null,
      payload.rental_price_per_day_eur ?? null,
      payload.rental_deposit_eur ?? null,
      payload.stock_quantity ?? 0,
      payload.reserved_quantity ?? 0,
      payload.status || "active",
    ],
  );
  return result;
}

export async function updateVariant(variantId, payload) {
  const allowed = [
    "sku",
    "size",
    "color_name",
    "color_hex",
    "barcode",
    "sale_price_eur",
    "rental_price_per_day_eur",
    "rental_deposit_eur",
    "stock_quantity",
    "reserved_quantity",
    "status",
  ];
  const data = Object.fromEntries(
    allowed
      .filter((field) => Object.prototype.hasOwnProperty.call(payload, field))
      .map((field) => [field, payload[field]]),
  );
  const keys = Object.keys(data);
  if (!keys.length) return null;

  return query(
    `UPDATE product_variants
     SET ${keys.map((key) => `${key} = :${key}`).join(", ")}
     WHERE id = :id`,
    { id: variantId, ...data },
  );
}

export async function createImage(productId, payload, connection = db) {
  if (payload.is_primary) {
    await connection.execute(
      "UPDATE product_images SET is_primary = FALSE WHERE product_id = ?",
      [productId],
    );
  }

  const [result] = await connection.execute(
    `INSERT INTO product_images (
      product_id,
      image_url,
      alt_text,
      is_primary,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?)`,
    [
      productId,
      payload.image_url,
      payload.alt_text || null,
      Boolean(payload.is_primary),
      payload.sort_order ?? 0,
    ],
  );
  return result;
}

export async function updateImage(imageId, payload) {
  const rows = await query(
    "SELECT product_id FROM product_images WHERE id = :id LIMIT 1",
    { id: imageId },
  );
  const image = rows[0];
  if (!image) return null;

  if (payload.is_primary) {
    await query(
      "UPDATE product_images SET is_primary = FALSE WHERE product_id = :product_id AND id <> :id",
      { product_id: image.product_id, id: imageId },
    );
  }

  const allowed = ["image_url", "alt_text", "is_primary", "sort_order"];
  const data = Object.fromEntries(
    allowed
      .filter((field) => Object.prototype.hasOwnProperty.call(payload, field))
      .map((field) => [field, payload[field]]),
  );
  const keys = Object.keys(data);
  if (!keys.length) return null;

  return query(
    `UPDATE product_images
     SET ${keys.map((key) => `${key} = :${key}`).join(", ")}
     WHERE id = :id`,
    { id: imageId, ...data },
  );
}

export async function deleteImage(imageId) {
  return query("DELETE FROM product_images WHERE id = :id", { id: imageId });
}

export default {
  getCurrentExchangeRate,
  listProducts,
  findAdminProductById,
  findPublicProductBySlug,
  listVariants,
  hasActiveVariant,
  findProductCoreById,
  listImages,
  listPublishedReviews,
  createProduct,
  updateProduct,
  countProductDeleteBlockers,
  deleteProduct,
  createVariant,
  updateVariant,
  createImage,
  updateImage,
  deleteImage,
};
