import express from "express";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "../controllers/favorite.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listFavorites);
router.post("/:productId", requireAuth, addFavorite);
router.delete("/:productId", requireAuth, removeFavorite);

export default router;
