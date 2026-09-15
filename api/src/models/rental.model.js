import { db, query } from "../config/database.js";

export async function listRentals(user, filters = {}) {
  const isStaff = user.role === "admin" || user.role === "cashier";
  let branchId = filters.branch_id || null;
  let unassignedOnly = 0;

  if (user.role === "cashier") {
    if (filters.cashier_scope === "own") {
      branchId = user.branch_id || -1;
    } else if (filters.cashier_scope === "unassigned") {
      branchId = null;
      unassignedOnly = 1;
    } else {
      branchId = null;
    }
  }

  return query(
    `SELECT
      oi.id AS order_item_id,
      oi.order_id,
      o.order_number,
      o.user_id,
      oi.product_id,
      oi.product_variant_id,
      oi.product_name,
      oi.sku,
      oi.size,
      oi.color,
      oi.quantity,
      oi.rental_start_date,
      oi.rental_end_date,
      oi.rental_days,
      oi.rental_status,
      oi.rental_price_per_day_eur,
      oi.rental_deposit_eur,
      oi.rental_late_fee_eur,
      oi.rental_damage_fee_eur,
      oi.line_total_eur,
      oi.rental_picked_up_at,
      oi.rental_returned_at,
      oi.rental_return_notes,
      o.status AS order_status,
      o.payment_status,
      o.fulfillment_type,
      o.beneficiary_name,
      o.beneficiary_phone,
      o.branch_id,
      o.created_at AS ordered_at,
      CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      b.name AS branch_name,
      b.city AS branch_city,
      rental_pickup.completed_at AS pickup_completed_at,
      rental_pickup.notes AS pickup_notes,
      rental_pickup_branch.name AS pickup_branch_name,
      CONCAT(rental_pickup_cashier.first_name, ' ', rental_pickup_cashier.last_name) AS pickup_cashier_name,
      rental_return.completed_at AS return_completed_at,
      rental_return.notes AS return_pickup_notes,
      rental_return_branch.name AS return_branch_name,
      CONCAT(rental_return_cashier.first_name, ' ', rental_return_cashier.last_name) AS return_cashier_name,
      COALESCE(img.image_url, '') AS image_url
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN users u ON u.id = o.user_id
     INNER JOIN products p ON p.id = oi.product_id
     LEFT JOIN branches b ON b.id = o.branch_id
     LEFT JOIN order_pickups rental_pickup ON rental_pickup.id = (
       SELECT op.id
       FROM order_pickups op
       WHERE op.order_id = o.id AND op.pickup_type = 'rental'
       ORDER BY op.completed_at DESC, op.id DESC
       LIMIT 1
     )
     LEFT JOIN branches rental_pickup_branch ON rental_pickup_branch.id = rental_pickup.branch_id
     LEFT JOIN users rental_pickup_cashier ON rental_pickup_cashier.id = rental_pickup.cashier_id
     LEFT JOIN order_pickups rental_return ON rental_return.id = (
       SELECT op.id
       FROM order_pickups op
       WHERE op.order_id = o.id AND op.pickup_type = 'rental_return'
       ORDER BY op.completed_at DESC, op.id DESC
       LIMIT 1
     )
     LEFT JOIN branches rental_return_branch ON rental_return_branch.id = rental_return.branch_id
     LEFT JOIN users rental_return_cashier ON rental_return_cashier.id = rental_return.cashier_id
     LEFT JOIN product_images img ON img.id = (
       SELECT pi.id
       FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
       LIMIT 1
     )
     WHERE oi.item_type = 'rental'
       AND (:is_staff = 1 OR o.user_id = :user_id)
       AND (:branch_id IS NULL OR o.branch_id = :branch_id)
       AND (:unassigned_only = 0 OR o.branch_id IS NULL)
       AND (
         :q IS NULL
         OR o.order_number LIKE :like
         OR oi.product_name LIKE :like
         OR u.email LIKE :like
         OR u.first_name LIKE :like
         OR u.last_name LIKE :like
         OR o.beneficiary_name LIKE :like
       )
       AND (:status IS NULL OR oi.rental_status = :status)
     ORDER BY oi.rental_start_date ASC, oi.rental_end_date ASC, oi.id DESC`,
    {
      is_staff: isStaff ? 1 : 0,
      user_id: user.id,
      branch_id: branchId,
      unassigned_only: unassignedOnly,
      q: filters.q || null,
      like: `%${filters.q || ""}%`,
      status: filters.status || null,
    },
  );
}

export async function lockRentalOrderItem(orderItemId, connection) {
  const [rows] = await connection.execute(
    `SELECT
      oi.id,
      oi.order_id,
      oi.item_type,
      oi.rental_status,
      o.branch_id
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE oi.id = ? AND oi.item_type = 'rental'
     LIMIT 1
     FOR UPDATE`,
    [orderItemId],
  );
  return rows[0] || null;
}

export async function assignOrderBranch(orderId, branchId, connection) {
  const [result] = await connection.execute(
    "UPDATE orders SET branch_id = ? WHERE id = ? AND branch_id IS NULL",
    [branchId, orderId],
  );
  return result;
}

export async function isAvailable({
  product_variant_id,
  rental_start_date,
  rental_end_date,
  quantity,
}) {
  const rows = await query(
    `SELECT pv.stock_quantity,
      COALESCE(SUM(ar.quantity), 0) AS reserved
     FROM product_variants pv
     LEFT JOIN v_active_rentals ar
       ON ar.product_variant_id = pv.id
      AND NOT (ar.rental_end_date < :rental_start_date OR ar.rental_start_date > :rental_end_date)
     WHERE pv.id = :product_variant_id
     GROUP BY pv.id`,
    { product_variant_id, rental_start_date, rental_end_date },
  );
  const row = rows[0];
  return Boolean(
    row && Number(row.stock_quantity) - Number(row.reserved || 0) >= quantity,
  );
}

export async function updateRentalStatus(
  orderItemId,
  payload,
  connection = db,
) {
  const [result] = await connection.execute(
    `UPDATE order_items
     SET rental_status = :status,
      rental_picked_up_at = IF(:status = 'active', NOW(), rental_picked_up_at),
      rental_returned_at = IF(:status IN ('returned', 'damaged', 'lost'), NOW(), rental_returned_at),
      rental_late_fee_eur = COALESCE(:late_fee, rental_late_fee_eur),
      rental_damage_fee_eur = COALESCE(:damage_fee, rental_damage_fee_eur),
      rental_return_notes = COALESCE(:notes, rental_return_notes)
     WHERE id = :id AND item_type = 'rental'`,
    { id: orderItemId, ...payload },
  );
  return result;
}

export default { listRentals, isAvailable, updateRentalStatus };
