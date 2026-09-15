import express from "express";
import {
  createReview,
  listAdminReviews,
  listPublicReviews,
  moderateReview,
} from "../controllers/review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), listAdminReviews);
router.get("/", listPublicReviews);
router.post("/", requireAuth, createReview);
router.put("/:id/moderate", requireAuth, requireRole("admin"), moderateReview);

export default router;
