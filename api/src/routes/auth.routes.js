import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);
const resetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
router.post("/forgot-password", resetLimit, forgotPassword);
router.post("/reset-password", resetLimit, resetPassword);
router.post("/logout", requireAuth, logout);

export default router;
