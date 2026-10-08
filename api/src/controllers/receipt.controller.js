import { fail } from "../utils/apiResponse.js";
import { query } from "../config/database.js";
import { sendPdf } from "../utils/pdf.js";
import { receiptLanguage, receiptLocale } from "../utils/receiptLocale.js";

function staffOnly(req, res) {
  if (!["admin", "cashier"].includes(req.user.role)) {
    fail(res, 403, "Access denied");
    return false;
  }
  return true;
}

async function currencyLabel() {
  const rows = await query(
    "SELECT setting_value FROM settings WHERE setting_key = 'display_currency' LIMIT 1",
  );
  return rows[0]?.setting_value || "AOA";
}

async function orderReceipt(orderId, language) {
  const { t, value, eur, aoa, date } = receiptLocale(language);
  const rows = await query(
    `SELECT o.*,
      CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
      u.email AS customer_email,
      b.name AS branch_name,
      b.city AS branch_city
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN branches b ON b.id = o.branch_id
     WHERE o.id = :id
     LIMIT 1`,
    { id: orderId },
  );
  const order = rows[0];
  if (!order) return null;

  const items = await query(
    `SELECT product_name, sku, item_type, quantity, unit_price_eur, line_total_eur,
      rental_start_date, rental_end_date, rental_days
     FROM order_items
     WHERE order_id = :id
     ORDER BY id ASC`,
    { id: orderId },
  );
  const payments = await query(
    `SELECT method, purpose, amount_eur, status, created_at
     FROM payments
     WHERE order_id = :id
     ORDER BY id ASC`,
    { id: orderId },
  );
  const currency = await currencyLabel();
  const mode =
    order.fulfillment_type === "delivery" ? t("deliveryItem") : t("pickupItem");

  return {
    filename: `recu-commande-${order.order_number}.pdf`,
    title: `${t("receipt")} - ${t("order")}`,
    language,
    status: order.payment_status,
    lines: [
      `${t("reference")}: ${order.order_number}`,
      `${t("type")}: ${mode}`,
      `${t("customer")}: ${order.customer_name} - ${order.customer_email}`,
      `${t("beneficiary")}: ${order.beneficiary_name || "-"} - ${order.beneficiary_phone || "-"}`,
      `${t("address")}: ${[order.shipping_address_line_1, order.shipping_address_line_2, order.shipping_city, order.shipping_postal_code, order.shipping_country_code].filter(Boolean).join(", ") || "-"}`,
      `${t("branch")}: ${order.branch_name || "-"} ${order.branch_city || ""}`,
      `${t("date")}: ${date(order.created_at)}`,
      `${t("payment")}: ${value(order.payment_status)} / ${t("status")}: ${value(order.status)}`,
      `${t("subtotal")}: ${eur(order.subtotal_eur)}`,
      `${t("delivery")}: ${eur(order.shipping_total_eur)}`,
      `${t("discount")}: ${eur(order.discount_total_eur)}`,
      `${t("total")}: ${eur(order.total_eur)} - ${aoa(order.total_aoa, currency)}`,
      "",
      t("items"),
      ...items.map((item) => {
        const rental =
          item.item_type === "rental"
            ? ` - ${t("rental")} ${item.rental_days || 0} ${t("dayUnit")}, ${t("from")} ${date(item.rental_start_date, true)} ${t("to")} ${date(item.rental_end_date, true)}`
            : "";
        return `${item.quantity} x ${item.product_name} (${item.sku || "-"}) - ${eur(item.line_total_eur)}${rental}`;
      }),
      "",
      t("payments"),
      ...(payments.length
        ? payments.map(
            (payment) =>
              `${value(payment.method)} / ${value(payment.purpose)} - ${eur(payment.amount_eur)} - ${value(payment.status)} - ${date(payment.created_at)}`,
          )
        : [t("noPayments")]),
    ],
  };
}

async function rentalReceipt(orderItemId, language) {
  const { t, value, eur, aoa, date } = receiptLocale(language);
  const rows = await query(
    `SELECT oi.*, o.order_number, o.created_at, o.payment_status,
      o.beneficiary_name, o.beneficiary_phone,
      CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
      u.email AS customer_email,
      b.name AS branch_name,
      b.city AS branch_city
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN branches b ON b.id = o.branch_id
     WHERE oi.id = :id AND oi.item_type = 'rental'
     LIMIT 1`,
    { id: orderItemId },
  );
  const rental = rows[0];
  if (!rental) return null;

  return {
    filename: `recu-location-${rental.order_number}-${rental.id}.pdf`,
    title: `${t("receipt")} - ${t("rental")}`,
    language,
    status: rental.payment_status,
    lines: [
      `${t("reference")}: ${rental.order_number}`,
      `${t("type")}: ${t("rentalItem")}`,
      `${t("customer")}: ${rental.customer_name} - ${rental.customer_email}`,
      `${t("beneficiary")}: ${rental.beneficiary_name || "-"} - ${rental.beneficiary_phone || "-"}`,
      `${t("item")}: ${rental.product_name} (${rental.sku || "-"})`,
      `${t("variant")}: ${rental.size || "-"} / ${rental.color || "-"}`,
      `${t("start")}: ${date(rental.rental_start_date, true)}`,
      `${t("return")}: ${date(rental.rental_end_date, true)}`,
      `${t("days")}: ${rental.rental_days || 0}`,
      `${t("dailyPrice")}: ${eur(rental.rental_price_per_day_eur)}`,
      `${t("deposit")}: ${eur(rental.rental_deposit_eur)}`,
      `${t("rentalTotal")}: ${eur(rental.line_total_eur)}`,
      `${t("branch")}: ${rental.branch_name || "-"} ${rental.branch_city || ""}`,
      `${t("payment")}: ${value(rental.payment_status)}`,
      `${t("rentalStatus")}: ${value(rental.rental_status)}`,
      `${t("orderDate")}: ${date(rental.created_at)}`,
    ],
  };
}

async function resaleReceipt(resaleId, language) {
  const { t, value, eur, aoa, date } = receiptLocale(language);
  const rows = await query(
    `SELECT cr.*, o.order_number, o.created_at,
      oi.product_name, oi.sku, oi.size, oi.color,
      CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
      u.email AS customer_email,
      b.name AS branch_name,
      b.city AS branch_city,
      CONCAT(cashier.first_name, ' ', cashier.last_name) AS cashier_name
     FROM company_resales cr
     INNER JOIN order_items oi ON oi.id = cr.order_item_id
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN users u ON u.id = cr.user_id
     LEFT JOIN branches b ON b.id = cr.branch_id
     LEFT JOIN users cashier ON cashier.id = cr.cashier_id
     WHERE cr.id = :id
     LIMIT 1`,
    { id: resaleId },
  );
  const resale = rows[0];
  if (!resale) return null;
  const currency = await currencyLabel();

  return {
    filename: `recu-revente-${resale.order_number}-${resale.id}.pdf`,
    title: `${t("receipt")} - ${t("resale")}`,
    language,
    status: resale.status,
    lines: [
      `${t("reference")}: ${resale.order_number}`,
      `${t("type")}: ${t("resalePayout")}`,
      `${t("customer")}: ${resale.customer_name} - ${resale.customer_email}`,
      `${t("beneficiary")}: ${resale.beneficiary_name || "-"} - ${resale.beneficiary_phone || "-"}`,
      `${t("item")}: ${resale.product_name} (${resale.sku || "-"})`,
      `${t("variant")}: ${resale.size || "-"} / ${resale.color || "-"}`,
      `${t("eurValue")}: ${eur(resale.amount_eur)}`,
      `${t("rate")}: 1 EUR = ${Number(resale.exchange_rate_eur_to_aoa || 0)} ${currency}`,
      `${t("payout")}: ${aoa(resale.payout_amount_aoa, currency)}`,
      `${t("branch")}: ${resale.branch_name || "-"} ${resale.branch_city || ""}`,
      `${t("cashier")}: ${resale.cashier_name || "-"}`,
      `${t("document")}: ${resale.identity_document_type || "-"} ${resale.identity_document_number || ""}`,
      `${t("status")}: ${value(resale.status)}`,
      `${t("requestedAt")}: ${date(resale.requested_at)}`,
      `${t("payment")}: ${date(resale.paid_at)}`,
    ],
  };
}

export async function downloadReceipt(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 422, "Invalid receipt id");
  }

  if (req.user.role === "user" && req.params.type === "order") {
    const owned = await query("SELECT id FROM orders WHERE id = :id AND user_id = :user_id", { id, user_id: req.user.id });
    if (!owned.length) return fail(res, 404, "Receipt not found");
  } else if (!staffOnly(req, res)) return;
  const builders = {
    order: orderReceipt,
    rental: rentalReceipt,
    resale: resaleReceipt,
  };
  const builder = builders[req.params.type];
  if (!builder) return fail(res, 404, "Receipt type not found");

  const payload = await builder(id, receiptLanguage(req));
  if (!payload) return fail(res, 404, "Receipt not found");

  return sendPdf(res, payload.filename, payload);
}
