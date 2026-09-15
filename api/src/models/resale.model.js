import { db, query } from "../config/database.js";

export async function listResales(user, filters = {}) {
  return query(
    `SELECT
      cr.*,
      o.order_number,
      o.payment_status,
      o.fulfillment_type,
      o.created_at AS ordered_at,
      oi.product_name,
      oi.sku,
      oi.size,
      oi.color,
      oi.condition_type,
      oi.quantity,
      oi.line_total_eur,
      CONCAT(customer.first_name, ' ', customer.last_name) AS customer_name,
      customer.email AS customer_email,
      customer.phone AS customer_phone,
      b.name AS branch_name,
      b.city AS branch_city,
      CONCAT(cashier.first_name, ' ', cashier.last_name) AS cashier_name,
      cashier.email AS cashier_email,
      CONCAT(approver.first_name, ' ', approver.last_name) AS approved_by_name,
      COALESCE(img.image_url, '') AS image_url
     FROM company_resales cr
     INNER JOIN order_items oi ON oi.id = cr.order_item_id
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN users customer ON customer.id = cr.user_id
     INNER JOIN branches b ON b.id = cr.branch_id
     LEFT JOIN users cashier ON cashier.id = cr.cashier_id
     LEFT JOIN users approver ON approver.id = cr.approved_by
     LEFT JOIN product_images img ON img.id = (
       SELECT pi.id
       FROM product_images pi
       WHERE pi.product_id = oi.product_id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
       LIMIT 1
     )
     WHERE (
       :admin = 1
       OR cr.user_id = :user_id
       OR :cashier = 1
     )
       AND (:status IS NULL OR cr.status = :status)
       AND (:branch_filter IS NULL OR cr.branch_id = :branch_filter)
       AND (
         :q IS NULL
         OR o.order_number LIKE :like
         OR cr.beneficiary_name LIKE :like
         OR cr.beneficiary_phone LIKE :like
         OR oi.product_name LIKE :like
         OR customer.email LIKE :like
         OR customer.first_name LIKE :like
         OR customer.last_name LIKE :like
       )
     ORDER BY cr.requested_at DESC`,
    {
      admin: user.role === "admin" ? 1 : 0,
      cashier: user.role === "cashier" ? 1 : 0,
      user_id: user.id,
      branch_filter: filters.branch_id || null,
      status: filters.status || null,
      q: filters.q || null,
      like: `%${filters.q || ""}%`,
    },
  );
}

export async function lockResale(resaleId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM company_resales WHERE id = ? FOR UPDATE",
    [resaleId],
  );
  return rows[0] || null;
}

export async function updateResaleStatus(resaleId, payload) {
  return query(
    `UPDATE company_resales
     SET status = :status,
      notes = COALESCE(:notes, notes),
      approved_by = IF(:status IN ('approved', 'ready_for_payout'), :approved_by, approved_by),
      approved_at = IF(:status IN ('approved', 'ready_for_payout'), NOW(), approved_at)
     WHERE id = :id`,
    { id: resaleId, ...payload },
  );
}

export async function payResale(resaleId, payload, connection = db) {
  const [result] = await connection.execute(
    `UPDATE company_resales
     SET status = 'paid',
      cashier_id = ?,
      identity_document_type = ?,
      identity_document_number = ?,
      notes = ?,
      paid_at = NOW()
     WHERE id = ? AND status <> 'paid'`,
    [
      payload.cashier_id,
      payload.identity_document_type,
      payload.identity_document_number,
      payload.notes,
      resaleId,
    ],
  );
  return result;
}

export default { listResales, lockResale, updateResaleStatus, payResale };
