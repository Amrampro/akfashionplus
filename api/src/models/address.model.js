import { db, query } from "../config/database.js";

const columns = [
  "label",
  "recipient_name",
  "recipient_phone",
  "address_line_1",
  "address_line_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "is_default",
];

export async function listAddresses(userId) {
  return query(
    `SELECT *
     FROM user_addresses
     WHERE user_id = :user_id
     ORDER BY is_default DESC, created_at DESC`,
    { user_id: userId },
  );
}

export async function clearDefault(userId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?",
    [userId],
  );
  return result;
}

export async function createAddress(userId, payload, connection = db) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  const [result] = await connection.execute(
    `INSERT INTO user_addresses (user_id, ${keys.join(", ")})
     VALUES (?, ${keys.map(() => "?").join(", ")})`,
    [userId, ...keys.map((field) => payload[field])],
  );
  return result;
}

export async function updateAddress(
  addressId,
  userId,
  payload,
  connection = db,
) {
  const keys = columns.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  if (!keys.length) return null;

  const [result] = await connection.execute(
    `UPDATE user_addresses
     SET ${keys.map((field) => `${field} = ?`).join(", ")}
     WHERE id = ? AND user_id = ?`,
    [...keys.map((field) => payload[field]), addressId, userId],
  );
  return result;
}

export async function deleteAddress(addressId, userId) {
  return query(
    "DELETE FROM user_addresses WHERE id = :id AND user_id = :user_id",
    { id: addressId, user_id: userId },
  );
}

export default {
  listAddresses,
  clearDefault,
  createAddress,
  updateAddress,
  deleteAddress,
};
