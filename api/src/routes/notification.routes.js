import express from "express";
import {
  createAdminNotification,
  deleteAdminNotification,
  listAdminNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateAdminNotification,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listNotifications);
router.get("/admin", requireAuth, requireRole("admin"), listAdminNotifications);
router.post(
  "/admin",
  requireAuth,
  requireRole("admin"),
  createAdminNotification,
);
router.put(
  "/admin/:id",
  requireAuth,
  requireRole("admin"),
  updateAdminNotification,
);
router.delete(
  "/admin/:id",
  requireAuth,
  requireRole("admin"),
  deleteAdminNotification,
);
router.put("/read-all", requireAuth, markAllNotificationsRead);
router.put("/:id/read", requireAuth, markNotificationRead);

export default router;
