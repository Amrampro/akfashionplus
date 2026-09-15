import express from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), listAuditLogs);

export default router;
