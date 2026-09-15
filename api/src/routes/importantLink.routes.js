import express from "express";
import {
  createImportantLink,
  deleteImportantLink,
  getPublicImportantLink,
  listAdminImportantLinks,
  listPublicImportantLinks,
  updateImportantLink,
} from "../controllers/importantLink.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", listPublicImportantLinks);
router.get("/admin", requireAuth, requireRole("admin"), listAdminImportantLinks);
router.get("/:slug", getPublicImportantLink);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  upload.single("important_link_pdf"),
  createImportantLink,
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  upload.single("important_link_pdf"),
  updateImportantLink,
);
router.delete("/:id", requireAuth, requireRole("admin"), deleteImportantLink);

export default router;
