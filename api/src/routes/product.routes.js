import express from "express";
import {
  createImage,
  createProduct,
  createVariant,
  deleteImage,
  deleteProduct,
  archiveProduct,
  getAdminProduct,
  getProduct,
  listProducts,
  updateProduct,
  updateVariant,
  updateImage,
  uploadProductImage,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/admin/:id", requireAuth, requireRole("admin"), getAdminProduct);
router.get("/:slug", getProduct);
router.post("/", requireAuth, requireRole("admin"), createProduct);
router.put("/:id", requireAuth, requireRole("admin"), updateProduct);
router.put("/:id/archive", requireAuth, requireRole("admin"), archiveProduct);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);
router.post(
  "/:productId/variants",
  requireAuth,
  requireRole("admin"),
  createVariant,
);
router.put(
  "/variants/:variantId",
  requireAuth,
  requireRole("admin"),
  updateVariant,
);
router.post(
  "/:productId/images",
  requireAuth,
  requireRole("admin"),
  createImage,
);
router.post(
  "/:productId/images/upload",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  uploadProductImage,
);
router.put("/images/:imageId", requireAuth, requireRole("admin"), updateImage);
router.delete(
  "/images/:imageId",
  requireAuth,
  requireRole("admin"),
  deleteImage,
);

export default router;
