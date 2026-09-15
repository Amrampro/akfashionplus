import express from "express";
import {
  getAdminDashboard,
  getCashierDashboard,
} from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), getAdminDashboard);
router.get(
  "/cashier",
  requireAuth,
  requireRole("cashier", "admin"),
  getCashierDashboard,
);

export default router;
