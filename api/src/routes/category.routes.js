import express from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  uploadCategoryImage,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", listCategories);
router.post("/", requireAuth, requireRole("admin"), createCategory);
router.post(
  "/:id/image",
  requireAuth,
  requireRole("admin"),
  upload.single("category"),
  uploadCategoryImage,
);
router.put("/:id", requireAuth, requireRole("admin"), updateCategory);
router.delete("/:id", requireAuth, requireRole("admin"), deleteCategory);

export default router;
