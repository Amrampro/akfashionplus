import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";
import { formatAoa, formatEur } from "../../utils/currency";

type OrderItem = {
  id: number;
  product_name: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  item_type: string;
  unit_price_eur: number;
  line_total_eur: number;
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_days: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number | null;
  resell_to_company: number | boolean;
  image_url: string;
  image_alt_text: string;
  resale_id: number | null;
  resale_amount_eur: number | null;
  resale_exchange_rate_eur_to_aoa: number | null;
  resale_payout_amount_aoa: number | null;
  resale_beneficiary_name: string | null;
  resale_beneficiary_phone: string | null;
  resale_status: string | null;
  resale_requested_at: string | null;
  resale_approved_at: string | null;
  resale_paid_at: string | null;
  resale_identity_document_type: string | null;
  resale_identity_document_number: string | null;
  resale_notes: string | null;
  resale_branch_name: string | null;
  resale_branch_city: string | null;
  resale_cashier_name: string | null;
};

type Payment = {
  id: number;
  provider: string;
  type: string;
  status: string;
  amount_eur: number;
  amount_aoa: number;
  transaction_reference: string | null;
  created_at: string;
};

type HistoryItem = {
  id: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
};

type UserOrderDetails = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  subtotal_eur: number;
  shipping_eur: number;
  total_eur: number;
  total_aoa: number;
  exchange_rate_eur_to_aoa: number;
  beneficiary_name: string | null;
  beneficiary_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
  history: HistoryItem[];
};

const orderStatusLabels: Record<string, string> = {
  pending_payment: "Paiement attendu",
  confirmed: "Confirmee",
  processing: "En preparation",
  ready_for_pickup: "Prete au retrait",
  shipped: "Expediee",
  completed: "Terminee",
  cancelled: "Annulee",
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Non payee",
  paid: "Payee",
  failed: "Echouee",
  refunded: "Remboursee",
};

const resaleStatusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvee",
  ready_for_payout: "Prete paiement",
  paid: "Recuperee / payee",
  rejected: "Refusee",
  cancelled: "Annulee",
};

function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateOnly(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function label(map: Record<string, string>, value: string | null | undefined) {
  return value ? map[value] || value : "-";
}

export default function OrderDetailsPage({ go }: { go: (page: string) => void }) {
  const [selectedOrderId] = useState(() =>
    localStorage.getItem("ak_selected_order_id"),
  );
  const [order, setOrder] = useState<UserOrderDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(selectedOrderId));
  const [error, setError] = useState(
    selectedOrderId ? "" : "Aucune commande selectionnee.",
  );

  useEffect(() => {
    if (!selectedOrderId) return;

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });
    get<UserOrderDetails>(`/orders/${selectedOrderId}`)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  const resaleItems = useMemo(
    () => order?.items.filter((item) => item.resale_id) || [],
    [order],
  );

  const resaleTotal = useMemo(
    () =>
      resaleItems.reduce(
        (sum, item) => sum + Number(item.resale_payout_amount_aoa || 0),
        0,
      ),
    [resaleItems],
  );

  if (loading) {
    return <p className="user-muted">Chargement de la commande...</p>;
  }

  if (error || !order) {
    return (
      <section className="user-panel">
        <div className="user-empty-state">
          <h3>Commande introuvable</h3>
          <p>{error || "Impossible d'afficher cette commande."}</p>
          <button onClick={() => go("user-orders")} type="button">
            Retour aux commandes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="user-order-details-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Commande</p>
          <h2>{order.order_number}</h2>
          <p>
            Commande creee le {dateTime(order.created_at)} -{" "}
            {label(orderStatusLabels, order.status)}.
          </p>
        </div>
        <button onClick={() => go("user-orders")} type="button">
          Retour aux commandes
        </button>
      </section>

      <section className="user-order-summary">
        <article>
          <span>Total paye</span>
          <strong>{formatEur(order.total_eur)}</strong>
          <small>{formatAoa(order.total_aoa)}</small>
        </article>
        <article>
          <span>Paiement</span>
          <strong>{label(paymentStatusLabels, order.payment_status)}</strong>
        </article>
        <article>
          <span>Revente AK</span>
          <strong>{resaleItems.length ? formatAoa(resaleTotal) : "-"}</strong>
          <small>{resaleItems.length} article(s)</small>
        </article>
      </section>

      <section className="user-detail-grid">
        <article className="user-panel">
          <p className="eyebrow">Beneficiaire</p>
          <h3>{order.beneficiary_name || "Compte client"}</h3>
          <p>{order.beneficiary_phone || "Telephone non renseigne"}</p>
          <p>
            {order.fulfillment_type === "delivery"
              ? [
                  order.shipping_address_line_1,
                  order.shipping_city,
                  order.shipping_province,
                ]
                  .filter(Boolean)
                  .join(", ") || "Adresse non renseignee"
              : "Retrait au guichet"}
          </p>
        </article>

        <article className="user-panel">
          <p className="eyebrow">Resume paiement</p>
          <div className="user-money-list">
            <span>Sous-total</span>
            <strong>{formatEur(order.subtotal_eur)}</strong>
            <span>Livraison</span>
            <strong>{formatEur(order.shipping_eur)}</strong>
            <span>Total</span>
            <strong>{formatEur(order.total_eur)}</strong>
            <span>Taux</span>
            <strong>1 EUR = {formatAoa(order.exchange_rate_eur_to_aoa)}</strong>
          </div>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head">
          <h2>Articles</h2>
          <strong>{order.items.length}</strong>
        </div>
        <div className="user-order-items">
          {order.items.map((item) => (
            <article key={item.id} className="user-order-item-card">
              {item.image_url ? (
                <img alt={item.image_alt_text || item.product_name} src={item.image_url} />
              ) : (
                <i>{item.product_name.slice(0, 2)}</i>
              )}
              <div>
                <strong>{item.product_name}</strong>
                <small>
                  {item.item_type === "rental" ? "Location" : "Achat"} -{" "}
                  {item.quantity} x {formatEur(item.unit_price_eur)}
                </small>
                <small>
                  {item.size || "-"} / {item.color || "-"} / {item.sku || "-"}
                </small>
                {item.item_type === "rental" && (
                  <small>
                    Du {dateOnly(item.rental_start_date)} au{" "}
                    {dateOnly(item.rental_end_date)} - {item.rental_days || 0} jour(s)
                  </small>
                )}
              </div>
              <strong>{formatEur(item.line_total_eur)}</strong>
              {item.resale_id && (
                <div className="user-resale-card">
                  <span>Revente AK Fashion Plus</span>
                  <strong>{formatAoa(item.resale_payout_amount_aoa)}</strong>
                  <small>Valeur article: {formatEur(item.resale_amount_eur)}</small>
                  <small>
                    Beneficiaire: {item.resale_beneficiary_name || order.beneficiary_name || "-"}
                  </small>
                  <small>Telephone: {item.resale_beneficiary_phone || "-"}</small>
                  <small>
                    Guichet: {[item.resale_branch_name, item.resale_branch_city]
                      .filter(Boolean)
                      .join(" - ") || "-"}
                  </small>
                  <small>Statut: {label(resaleStatusLabels, item.resale_status)}</small>
                  <small>Caissier: {item.resale_cashier_name || "-"}</small>
                  <small>Demande: {dateTime(item.resale_requested_at)}</small>
                  <small>Paiement: {dateTime(item.resale_paid_at)}</small>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="user-detail-grid">
        <article className="user-panel">
          <div className="user-panel-head">
            <h2>Paiements</h2>
            <strong>{order.payments.length}</strong>
          </div>
          {order.payments.length ? (
            <div className="user-simple-list">
              {order.payments.map((payment) => (
                <article key={payment.id}>
                  <strong>{payment.provider}</strong>
                  <span>{label(paymentStatusLabels, payment.status)}</span>
                  <small>{payment.type}</small>
                  <small>{payment.transaction_reference || "-"}</small>
                  <b>{formatEur(payment.amount_eur)}</b>
                </article>
              ))}
            </div>
          ) : (
            <p className="user-muted">Aucun paiement enregistre.</p>
          )}
        </article>

        <article className="user-panel">
          <div className="user-panel-head">
            <h2>Historique</h2>
            <strong>{order.history.length}</strong>
          </div>
          {order.history.length ? (
            <div className="user-simple-list">
              {order.history.map((entry) => (
                <article key={entry.id}>
                  <strong>{label(orderStatusLabels, entry.new_status)}</strong>
                  <span>{dateTime(entry.created_at)}</span>
                  <small>{entry.notes || "Mise a jour de statut"}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="user-muted">Aucun historique disponible.</p>
          )}
        </article>
      </section>
    </section>
  );
}
