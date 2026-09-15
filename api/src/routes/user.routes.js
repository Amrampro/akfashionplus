import express from "express";
import {
  createUser,
  getProfile,
  listUsers,
  setUserStatus,
  uploadProfileAvatar,
  updateProfile,
  updateUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/me", requireAuth, getProfile);
router.put("/me", requireAuth, updateProfile);
router.post(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  uploadProfileAvatar,
);
router.get("/", requireAuth, requireRole("admin"), listUsers);
router.post("/", requireAuth, requireRole("admin"), createUser);
router.put("/:id", requireAuth, requireRole("admin"), updateUser);
router.put("/:id/status", requireAuth, requireRole("admin"), setUserStatus);

export default router;
