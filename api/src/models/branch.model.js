import { query } from "../config/database.js";

const columns = [
  "name",
  "code",
  "phone",
  "email",
  "address_line_1",
  "address_line_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "latitude",
  "longitude",
  "opening_hours",
  "status",
];

export async function listBranches({ q = null, includeInactive = false } = {}) {
  return query(
    `SELECT
       b.*,
       COUNT(DISTINCT o.id) AS orders_count,
       COALESCE(SUM(CASE WHEN o.payment_status IN ('paid', 'partially_refunded') THEN o.total_eur ELSE 0 END), 0) AS revenue_eur,
       SUM(CASE WHEN o.status = 'ready_for_pickup' THEN 1 ELSE 0 END) AS ready_pickups_count,
       COUNT(DISTINCT op.id) AS completed_pickups_count,
       COUNT(DISTINCT cr.id) AS resales_count,
       COUNT(DISTINCT cashier.id) AS cashiers_count,
       MAX(o.created_at) AS last_order_at
     FROM branches b
     LEFT JOIN orders o ON o.branch_id = b.id
     LEFT JOIN order_pickups op ON op.branch_id = b.id
     LEFT JOIN company_resales cr ON cr.branch_id = b.id
     LEFT JOIN users cashier ON cashier.branch_id = b.id AND cashier.role = 'cashier'
     WHERE (:includeInactive = 1 OR b.status = 'active')
       AND (:q IS NULL OR b.name LIKE :like OR b.city LIKE :like OR b.code LIKE :like)
     GROUP BY b.id
     ORDER BY b.created_at DESC, b.id DESC`,
    {
      includeInactive: includeInactive ? 1 : 0,
      q: q || null,
      like: `%${q || ""}%`,
    },
  );
}

export async function createBranch(payload) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );

  return query(
    `INSERT INTO branches (${keys.join(", ")})
     VALUES (${keys.map((field) => `:${field}`).join(", ")})`,
    Object.fromEntries(keys.map((field) => [field, payload[field]])),
  );
}

export async function updateBranch(branchId, payload) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  if (!keys.length) return null;

  return query(
    `UPDATE branches
     SET ${keys.map((field) => `${field} = :${field}`).join(", ")}
     WHERE id = :id`,
    {
      id: branchId,
      ...Object.fromEntries(keys.map((field) => [field, payload[field]])),
    },
  );
}

export default {
  listBranches,
  createBranch,
  updateBranch,
};
