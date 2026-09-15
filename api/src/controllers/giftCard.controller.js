import { transaction } from "../config/database.js";
import { stripe } from "../config/stripe.js";
import * as Payment from "../models/payment.model.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { money } from "../utils/currency.js";
import { reference } from "../utils/reference.js";
import * as GiftCard from "../models/giftCard.model.js";

export async function listGiftCardTypes(req, res) {
  const rows = await GiftCard.listGiftCardTypes(
    req.lang,
    req.query.admin === "1",
  );
  return ok(res, rows);
}

export async function createGiftCardType(req, res) {
  const required = ["name", "code", "value_eur"];
  const missing = required.filter((field) => !req.body[field]);
  if (missing.length)
    return fail(
      res,
      422,
      `Missing gift card type fields: ${missing.join(", ")}`,
    );

  const result = await GiftCard.createGiftCardType({
    name: req.body.name,
    code: req.body.code,
    value_eur: req.body.value_eur,
    description_fr: req.body.description_fr || null,
    description_en: req.body.description_en || null,
    description_pt: req.body.description_pt || null,
    image_url: req.body.image_url || null,
    status: req.body.status || "active",
    created_by: req.user.id,
  });

  return created(res, { id: result.insertId }, "Gift card type created");
}

export async function listGiftCards(req, res) {
  const rows = await GiftCard.listGiftCards(req.user, req.query);
  return ok(res, rows);
}

export async function checkGiftCardBalance(req, res) {
  const serial = String(req.params.serial || "").trim();
  if (!serial) return fail(res, 422, "Gift card serial number is required");

  const card = await GiftCard.findGiftCardBalanceBySerial(serial);
  if (!card) return fail(res, 404, "Gift card not found");

  return ok(res, card);
}

export async function createAdminGiftCard(req, res) {
  const type = await GiftCard.findGiftCardType(req.body.gift_card_type_id);
  if (!type) return fail(res, 404, "Gift card type not found");

  const card = await transaction(async (connection) => {
    const serial = reference("GC");
    const result = await GiftCard.createGiftCard(
      {
        gift_card_type_id: type.id,
        serial_number: serial,
        purchased_by: null,
        owner_user_id: req.body.owner_user_id || null,
        initial_balance_eur: type.value_eur,
        current_balance_eur: type.value_eur,
        source: "admin_created",
        status: "active",
        created_by: req.user.id,
      },
      connection,
    );

    await GiftCard.writeTransaction(
      {
        gift_card_id: result.insertId,
        type: "created",
        amount_eur: type.value_eur,
        balance_before_eur: 0,
        balance_after_eur: type.value_eur,
        reserved_before_eur: 0,
        reserved_after_eur: 0,
        description: "Admin card creation",
        created_by: req.user.id,
      },
      connection,
    );

    return { id: result.insertId, serial_number: serial };
  });

  return created(res, card, "Gift card created");
}

export async function createGiftCardStripeCheckoutSession(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const type = await GiftCard.findGiftCardType(req.body.gift_card_type_id);
  if (!type || type.status !== "active") {
    return fail(res, 404, "Gift card type not found");
  }

  const amount = Math.round(Number(type.value_eur || 0) * 100);
  if (amount < 50) return fail(res, 422, "Invalid gift card amount");

  const result = await transaction(async (connection) => {
    const serial = reference("GC");
    const cardResult = await GiftCard.createGiftCard(
      {
        gift_card_type_id: type.id,
        serial_number: serial,
        purchased_by: req.user.id,
        owner_user_id: req.body.owner_user_id || req.user.id,
        initial_balance_eur: type.value_eur,
        current_balance_eur: type.value_eur,
        source: "customer_purchase",
        status: "pending_payment",
        created_by: req.user.id,
      },
      connection,
    );

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
      customer_email: req.user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: `Carte cadeau ${type.name}`,
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          user_id: String(req.user.id),
          gift_card_id: String(cardResult.insertId),
          purpose: "gift_card_purchase",
        },
      },
      metadata: {
        user_id: String(req.user.id),
        gift_card_id: String(cardResult.insertId),
        purpose: "gift_card_purchase",
      },
    });

    const payment = await Payment.createPayment(
      {
        user_id: req.user.id,
        order_id: null,
        gift_card_id: cardResult.insertId,
        purpose: "gift_card_purchase",
        method: "stripe",
        amount_eur: Number(type.value_eur),
        status: "pending",
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        stripe_checkout_session_id: session.id,
        metadata: JSON.stringify(session.metadata || {}),
      },
      connection,
    );

    return {
      gift_card_id: cardResult.insertId,
      payment_id: payment.insertId,
      serial_number: serial,
      checkout_session_id: session.id,
      url: session.url,
      value_eur: Number(type.value_eur),
      card_name: type.name,
    };
  });

  return created(res, result, "Gift card Stripe checkout session created");
}

export async function createGiftCardMobilePaymentIntent(req, res) {
  if (!stripe) return fail(res, 503, "Stripe is not configured");

  const type = await GiftCard.findGiftCardType(req.body.gift_card_type_id);
  if (!type || type.status !== "active") {
    return fail(res, 404, "Gift card type not found");
  }

  const amount = Math.round(Number(type.value_eur || 0) * 100);
  if (amount < 50) return fail(res, 422, "Invalid gift card amount");

  const result = await transaction(async (connection) => {
    const serial = reference("GC");
    const cardResult = await GiftCard.createGiftCard(
      {
        gift_card_type_id: type.id,
        serial_number: serial,
        purchased_by: req.user.id,
        owner_user_id: req.body.owner_user_id || req.user.id,
        initial_balance_eur: type.value_eur,
        current_balance_eur: type.value_eur,
        source: "customer_purchase",
        status: "pending_payment",
        created_by: req.user.id,
      },
      connection,
    );

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      receipt_email: req.user.email || undefined,
      metadata: {
        user_id: String(req.user.id),
        gift_card_id: String(cardResult.insertId),
        purpose: "gift_card_purchase",
      },
    });

    const payment = await Payment.createPayment(
      {
        user_id: req.user.id,
        order_id: null,
        gift_card_id: cardResult.insertId,
        purpose: "gift_card_purchase",
        method: "stripe",
        amount_eur: Number(type.value_eur),
        status: intent.status === "succeeded" ? "succeeded" : "pending",
        stripe_payment_intent_id: intent.id,
        stripe_checkout_session_id: null,
        metadata: JSON.stringify(intent.metadata || {}),
      },
      connection,
    );

    return {
      gift_card_id: cardResult.insertId,
      payment_id: payment.insertId,
      payment_intent_id: intent.id,
      client_secret: intent.client_secret,
      status: intent.status,
      serial_number: serial,
      value_eur: Number(type.value_eur),
      card_name: type.name,
    };
  });

  return created(res, result, "Gift card mobile PaymentIntent created");
}

export async function updateGiftCardStatus(req, res) {
  if (
    !["active", "blocked", "expired", "cancelled"].includes(req.body.status)
  ) {
    return fail(res, 422, "Invalid gift card status");
  }

  await GiftCard.updateGiftCard(req.params.id, { status: req.body.status });
  return ok(res, null, "Gift card status updated");
}

export async function adjustGiftCard(req, res) {
  const amount = Number(req.body.amount_eur || 0);
  if (!amount) return fail(res, 422, "Adjustment amount is required");

  await transaction(async (connection) => {
    const card = await GiftCard.lockGiftCard(req.params.id, connection);
    if (!card)
      throw Object.assign(new Error("Gift card not found"), { status: 404 });

    const nextBalance = money(Number(card.current_balance_eur) + amount);
    if (nextBalance < 0) {
      throw Object.assign(new Error("Gift card balance cannot be negative"), {
        status: 422,
      });
    }

    await GiftCard.updateGiftCardBalance(card.id, nextBalance, connection);
    await GiftCard.writeTransaction(
      {
        gift_card_id: card.id,
        type: amount > 0 ? "admin_credit" : "admin_debit",
        amount_eur: Math.abs(amount),
        balance_before_eur: card.current_balance_eur,
        balance_after_eur: nextBalance,
        reserved_before_eur: card.reserved_balance_eur,
        reserved_after_eur: card.reserved_balance_eur,
        description: req.body.description || null,
        created_by: req.user.id,
      },
      connection,
    );
  });

  return ok(res, null, "Gift card adjusted");
}

export async function listGiftCardTransactions(req, res) {
  const rows = await GiftCard.listTransactions(req.params.id, req.user);
  return ok(res, rows);
}

export default {
  listGiftCardTypes,
  createGiftCardType,
  listGiftCards,
  checkGiftCardBalance,
  createAdminGiftCard,
  createGiftCardStripeCheckoutSession,
  createGiftCardMobilePaymentIntent,
  updateGiftCardStatus,
  adjustGiftCard,
  listGiftCardTransactions,
};
