import express from "express";
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
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", requireAuth, logout);

export default router;
