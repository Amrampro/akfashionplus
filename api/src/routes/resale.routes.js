import express from "express";
import {
  listResales,
  payResale,
  updateResaleStatus,
} from "../controllers/resale.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listResales);
router.put(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  updateResaleStatus,
);
router.post(
  "/:id/pay",
  requireAuth,
  requireRole("cashier", "admin"),
  payResale,
);

export default router;
