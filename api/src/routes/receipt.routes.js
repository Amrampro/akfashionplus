import express from "express";
import { downloadReceipt } from "../controllers/receipt.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:type/:id.pdf", requireAuth, downloadReceipt);

export default router;
