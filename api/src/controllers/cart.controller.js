import { transaction } from "../config/database.js";
import * as Cart from "../models/cart.model.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { money } from "../utils/currency.js";

function lineTotal(item) {
  if (item.item_type === "rental") {
    return (
      Number(item.quantity) *
        Number(item.rental_days || 1) *
        Number(item.rental_price_per_day_eur || 0) +
      Number(item.rental_deposit_eur || 0)
    );
  }

  return Number(item.quantity) * Number(item.sale_price_eur || 0);
}

export async function getCart(req, res) {
  const cart = await Cart.findActiveCart(req.user.id);
  if (!cart) return ok(res, { items: [], subtotal_eur: 0 });

  const items = await Cart.listCartItems(cart.id, req.lang);
  const subtotal = money(items.reduce((sum, item) => sum + lineTotal(item), 0));

  return ok(res, { id: cart.id, items, subtotal_eur: subtotal });
}

export async function addCartItem(req, res) {
  const quantity = Number(req.body.quantity || 1);

  if (!req.body.product_variant_id || quantity < 1) {
    return fail(res, 422, "Product variant and valid quantity are required");
  }

  if (
    req.body.item_type === "rental" &&
    (!req.body.rental_start_date || !req.body.rental_end_date)
  ) {
    return fail(res, 422, "Rental start and end dates are required");
  }

  const cartId = await transaction(async (connection) => {
    const cart = await Cart.findOrCreateActiveCart(req.user.id, connection);
    await Cart.addCartItem(cart.id, { ...req.body, quantity }, connection);
    return cart.id;
  });

  return created(res, { cart_id: cartId }, "Cart item added");
}

export async function updateCartItem(req, res) {
  const quantity = Math.max(Number(req.body.quantity || 1), 1);
  await Cart.updateCartItemQuantity(req.params.id, req.user.id, quantity);
  return ok(res, null, "Cart item updated");
}

export async function removeCartItem(req, res) {
  await Cart.removeCartItem(req.params.id, req.user.id);
  return ok(res, null, "Cart item removed");
}

export async function clearCart(req, res) {
  await Cart.clearCart(req.user.id);
  return ok(res, null, "Cart cleared");
}

export default {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
