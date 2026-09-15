import { transaction } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { stripe } from "../config/stripe.js";
import * as GiftCard from "../models/giftCard.model.js";
import * as Payment from "../models/payment.model.js";

export async function listPayments(req, res) {
  const rows = await Payment.listPayments(req.user, req.query);
  return ok(res, rows);
}

export async function createStripeIntent(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const amount = Math.round(Number(req.body.amount_eur || 0) * 100);
  if (amount < 50) return fail(res, 422, "Invalid payment amount");

  const confirmTestPayment =
    process.env.NODE_ENV !== "production" && req.body.confirm_test_payment;
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    ...(confirmTestPayment
      ? {
          confirm: true,
          payment_method: "pm_card_visa",
          return_url:
            req.body.return_url || "http://localhost:5173/order-success",
        }
      : {}),
    metadata: {
      user_id: String(req.user.id),
      order_id: String(req.body.order_id || ""),
      purpose: req.body.purpose || "order",
    },
  });

  const payment = await Payment.createPayment({
    user_id: req.user.id,
    order_id: req.body.order_id || null,
    gift_card_id: req.body.gift_card_id || null,
    purpose: req.body.purpose || "order",
    method: "stripe",
    amount_eur: Number(req.body.amount_eur),
    status: intent.status === "succeeded" ? "succeeded" : "pending",
    stripe_payment_intent_id: intent.id,
    stripe_checkout_session_id: null,
    metadata: JSON.stringify(intent.metadata),
  });

  if (intent.status === "succeeded") {
    await Payment.markStripePaymentSucceeded(intent.id);
  }

  return created(
    res,
    {
      payment_id: payment.insertId,
      payment_intent_id: intent.id,
      client_secret: intent.client_secret,
      status: intent.status,
    },
    "Stripe intent created",
  );
}

export async function createStripeCheckoutSession(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const amount = Math.round(Number(req.body.amount_eur || 0) * 100);
  if (amount < 50) return fail(res, 422, "Invalid payment amount");

  const orderId = req.body.order_id || null;
  const purpose = req.body.purpose || "order";
  const successUrl =
    req.body.success_url ||
    "http://localhost:5173/order-success?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl =
    req.body.cancel_url ||
    "http://localhost:5173/order-failure?session_id={CHECKOUT_SESSION_ID}";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: req.body.customer_email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: {
            name: req.body.description || "Commande AK Fashion Plus",
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: {
        user_id: String(req.user.id),
        order_id: String(orderId || ""),
        purpose,
      },
    },
    metadata: {
      user_id: String(req.user.id),
      order_id: String(orderId || ""),
      purpose,
    },
  });

  const payment = await Payment.createPayment({
    user_id: req.user.id,
    order_id: orderId,
    gift_card_id: req.body.gift_card_id || null,
    purpose,
    method: "stripe",
    amount_eur: Number(req.body.amount_eur),
    status: "pending",
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    stripe_checkout_session_id: session.id,
    metadata: JSON.stringify(session.metadata || {}),
  });

  return created(
    res,
    {
      payment_id: payment.insertId,
      checkout_session_id: session.id,
      url: session.url,
    },
    "Stripe checkout session created",
  );
}

export async function getStripeCheckoutSession(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const session = await stripe.checkout.sessions.retrieve(
    req.params.sessionId,
    {
      expand: ["payment_intent"],
    },
  );
  const paymentIntent =
    typeof session.payment_intent === "string" ? null : session.payment_intent;

  if (paymentIntent?.id) {
    await Payment.attachStripePaymentIntentToCheckoutSession(
      session.id,
      paymentIntent.id,
    );
  }

  if (paymentIntent?.status === "succeeded") {
    await Payment.markStripePaymentSucceeded(paymentIntent.id);
  }

  const payment = await Payment.findPaymentByCheckoutSession(session.id);

  return ok(res, {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    purpose: payment?.purpose || null,
    order_id: payment?.order_id || null,
    gift_card_id: payment?.gift_card_id || null,
    payment_intent_id: paymentIntent?.id || session.payment_intent || null,
    payment_intent_status: paymentIntent?.status || null,
  });
}

export async function syncStripeIntent(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const paymentIntentId = req.params.paymentIntentId;
  const payment = await Payment.findPaymentByIntent(paymentIntentId);

  if (!payment) {
    return fail(res, 404, "Payment intent not found");
  }

  const isAdmin = req.user.role === "admin";
  if (!isAdmin && Number(payment.user_id) !== Number(req.user.id)) {
    return fail(res, 403, "You cannot access this payment");
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status === "succeeded") {
    await Payment.markStripePaymentSucceeded(intent.id);
  } else if (["canceled", "requires_payment_method"].includes(intent.status)) {
    await Payment.markStripePaymentFailed(
      intent.id,
      intent.last_payment_error?.message || "Payment failed",
    );
  }

  const refreshedPayment = await Payment.findPaymentByIntent(paymentIntentId);

  return ok(res, {
    payment_intent_id: intent.id,
    stripe_status: intent.status,
    payment_status: refreshedPayment?.status || payment.status,
    order_id: refreshedPayment?.order_id || payment.order_id,
    order_payment_status:
      refreshedPayment?.order_payment_status || payment.order_payment_status,
  });
}

export async function payOrderWithGiftCard(req, res) {
  const orderId = Number(req.body.order_id || 0);
  const giftCardId = Number(req.body.gift_card_id || 0);
  const requestedAmount = Number(req.body.amount_eur || 0);
  if (!orderId || !giftCardId) {
    return fail(res, 422, "Order and gift card are required");
  }

  const result = await transaction(async (connection) => {
    const [orderRows] = await connection.execute(
      `SELECT id, user_id, total_eur, payment_status, status
       FROM orders
       WHERE id = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [orderId, req.user.id],
    );
    const order = orderRows[0];
    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }
    if (order.payment_status === "paid") {
      throw Object.assign(new Error("Order is already paid"), { status: 409 });
    }

    const card = await GiftCard.lockGiftCard(giftCardId, connection);
    if (!card || Number(card.owner_user_id) !== Number(req.user.id)) {
      throw Object.assign(new Error("Gift card not found"), { status: 404 });
    }
    if (card.status !== "active") {
      throw Object.assign(new Error("Gift card is not active"), {
        status: 422,
      });
    }

    const amount = Number(requestedAmount || order.total_eur);
    const available =
      Number(card.current_balance_eur || 0) -
      Number(card.reserved_balance_eur || 0);
    if (available < amount) {
      throw Object.assign(new Error("Gift card balance is insufficient"), {
        status: 422,
      });
    }

    const nextBalance = Number(
      (Number(card.current_balance_eur) - amount).toFixed(2),
    );
    const payment = await Payment.createPayment(
      {
        user_id: req.user.id,
        order_id: order.id,
        gift_card_id: card.id,
        purpose: "order",
        method: "gift_card",
        amount_eur: amount,
        status: "succeeded",
        stripe_payment_intent_id: null,
        stripe_checkout_session_id: null,
        metadata: JSON.stringify({ source: "customer_gift_card" }),
      },
      connection,
    );

    await GiftCard.updateGiftCardBalance(card.id, nextBalance, connection);
    await GiftCard.writeTransaction(
      {
        gift_card_id: card.id,
        payment_id: payment.insertId,
        order_id: order.id,
        type: "payment_completed",
        amount_eur: amount,
        balance_before_eur: card.current_balance_eur,
        balance_after_eur: nextBalance,
        reserved_before_eur: card.reserved_balance_eur,
        reserved_after_eur: card.reserved_balance_eur,
        description: `Order ${order.id} paid with gift card`,
        created_by: req.user.id,
      },
      connection,
    );

    await connection.execute(
      `UPDATE orders
       SET payment_status = 'paid',
         status = IF(status = 'pending', 'paid', status),
         paid_at = NOW(),
         paid_total_eur = total_eur
       WHERE id = ?`,
      [order.id],
    );

    if (nextBalance <= 0) {
      await connection.execute(
        "UPDATE gift_cards SET status = 'fully_used' WHERE id = ?",
        [card.id],
      );
    }

    return {
      order_id: order.id,
      gift_card_id: card.id,
      payment_id: payment.insertId,
      charged_eur: amount,
      remaining_balance_eur: nextBalance,
    };
  });

  return created(res, result, "Order paid with gift card");
}

export default {
  listPayments,
  createStripeIntent,
  syncStripeIntent,
  createStripeCheckoutSession,
  getStripeCheckoutSession,
  payOrderWithGiftCard,
};
