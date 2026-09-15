import { query } from "../config/database.js";
import crypto from "node:crypto";

const userColumns = [
  "role",
  "branch_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "password_hash",
  "preferred_language",
  "country_code",
  "avatar_url",
  "referral_code",
  "referred_by_user_id",
  "status",
];

export function generateReferralCode(userId) {
  const suffix = crypto
    .createHash("sha1")
    .update(`${userId}:${process.env.JWT_SECRET || "ak-fashion-plus"}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `AK${userId}${suffix}`;
}

export async function ensureReferralCode(user) {
  if (!user || user.referral_code) return user;
  const referral_code = generateReferralCode(user.id);
  await query(
    "UPDATE users SET referral_code = :referral_code WHERE id = :id AND referral_code IS NULL",
    { id: user.id, referral_code },
  );
  return { ...user, referral_code };
}

export async function findUserById(userId) {
  const rows = await query(
    `SELECT u.*,
      b.name AS branch_name,
      b.city AS branch_city
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     WHERE u.id = :id
     LIMIT 1`,
    { id: userId },
  );
  return rows[0] || null;
}

export async function listUsers(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit || 25), 1), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const where = [];
  const params = { limit, offset };

  if (filters.q) {
    where.push(
      "(u.email LIKE :q OR u.first_name LIKE :q OR u.last_name LIKE :q OR u.phone LIKE :q OR b.name LIKE :q OR b.city LIKE :q)",
    );
    params.q = `%${filters.q}%`;
  }

  if (filters.role && ["user", "cashier", "admin"].includes(filters.role)) {
    where.push("u.role = :role");
    params.role = filters.role;
  }

  if (
    filters.status &&
    ["active", "inactive", "blocked", "pending"].includes(filters.status)
  ) {
    where.push("u.status = :status");
    params.status = filters.status;
  }

  if (filters.branch_id) {
    where.push("u.branch_id = :branch_id");
    params.branch_id = Number(filters.branch_id);
  }

  const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(
    `SELECT
       u.id,
       u.role,
       u.branch_id,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.preferred_language,
       u.country_code,
       u.avatar_url,
       u.status,
       u.email_verified_at,
       u.last_login_at,
       u.created_at,
       u.updated_at,
       b.name AS branch_name,
       b.city AS branch_city,
       (
         SELECT COUNT(*)
         FROM orders o
         WHERE o.user_id = u.id
       ) AS order_count,
       (
         SELECT COUNT(*)
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = u.id
           AND oi.item_type = 'rental'
       ) AS rental_count,
       (
         SELECT COUNT(*)
         FROM gift_cards gc
         WHERE gc.owner_user_id = u.id
       ) AS gift_card_count,
       (
         SELECT COALESCE(SUM(o.total_eur), 0)
         FROM orders o
         WHERE o.user_id = u.id
           AND o.payment_status IN ('paid', 'partially_refunded')
       ) AS total_spent_eur,
       (
         SELECT MAX(o.created_at)
         FROM orders o
         WHERE o.user_id = u.id
       ) AS last_order_at
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     ${sqlWhere}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT :limit OFFSET :offset`,
    params,
  );
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     ${sqlWhere}`,
    params,
  );

  return { rows, meta: { page, limit, total } };
}

export async function createUser(payload) {
  const keys = userColumns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );

  return query(
    `INSERT INTO users (${keys.join(", ")})
     VALUES (${keys.map((field) => `:${field}`).join(", ")})`,
    Object.fromEntries(keys.map((field) => [field, payload[field]])),
  );
}

export async function updateUser(userId, payload) {
  const keys = userColumns
    .filter((field) => field !== "email" && field !== "password_hash")
    .filter((field) => Object.prototype.hasOwnProperty.call(payload, field));

  if (!keys.length) return null;

  return query(
    `UPDATE users
     SET ${keys.map((field) => `${field} = :${field}`).join(", ")}
     WHERE id = :id`,
    {
      id: userId,
      ...Object.fromEntries(keys.map((field) => [field, payload[field]])),
    },
  );
}

export default {
  findUserById,
  listUsers,
  createUser,
  updateUser,
  generateReferralCode,
  ensureReferralCode,
};
