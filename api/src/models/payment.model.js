import { db, query, transaction } from "../config/database.js";
import { reference } from "../utils/reference.js";
import { money } from "../utils/currency.js";

async function listReservedGiftCardPayments(orderId, connection) {
  const [rows] = await connection.execute(
    `SELECT
       p.id AS payment_id,
       p.user_id,
       p.order_id,
       p.gift_card_id,
       p.amount_eur,
       gc.current_balance_eur,
       gc.reserved_balance_eur,
       gc.status AS gift_card_status
     FROM payments p
     INNER JOIN gift_cards gc ON gc.id = p.gift_card_id
     WHERE p.order_id = ?
       AND p.purpose = 'order'
       AND p.method = 'gift_card'
       AND p.status = 'reserved'
     ORDER BY p.id ASC
     FOR UPDATE`,
    [orderId],
  );
  return rows;
}

export async function completeOrderGiftCardReservations(
  orderId,
  connection = db,
) {
  const reservedPayments = await listReservedGiftCardPayments(
    orderId,
    connection,
  );

  for (const payment of reservedPayments) {
    const amount = money(payment.amount_eur);
    const currentBefore = money(payment.current_balance_eur);
    const reservedBefore = money(payment.reserved_balance_eur);
    const currentAfter = money(Math.max(currentBefore - amount, 0));
    const reservedAfter = money(Math.max(reservedBefore - amount, 0));
    const nextStatus = currentAfter <= 0 ? "fully_used" : "active";

    await connection.execute(
      `UPDATE gift_cards
       SET current_balance_eur = ?,
         reserved_balance_eur = ?,
         status = ?
       WHERE id = ?`,
      [currentAfter, reservedAfter, nextStatus, payment.gift_card_id],
    );

    await connection.execute(
      `UPDATE payments
       SET status = 'succeeded', succeeded_at = COALESCE(succeeded_at, NOW())
       WHERE id = ?`,
      [payment.payment_id],
    );

    await connection.execute(
      `INSERT INTO gift_card_transactions (
        transaction_reference,
        gift_card_id,
        payment_id,
        order_id,
        type,
        amount_eur,
        balance_before_eur,
        balance_after_eur,
        reserved_before_eur,
        reserved_after_eur,
        description,
        created_by
      )
      VALUES (?, ?, ?, ?, 'payment_completed', ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference("GCT"),
        payment.gift_card_id,
        payment.payment_id,
        payment.order_id,
        amount,
        currentBefore,
        currentAfter,
        reservedBefore,
        reservedAfter,
        "Reservation carte cadeau finalisee apres paiement Stripe",
        payment.user_id,
      ],
    );
  }

  return reservedPayments;
}

export async function releaseOrderGiftCardReservations(
  orderId,
  message = "Paiement Stripe annule ou echoue",
  connection = db,
) {
  const reservedPayments = await listReservedGiftCardPayments(
    orderId,
    connection,
  );

  for (const payment of reservedPayments) {
    const amount = money(payment.amount_eur);
    const currentBefore = money(payment.current_balance_eur);
    const reservedBefore = money(payment.reserved_balance_eur);
    const reservedAfter = money(Math.max(reservedBefore - amount, 0));

    await connection.execute(
      "UPDATE gift_cards SET reserved_balance_eur = ? WHERE id = ?",
      [reservedAfter, payment.gift_card_id],
    );

    await connection.execute(
      `UPDATE payments
       SET status = 'cancelled', failure_message = ?
       WHERE id = ?`,
      [message, payment.payment_id],
    );

    await connection.execute(
      `INSERT INTO gift_card_transactions (
        transaction_reference,
        gift_card_id,
        payment_id,
        order_id,
        type,
        amount_eur,
        balance_before_eur,
        balance_after_eur,
        reserved_before_eur,
        reserved_after_eur,
        description,
        created_by
      )
      VALUES (?, ?, ?, ?, 'payment_released', ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference("GCT"),
        payment.gift_card_id,
        payment.payment_id,
        payment.order_id,
        amount,
        currentBefore,
        currentBefore,
        reservedBefore,
        reservedAfter,
        message,
        payment.user_id,
      ],
    );
  }

  await connection.execute(
    `UPDATE orders
     SET payment_status = CASE
       WHEN payment_status = 'paid' THEN payment_status
       ELSE 'failed'
     END
     WHERE id = ?`,
    [orderId],
  );

  return reservedPayments;
}

export async function listPayments(user, filters = {}) {
  const isAdmin = user.role === "admin";
  const where = ["(:admin = 1 OR p.user_id = :user_id)"];
  const params = {
    admin: isAdmin ? 1 : 0,
    user_id: user.id,
  };

  if (filters.order_id) {
    where.push("p.order_id = :order_id");
    params.order_id = Number(filters.order_id);
  }

  if (filters.status) {
    where.push("p.status = :status");
    params.status = filters.status;
  }

  if (filters.method) {
    where.push("p.method = :method");
    params.method = filters.method;
  }

  if (filters.purpose) {
    where.push("p.purpose = :purpose");
    params.purpose = filters.purpose;
  }

  if (filters.created_from) {
    where.push("DATE(p.created_at) >= :created_from");
    params.created_from = filters.created_from;
  }

  if (filters.created_to) {
    where.push("DATE(p.created_at) <= :created_to");
    params.created_to = filters.created_to;
  }

  if (filters.q) {
    where.push(`(
      p.payment_reference LIKE :q
      OR o.order_number LIKE :q
      OR gc.serial_number LIKE :q
      OR u.email LIKE :q
      OR CONCAT(u.first_name, ' ', u.last_name) LIKE :q
    )`);
    params.q = `%${filters.q}%`;
  }

  return query(
    `SELECT
       p.*,
       o.order_number,
       o.total_eur AS order_total_eur,
       o.payment_status AS order_payment_status,
       o.status AS order_status,
       gc.serial_number AS gift_card_serial,
       gct.name AS gift_card_name,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM payments p
     LEFT JOIN orders o ON o.id = p.order_id
     LEFT JOIN gift_cards gc ON gc.id = p.gift_card_id
     LEFT JOIN gift_card_types gct ON gct.id = gc.gift_card_type_id
     INNER JOIN users u ON u.id = p.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.created_at DESC, p.id DESC`,
    params,
  );
}

export async function createPayment(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO payments (
      payment_reference,
      user_id,
      order_id,
      gift_card_id,
      purpose,
      method,
      amount_eur,
      status,
      stripe_payment_intent_id,
      stripe_checkout_session_id,
      metadata
    )
    VALUES (
      :payment_reference,
      :user_id,
      :order_id,
      :gift_card_id,
      :purpose,
      :method,
      :amount_eur,
      :status,
      :stripe_payment_intent_id,
      :stripe_checkout_session_id,
      :metadata
    )`,
    { payment_reference: reference("PAY"), ...payload },
  );
  return result;
}

export async function recordStripeEvent(event) {
  try {
    await query(
      `INSERT INTO stripe_webhook_events (
        stripe_event_id,
        event_type,
        status,
        payload
      )
      VALUES (:stripe_event_id, :event_type, 'received', :payload)`,
      {
        stripe_event_id: event.id,
        event_type: event.type,
        payload: JSON.stringify(event),
      },
    );
    return true;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return false;
    throw error;
  }
}

export async function markStripePaymentSucceeded(paymentIntentId) {
  await transaction(async (connection) => {
    const [payments] = await connection.execute(
      `SELECT id, order_id
       FROM payments
       WHERE stripe_payment_intent_id = ?
       LIMIT 1
       FOR UPDATE`,
      [paymentIntentId],
    );
    const payment = payments[0] || null;

    await connection.execute(
      `UPDATE payments
       SET status = 'succeeded', succeeded_at = NOW()
       WHERE stripe_payment_intent_id = ?`,
      [paymentIntentId],
    );

    if (payment?.order_id) {
      await completeOrderGiftCardReservations(payment.order_id, connection);
      await connection.execute(
        `UPDATE orders
         SET payment_status = 'paid',
           status = IF(status IN ('pending_payment', 'pending'), 'confirmed', status),
           paid_at = COALESCE(paid_at, NOW()),
           paid_total_eur = total_eur
         WHERE id = ?`,
        [payment.order_id],
      );
    }
  });

  return activatePaidGiftCard(paymentIntentId);
}

export async function findPaymentByCheckoutSession(sessionId) {
  const rows = await query(
    `SELECT id, purpose, order_id, gift_card_id, status
     FROM payments
     WHERE stripe_checkout_session_id = :stripe_checkout_session_id
     LIMIT 1`,
    { stripe_checkout_session_id: sessionId },
  );
  return rows[0] || null;
}

export async function findPaymentByIntent(paymentIntentId) {
  const rows = await query(
    `SELECT
       p.id,
       p.user_id,
       p.order_id,
       p.gift_card_id,
       p.purpose,
       p.method,
       p.amount_eur,
       p.status,
       p.stripe_payment_intent_id,
       o.payment_status AS order_payment_status
     FROM payments p
     LEFT JOIN orders o ON o.id = p.order_id
     WHERE p.stripe_payment_intent_id = :stripe_payment_intent_id
     LIMIT 1`,
    { stripe_payment_intent_id: paymentIntentId },
  );
  return rows[0] || null;
}

export async function activatePaidGiftCard(paymentIntentId) {
  const rows = await query(
    `SELECT
      p.id AS payment_id,
      p.user_id,
      p.gift_card_id,
      gc.initial_balance_eur,
      gc.current_balance_eur,
      gc.reserved_balance_eur
     FROM payments p
     INNER JOIN gift_cards gc ON gc.id = p.gift_card_id
     WHERE p.stripe_payment_intent_id = :stripe_payment_intent_id
       AND p.purpose = 'gift_card_purchase'
       AND p.gift_card_id IS NOT NULL
     LIMIT 1`,
    { stripe_payment_intent_id: paymentIntentId },
  );
  const payment = rows[0];
  if (!payment) return null;

  await query(
    `UPDATE gift_cards
     SET status = IF(status = 'pending_payment', 'active', status),
       activated_at = COALESCE(activated_at, NOW()),
       assigned_at = COALESCE(assigned_at, NOW())
     WHERE id = :gift_card_id`,
    { gift_card_id: payment.gift_card_id },
  );

  return query(
    `INSERT INTO gift_card_transactions (
      transaction_reference,
      gift_card_id,
      payment_id,
      type,
      amount_eur,
      balance_before_eur,
      balance_after_eur,
      reserved_before_eur,
      reserved_after_eur,
      description,
      created_by
    )
    SELECT
      CONCAT('GCT-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 12))),
      :gift_card_id,
      :payment_id,
      'created',
      :amount_eur,
      0,
      :amount_eur,
      0,
      0,
      'Customer gift card purchase via Stripe',
      :user_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM gift_card_transactions
      WHERE gift_card_id = :gift_card_id
        AND type = 'created'
        AND payment_id = :payment_id
    )`,
    {
      amount_eur: payment.initial_balance_eur,
      gift_card_id: payment.gift_card_id,
      payment_id: payment.payment_id,
      user_id: payment.user_id,
    },
  );
}

export async function attachStripePaymentIntentToCheckoutSession(
  sessionId,
  paymentIntentId,
) {
  return query(
    `UPDATE payments
     SET stripe_payment_intent_id = :stripe_payment_intent_id
     WHERE stripe_checkout_session_id = :stripe_checkout_session_id
       AND stripe_payment_intent_id IS NULL`,
    {
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
    },
  );
}

export async function markStripePaymentFailed(paymentIntentId, message) {
  return transaction(async (connection) => {
    const [payments] = await connection.execute(
      `SELECT id, order_id
       FROM payments
       WHERE stripe_payment_intent_id = ?
       LIMIT 1
       FOR UPDATE`,
      [paymentIntentId],
    );
    const payment = payments[0] || null;

    await connection.execute(
      `UPDATE payments
       SET status = 'failed', failure_message = ?
       WHERE stripe_payment_intent_id = ?`,
      [message, paymentIntentId],
    );

    if (payment?.order_id) {
      await releaseOrderGiftCardReservations(
        payment.order_id,
        message || "Paiement Stripe echoue",
        connection,
      );
    }
  });
}

export async function markStripeEventProcessed(eventId) {
  return query(
    `UPDATE stripe_webhook_events
     SET status = 'processed', processed_at = NOW()
     WHERE stripe_event_id = :stripe_event_id`,
    { stripe_event_id: eventId },
  );
}

export default {
  listPayments,
  createPayment,
  completeOrderGiftCardReservations,
  releaseOrderGiftCardReservations,
  recordStripeEvent,
  markStripePaymentSucceeded,
  activatePaidGiftCard,
  findPaymentByCheckoutSession,
  findPaymentByIntent,
  attachStripePaymentIntentToCheckoutSession,
  markStripePaymentFailed,
  markStripeEventProcessed,
};
