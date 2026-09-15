import { db, query } from "../config/database.js";

export async function lockCheckoutItems(cartId, connection = db) {
  const [rows] = await connection.execute(
    `SELECT ci.*,
      pv.product_id,
      pv.sku,
      pv.size,
      pv.color_name,
      pv.stock_quantity,
      pv.reserved_quantity,
      p.name_fr,
      p.name_en,
      p.name_pt,
      p.condition_type,
      COALESCE(pv.sale_price_eur, p.sale_price_eur) AS sale_price_eur,
      COALESCE(pv.rental_price_per_day_eur, p.rental_price_per_day_eur) AS rental_price_per_day_eur,
      COALESCE(pv.rental_deposit_eur, p.rental_deposit_eur) AS rental_deposit_eur
     FROM cart_items ci
     INNER JOIN product_variants pv ON pv.id = ci.product_variant_id
     INNER JOIN products p ON p.id = pv.product_id
     WHERE ci.cart_id = ?
     FOR UPDATE`,
    [cartId],
  );
  return rows;
}

export async function countRentalConflicts(
  productVariantId,
  rentalStartDate,
  rentalEndDate,
  connection = db,
) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(quantity), 0) AS reserved
     FROM v_active_rentals
     WHERE product_variant_id = ?
       AND NOT (rental_end_date < ? OR rental_start_date > ?)`,
    [productVariantId, rentalStartDate, rentalEndDate],
  );
  return Number(rows[0]?.reserved || 0);
}

export async function createOrder(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO orders (
      order_number,
      user_id,
      fulfillment_type,
      branch_id,
      beneficiary_name,
      beneficiary_phone,
      pickup_code_hash,
      shipping_name,
      shipping_phone,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country_code,
      subtotal_eur,
      shipping_total_eur,
      total_eur,
      exchange_rate_eur_to_aoa,
      total_aoa,
      resell_to_company,
      payment_status,
      status,
      customer_notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
    [
      payload.order_number,
      payload.user_id,
      payload.fulfillment_type,
      payload.branch_id,
      payload.beneficiary_name,
      payload.beneficiary_phone,
      payload.pickup_code_hash,
      payload.shipping_name,
      payload.shipping_phone,
      payload.shipping_address_line_1,
      payload.shipping_address_line_2,
      payload.shipping_city,
      payload.shipping_province,
      payload.shipping_postal_code,
      payload.shipping_country_code,
      payload.subtotal_eur,
      payload.shipping_total_eur,
      payload.total_eur,
      payload.exchange_rate_eur_to_aoa,
      payload.total_aoa,
      payload.resell_to_company ? 1 : 0,
      payload.customer_notes,
    ],
  );
  return result;
}

export async function createOrderItem(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO order_items (
      order_id,
      product_id,
      product_variant_id,
      item_type,
      product_name,
      sku,
      size,
      color,
      condition_type,
      quantity,
      unit_price_eur,
      line_total_eur,
      resell_to_company,
      rental_start_date,
      rental_end_date,
      rental_days,
      rental_price_per_day_eur,
      rental_deposit_eur,
      rental_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.order_id,
      payload.product_id,
      payload.product_variant_id,
      payload.item_type,
      payload.product_name,
      payload.sku,
      payload.size,
      payload.color,
      payload.condition_type,
      payload.quantity,
      payload.unit_price_eur,
      payload.line_total_eur,
      payload.resell_to_company,
      payload.rental_start_date,
      payload.rental_end_date,
      payload.rental_days,
      payload.rental_price_per_day_eur,
      payload.rental_deposit_eur,
      payload.rental_status,
    ],
  );
  return result;
}

export async function createCompanyResale(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO company_resales (
      order_item_id,
      user_id,
      branch_id,
      amount_eur,
      exchange_rate_eur_to_aoa,
      payout_amount_aoa,
      beneficiary_name,
      beneficiary_phone,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      payload.order_item_id,
      payload.user_id,
      payload.branch_id,
      payload.amount_eur,
      payload.exchange_rate_eur_to_aoa,
      payload.payout_amount_aoa,
      payload.beneficiary_name,
      payload.beneficiary_phone,
    ],
  );
  return result;
}

export async function reserveVariantStock(
  productVariantId,
  quantity,
  connection = db,
) {
  const [result] = await connection.execute(
    `UPDATE product_variants
     SET reserved_quantity = reserved_quantity + ?
     WHERE id = ?`,
    [quantity, productVariantId],
  );
  return result;
}

export async function convertCart(cartId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE carts SET status = 'converted' WHERE id = ?",
    [cartId],
  );
  return result;
}

export async function listOrders({ user, query: filters = {} }) {
  const limit = Math.min(Math.max(Number(filters.limit || 25), 1), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const where = [];
  const params = { limit, offset };

  if (user.role !== "admin" && user.role !== "cashier") {
    where.push("o.user_id = :user_id");
    params.user_id = user.id;
  }

  if (user.role === "cashier") {
    if (filters.cashier_scope === "own") {
      where.push("o.branch_id = :cashier_branch_id");
      params.cashier_branch_id = user.branch_id || 0;
    }

    if (filters.cashier_scope === "unassigned") {
      where.push("o.branch_id IS NULL");
    }
  }

  if (filters.q) {
    where.push(
      "(o.order_number LIKE :q OR o.beneficiary_name LIKE :q OR o.beneficiary_phone LIKE :q OR u.email LIKE :q OR u.first_name LIKE :q OR u.last_name LIKE :q)",
    );
    params.q = `%${filters.q}%`;
  }

  if (filters.status) {
    where.push("o.status = :status");
    params.status = filters.status;
  }

  if (filters.payment_status) {
    where.push("o.payment_status = :payment_status");
    params.payment_status = filters.payment_status;
  }

  if (filters.fulfillment_type) {
    where.push("o.fulfillment_type = :fulfillment_type");
    params.fulfillment_type = filters.fulfillment_type;
  }

  if (filters.branch_id) {
    where.push("o.branch_id = :filter_branch_id");
    params.filter_branch_id = Number(filters.branch_id);
  }

  if (filters.created_from) {
    where.push("o.created_at >= :created_from");
    params.created_from = filters.created_from;
  }

  if (filters.created_to) {
    where.push("o.created_at < DATE_ADD(:created_to, INTERVAL 1 DAY)");
    params.created_to = filters.created_to;
  }

  const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(
    `SELECT
       o.*,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone,
       b.name AS branch_name,
       COUNT(oi.id) AS items_count,
       COALESCE(SUM(CASE WHEN oi.item_type = 'rental' THEN 1 ELSE 0 END), 0) AS rental_items_count,
       COALESCE(SUM(CASE WHEN oi.item_type = 'purchase' THEN 1 ELSE 0 END), 0) AS purchase_items_count,
       COALESCE(SUM(CASE WHEN oi.resell_to_company = TRUE THEN 1 ELSE 0 END), 0) AS resale_items_count,
       COALESCE(SUM(cr.payout_amount_aoa), 0) AS resale_payout_amount_aoa,
       COALESCE(SUM(cr.payout_amount_aoa), 0) AS resale_value_aoa,
       CASE
         WHEN o.resell_to_company = TRUE
           OR COALESCE(SUM(CASE WHEN oi.resell_to_company = TRUE OR cr.id IS NOT NULL THEN 1 ELSE 0 END), 0) > 0
         THEN TRUE
         ELSE FALSE
       END AS resale_requested,
       GROUP_CONCAT(DISTINCT cr.status ORDER BY cr.status SEPARATOR ', ') AS resale_statuses
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN branches b ON b.id = o.branch_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN company_resales cr ON cr.order_item_id = oi.id
     ${sqlWhere}
     GROUP BY o.id, u.first_name, u.last_name, u.email, u.phone, b.name
     ORDER BY o.created_at DESC
     LIMIT :limit OFFSET :offset`,
    params,
  );
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN branches b ON b.id = o.branch_id
     ${sqlWhere}`,
    params,
  );
  return { rows, meta: { page, limit, total } };
}

export async function findOrderById(orderId, user) {
  const rows = await query(
    `SELECT
       o.*,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone,
       b.name AS branch_name,
       b.city AS branch_city,
       COALESCE((
         SELECT COUNT(*)
         FROM order_items oi
         LEFT JOIN company_resales cr ON cr.order_item_id = oi.id
         WHERE oi.order_id = o.id
           AND (oi.resell_to_company = TRUE OR cr.id IS NOT NULL)
       ), 0) AS resale_items_count,
       COALESCE((
         SELECT SUM(cr.payout_amount_aoa)
         FROM order_items oi
         INNER JOIN company_resales cr ON cr.order_item_id = oi.id
         WHERE oi.order_id = o.id
       ), 0) AS resale_payout_amount_aoa,
       COALESCE((
         SELECT SUM(cr.payout_amount_aoa)
         FROM order_items oi
         INNER JOIN company_resales cr ON cr.order_item_id = oi.id
         WHERE oi.order_id = o.id
       ), 0) AS resale_value_aoa,
       CASE
         WHEN o.resell_to_company = TRUE
           OR EXISTS (
             SELECT 1
             FROM order_items oi
             LEFT JOIN company_resales cr ON cr.order_item_id = oi.id
             WHERE oi.order_id = o.id
               AND (oi.resell_to_company = TRUE OR cr.id IS NOT NULL)
           )
         THEN TRUE
         ELSE FALSE
       END AS resale_requested
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN branches b ON b.id = o.branch_id
     WHERE o.id = :id AND (:admin = 1 OR o.user_id = :user_id)
     LIMIT 1`,
    {
      id: orderId,
      admin: user.role === "admin" || user.role === "cashier" ? 1 : 0,
      user_id: user.id,
    },
  );
  return rows[0] || null;
}

export async function listOrderItems(orderId) {
  return query(
    `SELECT
      oi.*,
      cr.id AS resale_id,
      cr.amount_eur AS resale_amount_eur,
      cr.exchange_rate_eur_to_aoa AS resale_exchange_rate_eur_to_aoa,
      cr.payout_amount_aoa AS resale_payout_amount_aoa,
      cr.beneficiary_name AS resale_beneficiary_name,
      cr.beneficiary_phone AS resale_beneficiary_phone,
      cr.status AS resale_status,
      cr.requested_at AS resale_requested_at,
      cr.approved_at AS resale_approved_at,
      cr.paid_at AS resale_paid_at,
      cr.identity_document_type AS resale_identity_document_type,
      cr.identity_document_number AS resale_identity_document_number,
      cr.notes AS resale_notes,
      b.name AS resale_branch_name,
      b.city AS resale_branch_city,
      CONCAT(cashier.first_name, ' ', cashier.last_name) AS resale_cashier_name,
      COALESCE(img.image_url, '') AS image_url,
      COALESCE(img.alt_text, oi.product_name) AS image_alt_text
     FROM order_items oi
     LEFT JOIN company_resales cr ON cr.order_item_id = oi.id
     LEFT JOIN branches b ON b.id = cr.branch_id
     LEFT JOIN users cashier ON cashier.id = cr.cashier_id
     LEFT JOIN product_images img ON img.id = (
       SELECT pi.id
       FROM product_images pi
       WHERE pi.product_id = oi.product_id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
       LIMIT 1
     )
     WHERE oi.order_id = :order_id
     ORDER BY oi.id ASC`,
    { order_id: orderId },
  );
}

export async function listOrderPayments(orderId) {
  return query("SELECT * FROM payments WHERE order_id = :order_id", {
    order_id: orderId,
  });
}

export async function listOrderHistory(orderId) {
  return query(
    `SELECT *
     FROM order_status_history
     WHERE order_id = :order_id
     ORDER BY created_at DESC`,
    { order_id: orderId },
  );
}

export async function lockOrder(orderId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM orders WHERE id = ? FOR UPDATE",
    [orderId],
  );
  return rows[0] || null;
}

export async function updateStatus(
  orderId,
  oldStatus,
  newStatus,
  notes,
  changedBy,
  connection = db,
) {
  await connection.execute(
    `UPDATE orders
     SET status = ?,
       completed_at = IF(? = 'completed', NOW(), completed_at),
       cancelled_at = IF(? = 'cancelled', NOW(), cancelled_at)
     WHERE id = ?`,
    [newStatus, newStatus, newStatus, orderId],
  );

  const [result] = await connection.execute(
    `INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      notes,
      changed_by
    )
    VALUES (?, ?, ?, ?, ?)`,
    [orderId, oldStatus, newStatus, notes, changedBy],
  );
  return result;
}

export async function assignBranch(orderId, branchId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE orders SET branch_id = ? WHERE id = ? AND branch_id IS NULL",
    [branchId, orderId],
  );
  return result;
}

export async function insertStatusHistory(
  orderId,
  oldStatus,
  newStatus,
  notes,
  changedBy,
  connection = db,
) {
  const [result] = await connection.execute(
    `INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      notes,
      changed_by
    )
    VALUES (?, ?, ?, ?, ?)`,
    [orderId, oldStatus, newStatus, notes, changedBy],
  );
  return result;
}

export async function updateOrderAdmin(orderId, payload, connection = db) {
  const fields = [
    "fulfillment_type",
    "branch_id",
    "beneficiary_name",
    "beneficiary_phone",
    "shipping_name",
    "shipping_phone",
    "shipping_address_line_1",
    "shipping_address_line_2",
    "shipping_city",
    "shipping_province",
    "shipping_postal_code",
    "shipping_country_code",
    "shipping_carrier",
    "shipping_tracking_number",
    "payment_status",
    "status",
    "customer_notes",
    "admin_notes",
  ];

  const entries = fields.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );

  if (!entries.length) return null;

  const assignments = entries.map((field) => `${field} = ?`);
  if (payload.status === "completed") {
    assignments.push("completed_at = COALESCE(completed_at, NOW())");
  }
  if (payload.status === "cancelled") {
    assignments.push("cancelled_at = COALESCE(cancelled_at, NOW())");
  }
  if (payload.status === "shipped") {
    assignments.push("shipped_at = COALESCE(shipped_at, NOW())");
  }
  if (payload.payment_status === "paid") {
    assignments.push("paid_at = COALESCE(paid_at, NOW())");
    assignments.push("paid_total_eur = total_eur");
  }

  const [result] = await connection.execute(
    `UPDATE orders
     SET ${assignments.join(", ")}
     WHERE id = ?`,
    [...entries.map((field) => payload[field]), orderId],
  );
  return result;
}

export default {
  lockCheckoutItems,
  countRentalConflicts,
  createOrder,
  createOrderItem,
  createCompanyResale,
  reserveVariantStock,
  convertCart,
  listOrders,
  findOrderById,
  listOrderItems,
  listOrderPayments,
  listOrderHistory,
  lockOrder,
  insertStatusHistory,
  assignBranch,
  updateOrderAdmin,
  updateStatus,
};
