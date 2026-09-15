import express from "express";
import {
  checkAvailability,
  listRentals,
  updateRentalStatus,
} from "../controllers/rental.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listRentals);
router.get("/availability", checkAvailability);
router.put(
  "/:orderItemId/status",
  requireAuth,
  requireRole("cashier", "admin"),
  updateRentalStatus,
);

export default router;
