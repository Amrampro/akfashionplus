import express from "express";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/address.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listAddresses);
router.post("/", requireAuth, createAddress);
router.put("/:id", requireAuth, updateAddress);
router.put("/:id/default", requireAuth, setDefaultAddress);
router.delete("/:id", requireAuth, deleteAddress);

export default router;
