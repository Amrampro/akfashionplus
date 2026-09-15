import { query } from "../config/database.js";

export async function listFavorites(userId, lang = "fr") {
  return query(
    `SELECT f.id,
      f.created_at,
      p.id AS product_id,
      p.slug,
      p.name_${lang} AS name,
      c.name_${lang} AS category_name,
      p.sale_enabled,
      p.sale_price_eur,
      p.rental_enabled,
      p.rental_price_per_day_eur,
      p.rental_deposit_eur,
      p.featured,
      p.status,
      p.condition_type,
      COALESCE(img.image_url, '') AS image_url,
      COALESCE(AVG(pr.rating), 0) AS average_rating,
      COUNT(pr.id) AS total_reviews
     FROM favorites f
     INNER JOIN products p ON p.id = f.product_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_images img ON img.product_id = p.id AND img.is_primary = TRUE
     LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.status = 'published'
     WHERE f.user_id = :user_id
     GROUP BY
      f.id,
      f.created_at,
      p.id,
      p.slug,
      p.name_${lang},
      c.name_${lang},
      p.sale_enabled,
      p.sale_price_eur,
      p.rental_enabled,
      p.rental_price_per_day_eur,
      p.rental_deposit_eur,
      p.featured,
      p.status,
      p.condition_type,
      img.image_url
     ORDER BY f.created_at DESC`,
    { user_id: userId },
  );
}

export async function addFavorite(userId, productId) {
  return query(
    "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (:user_id, :product_id)",
    { user_id: userId, product_id: productId },
  );
}

export async function removeFavorite(userId, productId) {
  return query(
    "DELETE FROM favorites WHERE user_id = :user_id AND product_id = :product_id",
    { user_id: userId, product_id: productId },
  );
}

export default { listFavorites, addFavorite, removeFavorite };
