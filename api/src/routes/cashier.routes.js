import express from "express";
import {
  completePickup,
  getCashierDashboard,
  listBranchHistory,
  listPendingPickups,
} from "../controllers/cashier.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("cashier", "admin"),
  getCashierDashboard,
);
router.get(
  "/pickups",
  requireAuth,
  requireRole("cashier", "admin"),
  listPendingPickups,
);
router.post(
  "/pickups/:orderId/complete",
  requireAuth,
  requireRole("cashier", "admin"),
  completePickup,
);
router.get(
  "/history",
  requireAuth,
  requireRole("cashier", "admin"),
  listBranchHistory,
);

export default router;
