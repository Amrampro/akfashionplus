import { created, fail, ok } from "../utils/apiResponse.js";
import * as Category from "../models/category.model.js";

const writableFields = [
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

function language(req) {
  return ["fr", "en", "pt"].includes(req.lang) ? req.lang : "pt";
}

function pickPayload(body) {
  return Object.fromEntries(
    writableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  );
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(baseValue, excludeId = null) {
  const baseSlug = slugify(baseValue) || "categorie";
  let candidate = baseSlug;
  let index = 2;

  while (await Category.slugExists(candidate, excludeId)) {
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }

  return candidate;
}

export async function listCategories(req, res) {
  const rows = await Category.listCategories(
    language(req),
    req.query.admin === "1",
  );
  return ok(res, rows);
}

export async function createCategory(req, res) {
  const required = ["name_fr", "name_en", "name_pt"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return fail(res, 422, `Missing category fields: ${missing.join(", ")}`);
  }

  const payload = pickPayload(req.body);
  payload.slug = await uniqueSlug(payload.slug || payload.name_fr);

  const result = await Category.createCategory(payload);
  return created(
    res,
    { id: result.insertId, slug: payload.slug },
    "Category created",
  );
}

export async function updateCategory(req, res) {
  const payload = pickPayload(req.body);

  if (!Object.keys(payload).length) {
    return fail(res, 422, "No valid category fields provided");
  }

  if (payload.slug || payload.name_fr) {
    payload.slug = await uniqueSlug(
      payload.slug || payload.name_fr,
      req.params.id,
    );
  }

  await Category.updateCategory(req.params.id, payload);
  return ok(res, { slug: payload.slug }, "Category updated");
}

export async function uploadCategoryImage(req, res) {
  if (!req.file) {
    return fail(res, 422, "Image file is required");
  }

  const category = await Category.findCategoryById(
    req.params.id,
    language(req),
  );
  if (!category) {
    return fail(res, 404, "Category not found");
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/categories/${req.file.filename}`;
  await Category.updateCategory(req.params.id, { image_url: imageUrl });

  return ok(res, { image_url: imageUrl }, "Category image uploaded");
}

export async function deleteCategory(req, res) {
  const blockers = await Category.countCategoryDeleteBlockers(req.params.id);
  const products = Number(blockers.products || 0);
  const children = Number(blockers.children || 0);

  if (products || children) {
    return fail(
      res,
      409,
      `Impossible de supprimer cette categorie: ${products} produit(s) et ${children} sous-categorie(s) y sont rattaches. Desactivez-la plutot.`,
      { blockers: { products, children } },
    );
  }

  await Category.deleteCategory(req.params.id);
  return ok(res, null, "Category deleted");
}

export default {
  listCategories,
  createCategory,
  updateCategory,
  uploadCategoryImage,
  deleteCategory,
};
