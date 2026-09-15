import express from "express";
import addressRoutes from "./address.routes.js";
import auditRoutes from "./audit.routes.js";
import authRoutes from "./auth.routes.js";
import branchRoutes from "./branch.routes.js";
import cartRoutes from "./cart.routes.js";
import cashierRoutes from "./cashier.routes.js";
import categoryRoutes from "./category.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import favoriteRoutes from "./favorite.routes.js";
import giftCardRoutes from "./giftCard.routes.js";
import importantLinkRoutes from "./importantLink.routes.js";
import notificationRoutes from "./notification.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import productRoutes from "./product.routes.js";
import receiptRoutes from "./receipt.routes.js";
import rentalRoutes from "./rental.routes.js";
import resaleRoutes from "./resale.routes.js";
import reviewRoutes from "./review.routes.js";
import secondHandProposalRoutes from "./secondHandProposal.routes.js";
import settingRoutes from "./setting.routes.js";
import userRoutes from "./user.routes.js";
import { query } from "../config/database.js";
import { ok } from "../utils/apiResponse.js";
import { listGiftCardTypes } from "../controllers/giftCard.controller.js";

const router = express.Router();

router.get("/health", async (_req, res) => {
  await query("SELECT 1 AS ok");
  return ok(res, { database: "connected" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/addresses", addressRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/receipts", receiptRoutes);
router.use("/branches", branchRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.get("/gift-card-types", listGiftCardTypes);
router.use("/gift-cards", giftCardRoutes);
router.use("/important-links", importantLinkRoutes);
router.use("/rentals", rentalRoutes);
router.use("/resales", resaleRoutes);
router.use("/second-hand-proposals", secondHandProposalRoutes);
router.use("/cashier", cashierRoutes);
router.use("/reviews", reviewRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/audit", auditRoutes);

export default router;
