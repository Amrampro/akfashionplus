import { query } from "../config/database.js";

export async function listNotifications(userId) {
  return query(
    `SELECT *
     FROM notifications
     WHERE user_id = :user_id
     ORDER BY created_at DESC
     LIMIT 100`,
    { user_id: userId },
  );
}

export async function listAdminNotifications(filters = {}) {
  const where = [];
  const params = {};

  if (filters.q) {
    where.push(
      "(n.title LIKE :like OR n.message LIKE :like OR n.type LIKE :like OR u.email LIKE :like OR CONCAT(u.first_name, ' ', u.last_name) LIKE :like)",
    );
    params.like = `%${filters.q}%`;
  }

  if (filters.type) {
    where.push("n.type = :type");
    params.type = filters.type;
  }

  if (filters.read === "read") {
    where.push("n.is_read = TRUE");
  }

  if (filters.read === "unread") {
    where.push("n.is_read = FALSE");
  }

  if (filters.created_from) {
    where.push("DATE(n.created_at) >= :created_from");
    params.created_from = filters.created_from;
  }

  if (filters.created_to) {
    where.push("DATE(n.created_at) <= :created_to");
    params.created_to = filters.created_to;
  }

  return query(
    `SELECT
       n.*,
       u.first_name,
       u.last_name,
       u.email,
       u.role,
       u.status AS user_status
     FROM notifications n
     INNER JOIN users u ON u.id = n.user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 500`,
    params,
  );
}

export async function createNotification(payload) {
  return query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES (:user_id, :type, :title, :message, :data)`,
    {
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data ? JSON.stringify(payload.data) : null,
    },
  );
}

export async function setReadStatus(notificationId, isRead) {
  return query(
    `UPDATE notifications
     SET is_read = :is_read,
         read_at = CASE WHEN :is_read = TRUE THEN COALESCE(read_at, NOW()) ELSE NULL END
     WHERE id = :id`,
    { id: notificationId, is_read: isRead ? 1 : 0 },
  );
}

export async function deleteNotification(notificationId) {
  return query("DELETE FROM notifications WHERE id = :id", {
    id: notificationId,
  });
}

export async function markRead(userId, notificationId) {
  return query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = :id AND user_id = :user_id`,
    { id: notificationId, user_id: userId },
  );
}

export async function markAllRead(userId) {
  return query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE user_id = :user_id AND is_read = FALSE`,
    { user_id: userId },
  );
}

export default {
  listNotifications,
  listAdminNotifications,
  createNotification,
  setReadStatus,
  deleteNotification,
  markRead,
  markAllRead,
};
