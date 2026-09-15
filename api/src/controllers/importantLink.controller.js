import fs from "node:fs";
import path from "node:path";
import { query } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 180);
}

async function uniqueSlug(title, id = null) {
  const base = slugify(title) || `lien-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (true) {
    const rows = await query(
      `SELECT id FROM important_links WHERE slug = :slug ${id ? "AND id <> :id" : ""} LIMIT 1`,
      { slug, id },
    );
    if (!rows.length) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function publicUrl(req, file) {
  return `${req.protocol}://${req.get("host")}/uploads/important-links/${file.filename}`;
}

function unlinkUploadedFile(fileUrl) {
  if (!fileUrl) return;
  try {
    const filename = path.basename(new URL(fileUrl).pathname);
    const target = path.resolve("uploads/important-links", filename);
    const root = path.resolve("uploads/important-links");
    if (target.startsWith(root) && fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  } catch {
    // File cleanup is best-effort only.
  }
}

export async function listPublicImportantLinks(_req, res) {
  const rows = await query(
    `SELECT id, title, slug, pdf_url, status, sort_order, created_at, updated_at
     FROM important_links
     WHERE status = 'active'
     ORDER BY sort_order ASC, title ASC`,
  );
  return ok(res, rows);
}

export async function getPublicImportantLink(req, res) {
  const rows = await query(
    `SELECT id, title, slug, pdf_url, status, sort_order, created_at, updated_at
     FROM important_links
     WHERE slug = :slug AND status = 'active'
     LIMIT 1`,
    { slug: req.params.slug },
  );
  if (!rows.length) return fail(res, 404, "Important link not found");
  return ok(res, rows[0]);
}

export async function listAdminImportantLinks(_req, res) {
  const rows = await query(
    `SELECT id, title, slug, pdf_url, pdf_filename, status, sort_order, created_at, updated_at
     FROM important_links
     ORDER BY sort_order ASC, updated_at DESC`,
  );
  return ok(res, rows);
}

export async function createImportantLink(req, res) {
  const title = String(req.body.title || "").trim();
  const status = req.body.status === "inactive" ? "inactive" : "active";
  const sortOrder = Number(req.body.sort_order || 0);

  if (!title) return fail(res, 422, "Le nom du lien est obligatoire");
  if (!req.file) return fail(res, 422, "Le fichier PDF est obligatoire");

  const slug = await uniqueSlug(title);
  const pdfUrl = publicUrl(req, req.file);
  const result = await query(
    `INSERT INTO important_links
       (title, slug, pdf_url, pdf_filename, status, sort_order, created_by, updated_by)
     VALUES
       (:title, :slug, :pdf_url, :pdf_filename, :status, :sort_order, :created_by, :updated_by)`,
    {
      title,
      slug,
      pdf_url: pdfUrl,
      pdf_filename: req.file.filename,
      status,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      created_by: req.user.id,
      updated_by: req.user.id,
    },
  );

  return created(res, { id: result.insertId, title, slug, pdf_url: pdfUrl, status }, "Important link created");
}

export async function updateImportantLink(req, res) {
  const rows = await query("SELECT * FROM important_links WHERE id = :id LIMIT 1", {
    id: req.params.id,
  });
  if (!rows.length) return fail(res, 404, "Important link not found");

  const current = rows[0];
  const title = String(req.body.title || "").trim();
  const status = req.body.status === "inactive" ? "inactive" : "active";
  const sortOrder = Number(req.body.sort_order || 0);
  if (!title) return fail(res, 422, "Le nom du lien est obligatoire");

  const pdfUrl = req.file ? publicUrl(req, req.file) : current.pdf_url;
  const pdfFilename = req.file ? req.file.filename : current.pdf_filename;
  const slug = await uniqueSlug(title, req.params.id);

  await query(
    `UPDATE important_links
     SET title = :title,
         slug = :slug,
         pdf_url = :pdf_url,
         pdf_filename = :pdf_filename,
         status = :status,
         sort_order = :sort_order,
         updated_by = :updated_by
     WHERE id = :id`,
    {
      id: req.params.id,
      title,
      slug,
      pdf_url: pdfUrl,
      pdf_filename: pdfFilename,
      status,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      updated_by: req.user.id,
    },
  );

  if (req.file) unlinkUploadedFile(current.pdf_url);
  return ok(res, { id: Number(req.params.id), title, slug, pdf_url: pdfUrl, status }, "Important link updated");
}

export async function deleteImportantLink(req, res) {
  const rows = await query("SELECT * FROM important_links WHERE id = :id LIMIT 1", {
    id: req.params.id,
  });
  if (!rows.length) return fail(res, 404, "Important link not found");

  await query("DELETE FROM important_links WHERE id = :id", { id: req.params.id });
  unlinkUploadedFile(rows[0].pdf_url);
  return ok(res, null, "Important link deleted");
}
