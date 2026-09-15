import { fail } from "../utils/apiResponse.js";
import { query } from "../config/database.js";
import { sendPdf } from "../utils/pdf.js";

function eur(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

function aoa(value, currency = "AOA") {
  return `${Math.round(Number(value || 0)).toLocaleString("fr-FR")} ${currency}`;
}

function date(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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

async function orderReceipt(orderId) {
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
    order.fulfillment_type === "delivery" ? "Livraison article" : "Retrait article";

  return {
    filename: `recu-commande-${order.order_number}.pdf`,
    title: "Recu AK Fashion Plus - Commande",
    lines: [
      `Reference: ${order.order_number}`,
      `Type: ${mode}`,
      `Client: ${order.customer_name} - ${order.customer_email}`,
      `Beneficiaire: ${order.beneficiary_name || "-"} - ${order.beneficiary_phone || "-"}`,
      `Guichet: ${order.branch_name || "-"} ${order.branch_city || ""}`,
      `Date: ${date(order.created_at)}`,
      `Paiement: ${order.payment_status || "-"} / Statut: ${order.status || "-"}`,
      `Sous-total: ${eur(order.subtotal_eur)}`,
      `Livraison: ${eur(order.shipping_total_eur)}`,
      `Total: ${eur(order.total_eur)} - ${aoa(order.total_aoa, currency)}`,
      "",
      "Articles",
      ...items.map((item) => {
        const rental =
          item.item_type === "rental"
            ? ` - location ${item.rental_days || 0} jour(s), du ${item.rental_start_date || "-"} au ${item.rental_end_date || "-"}`
            : "";
        return `${item.quantity} x ${item.product_name} (${item.sku || "-"}) - ${eur(item.line_total_eur)}${rental}`;
      }),
      "",
      "Paiements",
      ...(payments.length
        ? payments.map(
            (payment) =>
              `${payment.method} / ${payment.purpose} - ${eur(payment.amount_eur)} - ${payment.status} - ${date(payment.created_at)}`,
          )
        : ["Aucun paiement detaille."]),
    ],
  };
}

async function rentalReceipt(orderItemId) {
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
    title: "Recu AK Fashion Plus - Location",
    lines: [
      `Reference: ${rental.order_number}`,
      "Type: Location article",
      `Client: ${rental.customer_name} - ${rental.customer_email}`,
      `Beneficiaire: ${rental.beneficiary_name || "-"} - ${rental.beneficiary_phone || "-"}`,
      `Article: ${rental.product_name} (${rental.sku || "-"})`,
      `Variante: ${rental.size || "-"} / ${rental.color || "-"}`,
      `Depart: ${rental.rental_start_date || "-"}`,
      `Retour prevu: ${rental.rental_end_date || "-"}`,
      `Nombre de jours: ${rental.rental_days || 0}`,
      `Prix/jour: ${eur(rental.rental_price_per_day_eur)}`,
      `Caution: ${eur(rental.rental_deposit_eur)}`,
      `Total location: ${eur(rental.line_total_eur)}`,
      `Guichet: ${rental.branch_name || "-"} ${rental.branch_city || ""}`,
      `Paiement: ${rental.payment_status || "-"}`,
      `Statut location: ${rental.rental_status || "-"}`,
      `Date commande: ${date(rental.created_at)}`,
    ],
  };
}

async function resaleReceipt(resaleId) {
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
    title: "Recu AK Fashion Plus - Revente",
    lines: [
      `Reference: ${resale.order_number}`,
      "Type: Retrait argent revente AK",
      `Client: ${resale.customer_name} - ${resale.customer_email}`,
      `Beneficiaire: ${resale.beneficiary_name || "-"} - ${resale.beneficiary_phone || "-"}`,
      `Article: ${resale.product_name} (${resale.sku || "-"})`,
      `Variante: ${resale.size || "-"} / ${resale.color || "-"}`,
      `Valeur EUR: ${eur(resale.amount_eur)}`,
      `Taux: 1 EUR = ${Number(resale.exchange_rate_eur_to_aoa || 0)} ${currency}`,
      `Montant retire equivalent: ${aoa(resale.payout_amount_aoa, currency)}`,
      `Guichet: ${resale.branch_name || "-"} ${resale.branch_city || ""}`,
      `Caissier: ${resale.cashier_name || "-"}`,
      `Document: ${resale.identity_document_type || "-"} ${resale.identity_document_number || ""}`,
      `Statut: ${resale.status || "-"}`,
      `Demande: ${date(resale.requested_at)}`,
      `Paiement: ${date(resale.paid_at)}`,
    ],
  };
}

export async function downloadReceipt(req, res) {
  if (!staffOnly(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 422, "Invalid receipt id");
  }

  const builders = {
    order: orderReceipt,
    rental: rentalReceipt,
    resale: resaleReceipt,
  };
  const builder = builders[req.params.type];
  if (!builder) return fail(res, 404, "Receipt type not found");

  const payload = await builder(id);
  if (!payload) return fail(res, 404, "Receipt not found");

  return sendPdf(res, payload.filename, payload);
}
