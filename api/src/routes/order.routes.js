import express from "express";
import {
  cancelPendingOrderPayment,
  checkout,
  directCheckout,
  getOrder,
  listOrders,
  updateOrderAdmin,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listOrders);
router.post("/checkout", requireAuth, checkout);
router.post("/direct-checkout", requireAuth, directCheckout);
router.get("/:id", requireAuth, getOrder);
router.post(
  "/:id/cancel-pending-payment",
  requireAuth,
  cancelPendingOrderPayment,
);
router.put("/:id/admin", requireAuth, requireRole("admin"), updateOrderAdmin);
router.put(
  "/:id/status",
  requireAuth,
  requireRole("admin", "cashier"),
  updateOrderStatus,
);

export default router;
