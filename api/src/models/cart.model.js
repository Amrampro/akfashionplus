import { db, query } from "../config/database.js";

export async function findActiveCart(userId) {
  const rows = await query(
    "SELECT * FROM carts WHERE user_id = :user_id AND status = 'active' LIMIT 1",
    { user_id: userId },
  );
  return rows[0] || null;
}

export async function findOrCreateActiveCart(userId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM carts WHERE user_id = ? AND status = 'active' LIMIT 1",
    [userId],
  );

  if (rows[0]) return rows[0];

  const [result] = await connection.execute(
    "INSERT INTO carts (user_id) VALUES (?)",
    [userId],
  );
  return { id: result.insertId, user_id: userId, status: "active" };
}

export async function listCartItems(cartId, lang = "fr") {
  return query(
    `SELECT ci.*,
      pv.sku,
      pv.size,
      pv.color_name,
      p.id AS product_id,
      p.slug,
      p.name_${lang} AS product_name,
      p.condition_type,
      COALESCE(pv.sale_price_eur, p.sale_price_eur) AS sale_price_eur,
      COALESCE(pv.rental_price_per_day_eur, p.rental_price_per_day_eur) AS rental_price_per_day_eur,
      COALESCE(pv.rental_deposit_eur, p.rental_deposit_eur) AS rental_deposit_eur
     FROM cart_items ci
     INNER JOIN product_variants pv ON pv.id = ci.product_variant_id
     INNER JOIN products p ON p.id = pv.product_id
     WHERE ci.cart_id = :cart_id`,
    { cart_id: cartId },
  );
}

export async function addCartItem(cartId, payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO cart_items (
      cart_id,
      product_variant_id,
      item_type,
      quantity,
      rental_start_date,
      rental_end_date,
      rental_days
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      quantity = quantity + VALUES(quantity),
      rental_start_date = VALUES(rental_start_date),
      rental_end_date = VALUES(rental_end_date),
      rental_days = VALUES(rental_days)`,
    [
      cartId,
      payload.product_variant_id,
      payload.item_type || "sale",
      payload.quantity,
      payload.rental_start_date || null,
      payload.rental_end_date || null,
      payload.rental_days || null,
    ],
  );
  return result;
}

export async function updateCartItemQuantity(cartItemId, userId, quantity) {
  return query(
    `UPDATE cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     SET ci.quantity = :quantity
     WHERE ci.id = :id AND c.user_id = :user_id`,
    { id: cartItemId, user_id: userId, quantity },
  );
}

export async function removeCartItem(cartItemId, userId) {
  return query(
    `DELETE ci
     FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = :id AND c.user_id = :user_id`,
    { id: cartItemId, user_id: userId },
  );
}

export async function clearCart(userId) {
  return query(
    `DELETE ci
     FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     WHERE c.user_id = :user_id AND c.status = 'active'`,
    { user_id: userId },
  );
}

export default {
  findActiveCart,
  findOrCreateActiveCart,
  listCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
