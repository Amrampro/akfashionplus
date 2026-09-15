import express from "express";
import {
  adjustGiftCard,
  checkGiftCardBalance,
  createAdminGiftCard,
  createGiftCardMobilePaymentIntent,
  createGiftCardStripeCheckoutSession,
  createGiftCardType,
  listGiftCards,
  listGiftCardTransactions,
  listGiftCardTypes,
  updateGiftCardStatus,
} from "../controllers/giftCard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/types", listGiftCardTypes);
router.get("/balance/:serial", checkGiftCardBalance);
router.post("/types", requireAuth, requireRole("admin"), createGiftCardType);
router.get("/", requireAuth, listGiftCards);
router.post(
  "/purchase/stripe-checkout-session",
  requireAuth,
  createGiftCardStripeCheckoutSession,
);
router.post(
  "/purchase/mobile-payment-intent",
  requireAuth,
  createGiftCardMobilePaymentIntent,
);
router.post("/admin", requireAuth, requireRole("admin"), createAdminGiftCard);
router.put(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  updateGiftCardStatus,
);
router.post("/:id/adjust", requireAuth, requireRole("admin"), adjustGiftCard);
router.get("/:id/transactions", requireAuth, listGiftCardTransactions);

export default router;
