import express from "express";
import {
  createStripeCheckoutSession,
  createStripeIntent,
  getStripeCheckoutSession,
  listPayments,
  payOrderWithGiftCard,
  syncStripeIntent,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listPayments);
router.post("/stripe-intent", requireAuth, createStripeIntent);
router.post(
  "/stripe-intent/:paymentIntentId/sync",
  requireAuth,
  syncStripeIntent,
);
router.post("/gift-card-order", requireAuth, payOrderWithGiftCard);
router.post(
  "/stripe-checkout-session",
  requireAuth,
  createStripeCheckoutSession,
);
router.get(
  "/stripe-checkout-session/:sessionId",
  requireAuth,
  getStripeCheckoutSession,
);

export default router;
