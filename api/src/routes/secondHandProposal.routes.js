import express from "express";
import {
  acceptProposal,
  confirmPayment,
  createProposal,
  evaluateProposal,
  getProposal,
  listAdminProposals,
  listMyProposals,
  markReceived,
  rejectProposal,
  setInstructions,
  updateStatus,
  uploadProposalImages,
  verifyProposal,
} from "../controllers/secondHandProposal.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/admin", requireRole("admin", "cashier"), listAdminProposals);
router.get("/admin/:id", requireRole("admin", "cashier"), getProposal);

router.get("/", listMyProposals);
router.post("/", createProposal);
router.get("/:id", getProposal);
router.post("/:id/images", upload.array("proposal_photos", 8), uploadProposalImages);
router.post("/:id/accept", acceptProposal);
router.post("/:id/reject", rejectProposal);

router.patch("/:id/evaluate", requireRole("admin", "cashier"), evaluateProposal);
router.put("/:id/evaluate", requireRole("admin", "cashier"), evaluateProposal);
router.patch("/:id/status", requireRole("admin", "cashier"), updateStatus);
router.put("/:id/status", requireRole("admin", "cashier"), updateStatus);
router.patch("/:id/instructions", requireRole("admin", "cashier"), setInstructions);
router.put("/:id/instructions", requireRole("admin", "cashier"), setInstructions);
router.patch("/:id/received", requireRole("admin", "cashier"), markReceived);
router.put("/:id/received", requireRole("admin", "cashier"), markReceived);
router.patch("/:id/verify", requireRole("admin", "cashier"), verifyProposal);
router.put("/:id/verify", requireRole("admin", "cashier"), verifyProposal);
router.patch("/:id/payment", requireRole("admin", "cashier"), confirmPayment);
router.put("/:id/payment", requireRole("admin", "cashier"), confirmPayment);

export default router;
