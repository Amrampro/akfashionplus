import express from "express";
import {
  createDeliveryCountry,
  deleteDeliveryCountry,
  listDeliveryCountries,
  listSettings,
  updateExchangeRate,
  updateDeliveryCountry,
  updateSetting,
} from "../controllers/setting.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", listSettings);
router.get("/delivery-countries", listDeliveryCountries);
router.post(
  "/delivery-countries",
  requireAuth,
  requireRole("admin"),
  createDeliveryCountry,
);
router.put(
  "/delivery-countries/:id",
  requireAuth,
  requireRole("admin"),
  updateDeliveryCountry,
);
router.delete(
  "/delivery-countries/:id",
  requireAuth,
  requireRole("admin"),
  deleteDeliveryCountry,
);
router.put("/", requireAuth, requireRole("admin"), updateSetting);
router.post(
  "/exchange-rate",
  requireAuth,
  requireRole("admin"),
  updateExchangeRate,
);

export default router;
