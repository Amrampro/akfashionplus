import { created, ok } from "../utils/apiResponse.js";
import * as Favorite from "../models/favorite.model.js";

export async function listFavorites(req, res) {
  const rows = await Favorite.listFavorites(req.user.id, req.lang);
  return ok(res, rows);
}

export async function addFavorite(req, res) {
  await Favorite.addFavorite(req.user.id, req.params.productId);
  return created(res, null, "Favorite saved");
}

export async function removeFavorite(req, res) {
  await Favorite.removeFavorite(req.user.id, req.params.productId);
  return ok(res, null, "Favorite removed");
}

export default { listFavorites, addFavorite, removeFavorite };
