import { query } from "../config/database.js";

const proposalColumns = [
  "proposal_number",
  "user_id",
  "category_id",
  "item_type",
  "brand",
  "size",
  "color",
  "condition_state",
  "description",
  "desired_price_eur",
  "offered_price_eur",
  "final_price_eur",
  "status",
  "bank_account_holder",
  "bank_account_number",
  "bank_name",
  "evaluated_by",
  "evaluated_at",
  "admin_notes",
  "handover_method",
  "handover_instructions",
  "user_responded_at",
  "accepted_at",
  "rejected_at",
  "item_received_at",
  "verified_at",
  "paid_at",
  "payment_reference",
];

function listWhere(filters = {}, admin = false) {
  const clauses = [];
  const params = {
    status: filters.status || null,
    user_id: filters.user_id || null,
    date_from: filters.date_from || null,
    date_to: filters.date_to || null,
    q: filters.q || null,
    like: `%${filters.q || ""}%`,
  };

  if (!admin) clauses.push("p.user_id = :user_id");
  if (filters.status) clauses.push("p.status = :status");
  if (filters.date_from) clauses.push("DATE(p.created_at) >= :date_from");
  if (filters.date_to) clauses.push("DATE(p.created_at) <= :date_to");
  if (filters.q) {
    clauses.push(`(
      p.proposal_number LIKE :like
      OR p.brand LIKE :like
      OR p.item_type LIKE :like
      OR u.first_name LIKE :like
      OR u.last_name LIKE :like
      OR u.email LIKE :like
    )`);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export async function listUserProposals(userId, filters = {}) {
  return listProposals({ ...filters, user_id: userId }, false);
}

export async function listAdminProposals(filters = {}) {
  return listProposals(filters, true);
}

async function listProposals(filters = {}, admin = false) {
  const where = listWhere(filters, admin);
  return query(
    `SELECT
      p.*,
      c.name_fr AS category_name_fr,
      c.name_en AS category_name_en,
      c.name_pt AS category_name_pt,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name,
      u.email AS user_email,
      u.phone AS user_phone,
      u.preferred_language AS user_language,
      CONCAT(evaluator.first_name, ' ', evaluator.last_name) AS evaluated_by_name,
      (
        SELECT image_url
        FROM second_hand_proposal_images img
        WHERE img.proposal_id = p.id
        ORDER BY img.sort_order ASC, img.id ASC
        LIMIT 1
      ) AS cover_image_url,
      (
        SELECT COUNT(*)
        FROM second_hand_proposal_images img
        WHERE img.proposal_id = p.id
      ) AS images_count
     FROM second_hand_proposals p
     LEFT JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN users evaluator ON evaluator.id = p.evaluated_by
     ${where.sql}
     ORDER BY p.created_at DESC, p.id DESC`,
    where.params,
  );
}

export async function findProposalById(id, user = null) {
  const staff = user?.role === "admin" || user?.role === "cashier";
  const rows = await query(
    `SELECT
      p.*,
      c.name_fr AS category_name_fr,
      c.name_en AS category_name_en,
      c.name_pt AS category_name_pt,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name,
      u.email AS user_email,
      u.phone AS user_phone,
      u.preferred_language AS user_language,
      CONCAT(evaluator.first_name, ' ', evaluator.last_name) AS evaluated_by_name
     FROM second_hand_proposals p
     LEFT JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN users evaluator ON evaluator.id = p.evaluated_by
     WHERE p.id = :id
       AND (:staff = 1 OR p.user_id = :user_id)
     LIMIT 1`,
    { id, staff: staff ? 1 : 0, user_id: user?.id || null },
  );
  return rows[0] || null;
}

export async function proposalNumberExists(proposalNumber) {
  const rows = await query(
    "SELECT id FROM second_hand_proposals WHERE proposal_number = :proposalNumber LIMIT 1",
    { proposalNumber },
  );
  return Boolean(rows[0]);
}

export async function createProposal(payload) {
  const keys = proposalColumns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  return query(
    `INSERT INTO second_hand_proposals (${keys.join(", ")})
     VALUES (${keys.map((field) => `:${field}`).join(", ")})`,
    Object.fromEntries(keys.map((field) => [field, payload[field]])),
  );
}

export async function updateProposal(id, payload) {
  const keys = proposalColumns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  if (!keys.length) return null;
  return query(
    `UPDATE second_hand_proposals
     SET ${keys.map((field) => `${field} = :${field}`).join(", ")}
     WHERE id = :id`,
    { id, ...Object.fromEntries(keys.map((field) => [field, payload[field]])) },
  );
}

export async function replaceImages(proposalId, images = []) {
  await query(
    "DELETE FROM second_hand_proposal_images WHERE proposal_id = :proposalId",
    { proposalId },
  );
  for (const [index, imageUrl] of images.entries()) {
    await query(
      `INSERT INTO second_hand_proposal_images (proposal_id, image_url, sort_order)
       VALUES (:proposalId, :imageUrl, :sortOrder)`,
      { proposalId, imageUrl, sortOrder: index },
    );
  }
}

export async function addImages(proposalId, images = []) {
  const rows = await query(
    `SELECT COALESCE(MAX(sort_order), -1) AS max_order
     FROM second_hand_proposal_images
     WHERE proposal_id = :proposalId`,
    { proposalId },
  );
  const start = Number(rows[0]?.max_order || -1) + 1;
  for (const [index, imageUrl] of images.entries()) {
    await query(
      `INSERT INTO second_hand_proposal_images (proposal_id, image_url, sort_order)
       VALUES (:proposalId, :imageUrl, :sortOrder)`,
      { proposalId, imageUrl, sortOrder: start + index },
    );
  }
}

export async function listImages(proposalId) {
  return query(
    `SELECT id, proposal_id, image_url, sort_order, created_at
     FROM second_hand_proposal_images
     WHERE proposal_id = :proposalId
     ORDER BY sort_order ASC, id ASC`,
    { proposalId },
  );
}

export default {
  listUserProposals,
  listAdminProposals,
  findProposalById,
  proposalNumberExists,
  createProposal,
  updateProposal,
  replaceImages,
  addImages,
  listImages,
};
