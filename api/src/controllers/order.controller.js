import { db, transaction } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { money, toAoa } from "../utils/currency.js";
import { hashToken, reference } from "../utils/reference.js";
import * as Cart from "../models/cart.model.js";
import * as GiftCard from "../models/giftCard.model.js";
import * as Order from "../models/order.model.js";
import * as Payment from "../models/payment.model.js";
import * as Setting from "../models/setting.model.js";

const orderStatuses = new Set([
  "pending_payment",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "shipped",
  "completed",
  "cancelled",
]);

const paymentStatuses = new Set([
  "unpaid",
  "partially_paid",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
]);

function localizedProductName(item, lang = "fr") {
  return item[`name_${lang}`] || item.name_fr || item.sku;
}

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

async function currentRate(connection = db) {
  const [rows] = await connection.execute(
    "SELECT rate FROM v_current_exchange_rate LIMIT 1",
  );
  return Number(rows[0]?.rate || 1000);
}

async function resolveDeliveryPrice(req, connection = db) {
  const fulfillmentType = req.body.fulfillment_type || "pickup";
  if (fulfillmentType !== "delivery" || req.body.resell_to_company) {
    return { countryCode: null, shipping: 0 };
  }

  const countryCode = String(req.body.shipping_country_code || "AO")
    .trim()
    .toUpperCase();
  const country = await Setting.findDeliveryCountryByCode(
    countryCode,
    connection,
  );

  if (!country) {
    throw Object.assign(new Error("Pays de livraison indisponible"), {
      status: 422,
    });
  }

  return {
    countryCode: country.country_code,
    shipping: money(country.delivery_price_eur),
  };
}

async function resolveResaleBranchId(requestedBranchId, connection = db) {
  if (requestedBranchId) return Number(requestedBranchId);

  const [rows] = await connection.execute(
    "SELECT id FROM branches WHERE status = 'active' ORDER BY id ASC LIMIT 1",
  );

  const branchId = Number(rows[0]?.id || 0);
  if (!branchId) {
    throw Object.assign(
      new Error("Aucun guichet actif disponible pour la revente"),
      { status: 422 },
    );
  }

  return branchId;
}

function uniqueGiftCardIds(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

async function applyGiftCardsToOrder({
  connection,
  giftCardIds,
  orderId,
  total,
  userId,
}) {
  const ids = uniqueGiftCardIds(giftCardIds);
  let remaining = money(total);
  let paid = 0;
  const allocations = [];

  for (const cardId of ids) {
    if (remaining <= 0) break;

    const card = await GiftCard.lockGiftCard(cardId, connection);
    if (!card) {
      throw Object.assign(new Error("Carte cadeau introuvable"), {
        status: 404,
      });
    }

    if (Number(card.owner_user_id) !== Number(userId)) {
      throw Object.assign(
        new Error("Cette carte cadeau n'appartient pas a ce compte"),
        { status: 403 },
      );
    }

    if (card.status !== "active") {
      throw Object.assign(new Error("Cette carte cadeau n'est pas active"), {
        status: 422,
      });
    }

    const currentBalance = money(card.current_balance_eur);
    const reservedBalance = money(card.reserved_balance_eur);
    const available = money(Math.max(currentBalance - reservedBalance, 0));
    if (available <= 0) continue;

    const amount = money(Math.min(available, remaining));
    allocations.push({
      amount,
      card,
      currentBalance,
      reservedBalance,
    });

    paid = money(paid + amount);
    remaining = money(remaining - amount);
  }

  const requiresStripe = remaining > 0;
  const appliedCards = [];

  for (const allocation of allocations) {
    const { amount, card, currentBalance, reservedBalance } = allocation;
    const nextBalance = money(currentBalance - amount);
    const nextReservedBalance = money(reservedBalance + amount);
    const paymentStatus = requiresStripe ? "reserved" : "succeeded";
    const payment = await Payment.createPayment(
      {
        user_id: userId,
        order_id: orderId,
        gift_card_id: card.id,
        purpose: "order",
        method: "gift_card",
        amount_eur: amount,
        status: paymentStatus,
        stripe_payment_intent_id: null,
        stripe_checkout_session_id: null,
        metadata: JSON.stringify({
          source: "checkout",
          gift_card_serial: card.serial_number,
          reserved_until_stripe_confirmation: requiresStripe,
        }),
      },
      connection,
    );

    if (requiresStripe) {
      await GiftCard.updateGiftCardBalances(
        card.id,
        { reservedBalance: nextReservedBalance },
        connection,
      );
    } else {
      await GiftCard.updateGiftCardBalances(
        card.id,
        {
          currentBalance: nextBalance,
          status: nextBalance <= 0 ? "fully_used" : "active",
        },
        connection,
      );
    }

    await GiftCard.writeTransaction(
      {
        gift_card_id: card.id,
        payment_id: payment.insertId,
        order_id: orderId,
        type: requiresStripe ? "payment_reserved" : "payment_completed",
        amount_eur: amount,
        balance_before_eur: currentBalance,
        balance_after_eur: requiresStripe ? currentBalance : nextBalance,
        reserved_before_eur: reservedBalance,
        reserved_after_eur: requiresStripe
          ? nextReservedBalance
          : reservedBalance,
        description: requiresStripe
          ? "Reservation carte cadeau en attente du paiement Stripe"
          : "Paiement commande par carte cadeau",
        created_by: userId,
      },
      connection,
    );

    appliedCards.push({
      gift_card_id: card.id,
      amount_eur: amount,
      remaining_balance_eur: requiresStripe ? currentBalance : nextBalance,
      reserved_balance_eur: requiresStripe
        ? nextReservedBalance
        : reservedBalance,
      status: paymentStatus,
    });
  }

  const paymentStatus =
    paid <= 0 ? "unpaid" : remaining <= 0 ? "paid" : "partially_paid";
  const committedPaid = requiresStripe ? 0 : paid;

  await connection.execute(
    `UPDATE orders
     SET payment_status = ?,
       paid_total_eur = ?,
       paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
     WHERE id = ?`,
    [paymentStatus, committedPaid, paymentStatus, orderId],
  );

  return {
    applied_cards: appliedCards,
    gift_card_paid_eur: paid,
    gift_card_reserved_eur: requiresStripe ? paid : 0,
    payment_status: paymentStatus,
    remaining_due_eur: remaining,
  };
}

export async function checkout(req, res) {
  const order = await transaction(async (connection) => {
    const cart = await Cart.findOrCreateActiveCart(req.user.id, connection);
    const items = await Order.lockCheckoutItems(cart.id, connection);

    if (!items.length) {
      throw Object.assign(new Error("Cart is empty"), { status: 422 });
    }

    for (const item of items) {
      if (
        Number(item.stock_quantity) - Number(item.reserved_quantity) <
        Number(item.quantity)
      ) {
        throw Object.assign(new Error(`Insufficient stock for ${item.sku}`), {
          status: 409,
        });
      }

      if (item.item_type === "rental") {
        if (!item.rental_start_date || !item.rental_end_date) {
          throw Object.assign(
            new Error(`Rental dates are required for ${item.sku}`),
            {
              status: 422,
            },
          );
        }

        const reserved = await Order.countRentalConflicts(
          item.product_variant_id,
          item.rental_start_date,
          item.rental_end_date,
          connection,
        );

        if (reserved + Number(item.quantity) > Number(item.stock_quantity)) {
          throw Object.assign(
            new Error(`Rental period is unavailable for ${item.sku}`),
            {
              status: 409,
            },
          );
        }
      }
    }

    const rate = await currentRate(connection);
    const resaleBranchId = req.body.resell_to_company
      ? await resolveResaleBranchId(req.body.branch_id, connection)
      : null;
    const subtotal = money(
      items.reduce((sum, item) => sum + lineTotal(item), 0),
    );
    const delivery = await resolveDeliveryPrice(req, connection);
    const total = money(subtotal + delivery.shipping);
    const pickupCode = String(Math.floor(100000 + Math.random() * 900000));
    const orderNumber = reference("ORD");

    const orderResult = await Order.createOrder(
      {
        order_number: orderNumber,
        user_id: req.user.id,
        fulfillment_type: req.body.fulfillment_type || "pickup",
        branch_id: req.body.branch_id || null,
        beneficiary_name: req.body.beneficiary_name || null,
        beneficiary_phone: req.body.beneficiary_phone || null,
        pickup_code_hash: hashToken(pickupCode),
        shipping_name: req.body.shipping_name || null,
        shipping_phone: req.body.shipping_phone || null,
        shipping_address_line_1: req.body.shipping_address_line_1 || null,
        shipping_address_line_2: req.body.shipping_address_line_2 || null,
        shipping_city: req.body.shipping_city || null,
        shipping_province: req.body.shipping_province || null,
        shipping_postal_code: req.body.shipping_postal_code || null,
        shipping_country_code: delivery.countryCode,
        subtotal_eur: subtotal,
        shipping_total_eur: delivery.shipping,
        total_eur: total,
        exchange_rate_eur_to_aoa: rate,
        total_aoa: toAoa(total, rate),
        resell_to_company: Boolean(req.body.resell_to_company),
        customer_notes: req.body.customer_notes || null,
      },
      connection,
    );

    for (const item of items) {
      const total = money(lineTotal(item));
      const orderItemResult = await Order.createOrderItem(
        {
          order_id: orderResult.insertId,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          item_type: item.item_type,
          product_name: localizedProductName(item, req.body.language || "fr"),
          sku: item.sku,
          size: item.size,
          color: item.color_name,
          condition_type: item.condition_type,
          quantity: item.quantity,
          unit_price_eur:
            item.item_type === "rental"
              ? item.rental_price_per_day_eur
              : item.sale_price_eur,
          line_total_eur: total,
          resell_to_company:
            item.item_type === "purchase" &&
            Boolean(req.body.resell_to_company),
          rental_start_date: item.rental_start_date,
          rental_end_date: item.rental_end_date,
          rental_days: item.rental_days,
          rental_price_per_day_eur: item.rental_price_per_day_eur,
          rental_deposit_eur: item.rental_deposit_eur,
          rental_status:
            item.item_type === "rental" ? "reserved" : "not_applicable",
        },
        connection,
      );

      if (req.body.resell_to_company && item.item_type === "purchase") {
        if (!req.body.beneficiary_name) {
          throw Object.assign(
            new Error("Beneficiary is required for company resale"),
            { status: 422 },
          );
        }

        await Order.createCompanyResale(
          {
            order_item_id: orderItemResult.insertId,
            user_id: req.user.id,
            branch_id: resaleBranchId,
            amount_eur: total,
            exchange_rate_eur_to_aoa: rate,
            payout_amount_aoa: toAoa(total, rate),
            beneficiary_name: req.body.beneficiary_name,
            beneficiary_phone: req.body.beneficiary_phone || null,
          },
          connection,
        );
      }

      await Order.reserveVariantStock(
        item.product_variant_id,
        item.quantity,
        connection,
      );
    }

    await Order.convertCart(cart.id, connection);

    return {
      id: orderResult.insertId,
      order_number: orderNumber,
      subtotal_eur: subtotal,
      shipping_eur: delivery.shipping,
      total_eur: total,
      total_aoa: toAoa(total, rate),
      pickup_code: pickupCode,
    };
  });

  return created(res, order, "Order created");
}

async function findCheckoutVariant(productId, variantId, connection) {
  const selectedVariantId = Number(variantId || 0) || null;
  const [rows] = await connection.execute(
    `SELECT
      p.id AS product_id,
      p.sku AS product_sku,
      p.name_fr,
      p.condition_type,
      pv.id AS product_variant_id,
      pv.sku AS variant_sku,
      pv.size,
      pv.color_name,
      COALESCE(pv.sale_price_eur, p.sale_price_eur, 0) AS sale_price_eur,
      COALESCE(
        pv.rental_price_per_day_eur,
        p.rental_price_per_day_eur,
        0
      ) AS rental_price_per_day_eur,
      COALESCE(pv.rental_deposit_eur, p.rental_deposit_eur, 0) AS rental_deposit_eur,
      p.sale_enabled,
      p.rental_enabled
    FROM products p
    INNER JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.id = ?
      AND (? IS NULL OR pv.id = ?)
      AND p.status = 'active'
      AND pv.status = 'active'
    ORDER BY pv.stock_quantity DESC, pv.id ASC
    LIMIT 1`,
    [productId, selectedVariantId, selectedVariantId],
  );
  return rows[0] || null;
}

export async function directCheckout(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return fail(res, 422, "Cart is empty");

  const order = await transaction(async (connection) => {
    const checkoutItems = [];

    for (const item of items) {
      const productId = Number(item.product_id || item.id);
      const variantId = Number(item.product_variant_id || item.variant_id || 0);
      const quantity = Math.max(Number(item.quantity || 1), 1);
      const itemType = item.item_type === "rental" ? "rental" : "purchase";
      const variant = await findCheckoutVariant(
        productId,
        variantId,
        connection,
      );
      if (!variant) {
        throw Object.assign(
          new Error(
            variantId
              ? `La variante ${variantId} du produit ${productId} est indisponible`
              : `Le produit ${productId} est indisponible`,
          ),
          { status: 422 },
        );
      }

      if (itemType === "rental" && !variant.rental_enabled) {
        throw Object.assign(
          new Error(`Product ${productId} is not available for rental`),
          { status: 422 },
        );
      }

      if (
        itemType === "rental" &&
        (!item.rental_start_date || !item.rental_end_date)
      ) {
        throw Object.assign(
          new Error(`Rental dates are required for product ${productId}`),
          { status: 422 },
        );
      }

      if (itemType === "purchase" && !variant.sale_enabled) {
        throw Object.assign(
          new Error(`Product ${productId} is not available for purchase`),
          { status: 422 },
        );
      }

      const rentalDays = Math.max(Number(item.rental_days || 1), 1);
      const rentalPricePerDay = money(
        item.rental_price_per_day_eur || variant.rental_price_per_day_eur,
      );
      const rentalDeposit = money(
        item.rental_deposit_eur || variant.rental_deposit_eur || 0,
      );
      const unitPrice = money(
        itemType === "rental"
          ? rentalPricePerDay
          : item.unit_price_eur || item.price || variant.sale_price_eur,
      );
      checkoutItems.push({
        ...variant,
        itemType,
        quantity,
        rentalDays,
        rentalDeposit,
        rentalEndDate: item.rental_end_date || null,
        rentalPricePerDay,
        rentalStartDate: item.rental_start_date || null,
        unitPrice,
      });
    }

    const rate = await currentRate(connection);
    const resaleBranchId = req.body.resell_to_company
      ? await resolveResaleBranchId(req.body.branch_id, connection)
      : null;
    const subtotal = money(
      checkoutItems.reduce(
        (sum, item) =>
          sum +
          (item.itemType === "rental"
            ? Number(item.quantity) *
                Number(item.rentalDays) *
                Number(item.rentalPricePerDay) +
              Number(item.rentalDeposit)
            : Number(item.quantity) * Number(item.unitPrice)),
        0,
      ),
    );
    const delivery = await resolveDeliveryPrice(req, connection);
    const shipping = delivery.shipping;
    const total = money(subtotal + shipping);
    const pickupCode = String(Math.floor(100000 + Math.random() * 900000));
    const orderNumber = reference("ORD");

    const orderResult = await Order.createOrder(
      {
        order_number: orderNumber,
        user_id: req.user.id,
        fulfillment_type: req.body.fulfillment_type || "pickup",
        branch_id: req.body.branch_id || null,
        beneficiary_name: req.body.beneficiary_name || null,
        beneficiary_phone: req.body.beneficiary_phone || null,
        pickup_code_hash: hashToken(pickupCode),
        shipping_name:
          req.body.shipping_name || req.body.beneficiary_name || null,
        shipping_phone:
          req.body.shipping_phone || req.body.beneficiary_phone || null,
        shipping_address_line_1: req.body.shipping_address_line_1 || null,
        shipping_address_line_2: req.body.shipping_address_line_2 || null,
        shipping_city: req.body.shipping_city || null,
        shipping_province: req.body.shipping_province || null,
        shipping_postal_code: req.body.shipping_postal_code || null,
        shipping_country_code: delivery.countryCode,
        subtotal_eur: subtotal,
        shipping_total_eur: shipping,
        total_eur: total,
        exchange_rate_eur_to_aoa: rate,
        total_aoa: toAoa(total, rate),
        resell_to_company: Boolean(req.body.resell_to_company),
        customer_notes: req.body.resell_to_company
          ? "Client requested company resale payout at counter."
          : req.body.customer_notes || null,
      },
      connection,
    );

    for (const item of checkoutItems) {
      const lineTotal = money(
        item.itemType === "rental"
          ? Number(item.quantity) *
              Number(item.rentalDays) *
              Number(item.rentalPricePerDay) +
              Number(item.rentalDeposit)
          : Number(item.quantity) * Number(item.unitPrice),
      );
      const orderItemResult = await Order.createOrderItem(
        {
          order_id: orderResult.insertId,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          item_type: item.itemType,
          product_name: item.name_fr,
          sku: item.variant_sku || item.product_sku,
          size: item.size,
          color: item.color_name,
          condition_type: item.condition_type,
          quantity: item.quantity,
          unit_price_eur: item.unitPrice,
          line_total_eur: lineTotal,
          resell_to_company:
            item.itemType === "purchase" && Boolean(req.body.resell_to_company),
          rental_start_date: item.rentalStartDate,
          rental_end_date: item.rentalEndDate,
          rental_days: item.itemType === "rental" ? item.rentalDays : null,
          rental_price_per_day_eur:
            item.itemType === "rental" ? item.rentalPricePerDay : null,
          rental_deposit_eur:
            item.itemType === "rental" ? item.rentalDeposit : 0,
          rental_status:
            item.itemType === "rental" ? "reserved" : "not_applicable",
        },
        connection,
      );

      if (req.body.resell_to_company && item.itemType === "purchase") {
        if (!req.body.beneficiary_name) {
          throw Object.assign(
            new Error("Beneficiary is required for company resale"),
            { status: 422 },
          );
        }

        await Order.createCompanyResale(
          {
            order_item_id: orderItemResult.insertId,
            user_id: req.user.id,
            branch_id: resaleBranchId,
            amount_eur: lineTotal,
            exchange_rate_eur_to_aoa: rate,
            payout_amount_aoa: toAoa(lineTotal, rate),
            beneficiary_name: req.body.beneficiary_name,
            beneficiary_phone: req.body.beneficiary_phone || null,
          },
          connection,
        );
      }
    }

    const giftCardResult = await applyGiftCardsToOrder({
      connection,
      giftCardIds: req.body.gift_card_ids,
      orderId: orderResult.insertId,
      total,
      userId: req.user.id,
    });

    return {
      id: orderResult.insertId,
      order_number: orderNumber,
      subtotal_eur: subtotal,
      shipping_eur: shipping,
      total_eur: total,
      total_aoa: toAoa(total, rate),
      pickup_code: pickupCode,
      ...giftCardResult,
    };
  });

  return created(res, order, "Order created");
}

export async function listOrders(req, res) {
  const result = await Order.listOrders({
    user: req.user,
    query: req.query,
  });
  return ok(res, result.rows, "ok", result.meta);
}

export async function getOrder(req, res) {
  const order = await Order.findOrderById(req.params.id, req.user);

  if (!order) {
    return fail(res, 404, "Order not found");
  }

  const [items, payments, history] = await Promise.all([
    Order.listOrderItems(order.id),
    Order.listOrderPayments(order.id),
    Order.listOrderHistory(order.id),
  ]);

  return ok(res, { ...order, items, payments, history });
}

export async function cancelPendingOrderPayment(req, res) {
  const order = await Order.findOrderById(req.params.id, req.user);

  if (!order) {
    return fail(res, 404, "Order not found");
  }

  if (order.payment_status === "paid") {
    return fail(res, 409, "Order is already paid");
  }

  await transaction(async (connection) => {
    const lockedOrder = await Order.lockOrder(order.id, connection);
    if (!lockedOrder) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    await Payment.releaseOrderGiftCardReservations(
      lockedOrder.id,
      "Paiement Stripe annule par le client",
      connection,
    );
  });

  return ok(res, null, "Pending payment cancelled");
}

export async function updateOrderStatus(req, res) {
  if (!orderStatuses.has(req.body.status)) {
    return fail(res, 422, "Invalid order status");
  }

  await transaction(async (connection) => {
    const order = await Order.lockOrder(req.params.id, connection);
    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (req.user.role === "cashier") {
      if (!req.user.branch_id) {
        throw Object.assign(
          new Error("Aucun guichet n'est assigne a ce compte caissier"),
          { status: 403 },
        );
      }

      if (
        order.branch_id &&
        Number(order.branch_id) !== Number(req.user.branch_id)
      ) {
        throw Object.assign(
          new Error("Cette commande appartient a un autre guichet"),
          { status: 403 },
        );
      }

      if (!order.branch_id) {
        await Order.assignBranch(order.id, req.user.branch_id, connection);
      }
    }

    await Order.updateStatus(
      order.id,
      order.status,
      req.body.status,
      req.body.notes || null,
      req.user.id,
      connection,
    );
  });

  return ok(res, null, "Order status updated");
}

export async function updateOrderAdmin(req, res) {
  if (req.body.status && !orderStatuses.has(req.body.status)) {
    return fail(res, 422, "Invalid order status");
  }

  if (
    req.body.payment_status &&
    !paymentStatuses.has(req.body.payment_status)
  ) {
    return fail(res, 422, "Invalid payment status");
  }

  await transaction(async (connection) => {
    const order = await Order.lockOrder(req.params.id, connection);
    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    const payload = {
      fulfillment_type: req.body.fulfillment_type,
      branch_id: req.body.branch_id || null,
      beneficiary_name: req.body.beneficiary_name,
      beneficiary_phone: req.body.beneficiary_phone,
      shipping_name: req.body.shipping_name,
      shipping_phone: req.body.shipping_phone,
      shipping_address_line_1: req.body.shipping_address_line_1,
      shipping_address_line_2: req.body.shipping_address_line_2,
      shipping_city: req.body.shipping_city,
      shipping_province: req.body.shipping_province,
      shipping_postal_code: req.body.shipping_postal_code,
      shipping_country_code: req.body.shipping_country_code,
      shipping_carrier: req.body.shipping_carrier,
      shipping_tracking_number: req.body.shipping_tracking_number,
      payment_status: req.body.payment_status,
      status: req.body.status,
      customer_notes: req.body.customer_notes,
      admin_notes: req.body.admin_notes,
    };

    await Order.updateOrderAdmin(order.id, payload, connection);

    if (req.body.status && req.body.status !== order.status) {
      await Order.insertStatusHistory(
        order.id,
        order.status,
        req.body.status,
        req.body.status_notes || req.body.admin_notes || null,
        req.user.id,
        connection,
      );
    }
  });

  const updated = await Order.findOrderById(req.params.id, req.user);
  return ok(res, updated, "Order updated");
}

export default {
  checkout,
  cancelPendingOrderPayment,
  directCheckout,
  listOrders,
  getOrder,
  updateOrderAdmin,
  updateOrderStatus,
};
