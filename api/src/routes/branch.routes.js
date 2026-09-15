import express from "express";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
} from "../controllers/branch.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", listBranches);
router.post("/", requireAuth, requireRole("admin"), createBranch);
router.put("/:id", requireAuth, requireRole("admin"), updateBranch);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBranch);

export default router;
