import { query } from "../config/database.js";

const columns = [
  "parent_id",
  "slug",
  "name_fr",
  "name_en",
  "name_pt",
  "description_fr",
  "description_en",
  "description_pt",
  "image_url",
  "sort_order",
  "status",
];

export async function listCategories(lang = "fr", includeInactive = false) {
  const orderBy = includeInactive
    ? "created_at DESC, id DESC"
    : `sort_order, name_${lang}`;

  return query(
    `SELECT id,
      parent_id,
      slug,
      name_${lang} AS name,
      name_fr,
      name_en,
      name_pt,
      description_${lang} AS description,
      description_fr,
      description_en,
      description_pt,
      image_url,
      sort_order,
      status,
      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.category_id = categories.id
      ) AS product_count,
      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.category_id = categories.id AND p.status = 'active'
      ) AS active_product_count,
      (
        SELECT COUNT(*)
        FROM categories child
        WHERE child.parent_id = categories.id
      ) AS child_count,
      created_at,
      updated_at
     FROM categories
     WHERE (:includeInactive = 1 OR status = 'active')
     ORDER BY ${orderBy}`,
    { includeInactive: includeInactive ? 1 : 0 },
  );
}

export async function findCategoryById(categoryId, lang = "fr") {
  const rows = await query(
    `SELECT id,
      parent_id,
      slug,
      name_${lang} AS name,
      name_fr,
      name_en,
      name_pt,
      description_${lang} AS description,
      description_fr,
      description_en,
      description_pt,
      image_url,
      sort_order,
      status,
      created_at,
      updated_at
     FROM categories
     WHERE id = :id
     LIMIT 1`,
    { id: categoryId },
  );
  return rows[0] || null;
}

export async function slugExists(slug, excludeId = null) {
  const rows = await query(
    `SELECT id
     FROM categories
     WHERE slug = :slug AND (:excludeId IS NULL OR id <> :excludeId)
     LIMIT 1`,
    { slug, excludeId },
  );
  return Boolean(rows[0]);
}

export async function createCategory(payload) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  const values = Object.fromEntries(
    keys.map((field) => [field, payload[field]]),
  );

  return query(
    `INSERT INTO categories (${keys.join(", ")})
     VALUES (${keys.map((field) => `:${field}`).join(", ")})`,
    values,
  );
}

export async function updateCategory(categoryId, payload) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  if (!keys.length) return null;

  return query(
    `UPDATE categories
     SET ${keys.map((field) => `${field} = :${field}`).join(", ")}
     WHERE id = :id`,
    {
      id: categoryId,
      ...Object.fromEntries(keys.map((field) => [field, payload[field]])),
    },
  );
}

export async function countCategoryDeleteBlockers(categoryId) {
  const rows = await query(
    `SELECT
      (SELECT COUNT(*) FROM products WHERE category_id = :id) AS products,
      (SELECT COUNT(*) FROM categories WHERE parent_id = :id) AS children`,
    { id: categoryId },
  );
  return rows[0] || {};
}

export async function deleteCategory(categoryId) {
  return query("DELETE FROM categories WHERE id = :id", { id: categoryId });
}

export default {
  listCategories,
  findCategoryById,
  slugExists,
  createCategory,
  updateCategory,
  countCategoryDeleteBlockers,
  deleteCategory,
};
