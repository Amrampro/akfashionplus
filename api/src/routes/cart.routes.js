import express from "express";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, getCart);
router.post("/items", requireAuth, addCartItem);
router.put("/items/:id", requireAuth, updateCartItem);
router.delete("/items/:id", requireAuth, removeCartItem);
router.delete("/", requireAuth, clearCart);

export default router;
