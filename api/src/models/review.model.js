import { query } from "../config/database.js";

export async function listPublicReviews(productId) {
  return query(
    `SELECT pr.id,
      pr.product_id,
      pr.rating,
      pr.title,
      pr.comment,
      pr.verified_purchase,
      pr.admin_reply,
      pr.created_at,
      u.first_name
     FROM product_reviews pr
     INNER JOIN users u ON u.id = pr.user_id
     WHERE pr.status = 'published'
       AND (:product_id IS NULL OR pr.product_id = :product_id)
     ORDER BY pr.created_at DESC
     LIMIT 100`,
    { product_id: productId || null },
  );
}

export async function listAdminReviews(filters = {}) {
  const where = [];
  const params = {};

  if (filters.status) {
    where.push("pr.status = :status");
    params.status = filters.status;
  }

  if (filters.rating) {
    where.push("pr.rating = :rating");
    params.rating = Number(filters.rating);
  }

  if (filters.product_id) {
    where.push("pr.product_id = :product_id");
    params.product_id = Number(filters.product_id);
  }

  if (filters.q) {
    where.push(`(
      pr.title LIKE :q
      OR pr.comment LIKE :q
      OR p.name_fr LIKE :q
      OR p.sku LIKE :q
      OR u.email LIKE :q
      OR CONCAT(u.first_name, ' ', u.last_name) LIKE :q
    )`);
    params.q = `%${filters.q}%`;
  }

  const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return query(
    `SELECT
       pr.id,
       pr.product_id,
       pr.user_id,
       pr.order_item_id,
       pr.rating,
       pr.title,
       pr.comment,
       pr.verified_purchase,
       pr.status,
       pr.admin_reply,
       pr.created_at,
       pr.updated_at,
       p.sku AS product_sku,
       p.slug AS product_slug,
       p.name_fr AS product_name,
       (
         SELECT pi.image_url
         FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
         LIMIT 1
       ) AS image_url,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
       u.email AS customer_email,
       o.order_number
     FROM product_reviews pr
     INNER JOIN products p ON p.id = pr.product_id
     INNER JOIN users u ON u.id = pr.user_id
     LEFT JOIN order_items oi ON oi.id = pr.order_item_id
     LEFT JOIN orders o ON o.id = oi.order_id
     ${sqlWhere}
     ORDER BY pr.created_at DESC, pr.id DESC`,
    params,
  );
}

export async function createReview(payload) {
  return query(
    `INSERT INTO product_reviews (
      product_id,
      user_id,
      order_item_id,
      rating,
      title,
      comment,
      verified_purchase,
      status
    )
    VALUES (
      :product_id,
      :user_id,
      :order_item_id,
      :rating,
      :title,
      :comment,
      FALSE,
      'pending'
    )`,
    payload,
  );
}

export async function moderateReview(reviewId, status, adminReply) {
  return query(
    `UPDATE product_reviews
     SET status = :status, admin_reply = :admin_reply
     WHERE id = :id`,
    { id: reviewId, status, admin_reply: adminReply },
  );
}

export default {
  listPublicReviews,
  listAdminReviews,
  createReview,
  moderateReview,
};
