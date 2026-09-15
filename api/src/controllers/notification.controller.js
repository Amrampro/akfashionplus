import { ok } from "../utils/apiResponse.js";
import * as Notification from "../models/notification.model.js";
import * as User from "../models/user.model.js";

export async function listNotifications(req, res) {
  const rows = await Notification.listNotifications(req.user.id);
  return ok(res, rows);
}

export async function listAdminNotifications(req, res) {
  const rows = await Notification.listAdminNotifications({
    q: req.query.q,
    type: req.query.type,
    read: req.query.read,
    created_from: req.query.created_from,
    created_to: req.query.created_to,
  });
  return ok(res, rows);
}

export async function createAdminNotification(req, res) {
  const userList =
    req.body.user_id === "all"
      ? await User.listUsers({ limit: 100, status: "active" })
      : { rows: [{ id: Number(req.body.user_id) }] };
  const users = userList.rows || [];

  if (!users.length || !req.body.type || !req.body.title || !req.body.message) {
    return res.status(422).json({
      success: false,
      message: "Utilisateur, type, titre et message sont requis",
    });
  }

  const createdIds = [];
  for (const user of users) {
    const result = await Notification.createNotification({
      user_id: user.id,
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      data: req.body.data || null,
    });
    createdIds.push(result.insertId);
  }

  return ok(res, { ids: createdIds }, "Notification creee");
}

export async function updateAdminNotification(req, res) {
  await Notification.setReadStatus(req.params.id, Boolean(req.body.is_read));
  return ok(res, null, "Notification mise a jour");
}

export async function deleteAdminNotification(req, res) {
  await Notification.deleteNotification(req.params.id);
  return ok(res, null, "Notification supprimee");
}

export async function markNotificationRead(req, res) {
  await Notification.markRead(req.user.id, req.params.id);
  return ok(res, null, "Notification marked as read");
}

export async function markAllNotificationsRead(req, res) {
  await Notification.markAllRead(req.user.id);
  return ok(res, null, "Notifications marked as read");
}

export default {
  listNotifications,
  listAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  markNotificationRead,
  markAllNotificationsRead,
};
