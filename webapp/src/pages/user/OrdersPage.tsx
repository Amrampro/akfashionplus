import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";
import { getDisplayCurrency } from "../../utils/currency";

type UserOrder = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  total_eur: number;
  total_aoa: number;
  beneficiary_name: string | null;
  resale_items_count: number;
  resale_payout_amount_aoa: number;
  resale_statuses: string | null;
  created_at: string;
};

const statuses = [
  ["all", "Toutes"],
  ["pending_payment", "Paiement attendu"],
  ["confirmed", "Confirmees"],
  ["processing", "En preparation"],
  ["ready_for_pickup", "Pretes"],
  ["completed", "Terminees"],
  ["cancelled", "Annulees"],
];

const paymentStatuses = [
  ["all", "Tous les paiements"],
  ["unpaid", "Non payees"],
  ["paid", "Payees"],
  ["failed", "Echouees"],
];

const fulfillmentTypes = [
  ["all", "Tous les modes"],
  ["delivery", "Livraison"],
  ["pickup", "Retrait guichet"],
];

const resaleFilters = [
  ["all", "Toutes"],
  ["resale", "Avec revente"],
  ["standard", "Sans revente"],
];

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function aoa(value: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} ${getDisplayCurrency()}`;
}

function date(value: string) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "-";
}

export default function OrdersPage({ go }: { go: (page: string) => void }) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [fulfillmentType, setFulfillmentType] = useState("all");
  const [resaleFilter, setResaleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });
    const params = new URLSearchParams({ limit: "100" });
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("payment_status", paymentStatus);
    if (fulfillmentType !== "all")
      params.set("fulfillment_type", fulfillmentType);

    get<UserOrder[]>(`/orders?${params.toString()}`)
      .then((data) => {
        if (active) setOrders(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger vos commandes.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fulfillmentType, paymentStatus, query, status]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const hasResale = Number(order.resale_items_count || 0) > 0;
      if (resaleFilter === "resale") return hasResale;
      if (resaleFilter === "standard") return !hasResale;
      return true;
    });
  }, [orders, resaleFilter]);

  const total = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) => sum + Number(order.total_eur || 0),
        0,
      ),
    [filteredOrders],
  );
  const resaleTotal = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) => sum + Number(order.resale_payout_amount_aoa || 0),
        0,
      ),
    [filteredOrders],
  );

  return (
    <section className="user-orders-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Commandes</p>
          <h2>Mes commandes</h2>
          <p>Suivez vos achats, paiements, livraisons et retraits guichet.</p>
        </div>
        <button onClick={() => go("shop")} type="button">
          Nouvelle commande
        </button>
      </section>

      <section className="user-order-summary">
        <article>
          <span>Commandes affichees</span>
          <strong>{loading ? "..." : filteredOrders.length}</strong>
        </article>
        <article>
          <span>Total EUR</span>
          <strong>{loading ? "..." : eur(total)}</strong>
        </article>
        <article>
          <span>Revente a recuperer</span>
          <strong>{loading ? "..." : aoa(resaleTotal)}</strong>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head user-orders-toolbar">
          <h2>Historique</h2>
          <div className="user-orders-filters">
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Reference, beneficiaire, telephone..."
              type="search"
              value={query}
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statuses.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              {paymentStatuses.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={fulfillmentType}
              onChange={(event) => setFulfillmentType(event.target.value)}
            >
              {fulfillmentTypes.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={resaleFilter}
              onChange={(event) => setResaleFilter(event.target.value)}
            >
              {resaleFilters.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="user-alert">{error}</div>}
        {loading && <p className="user-muted">Chargement des commandes...</p>}
        {!loading && filteredOrders.length === 0 && (
          <div className="user-empty-state">
            <h3>Aucune commande trouvee</h3>
            <p>
              Les commandes de ce compte apparaitront ici apres validation du
              panier.
            </p>
            <button onClick={() => go("shop")} type="button">
              Aller a la boutique
            </button>
          </div>
        )}
        {!loading && filteredOrders.length > 0 && (
          <div className="user-orders-table">
            <div className="user-orders-header">
              <span>Reference</span>
              <span>Date</span>
              <span>Beneficiaire</span>
              <span>Statut</span>
              <span>Total</span>
              <span>Action</span>
            </div>
            {filteredOrders.map((order) => (
              <article key={order.id}>
                <div>
                  <strong>{order.order_number}</strong>
                  <small>{order.fulfillment_type}</small>
                  {Number(order.resale_items_count || 0) > 0 && (
                    <small className="user-resale-badge">
                      Revente AK - {aoa(order.resale_payout_amount_aoa)}
                    </small>
                  )}
                </div>
                <span>{date(order.created_at)}</span>
                <span>{order.beneficiary_name || "Compte client"}</span>
                <span className={`user-status status-${order.status}`}>
                  {order.status}
                  {order.resale_statuses && (
                    <small>Revente: {order.resale_statuses}</small>
                  )}
                </span>
                <div>
                  <strong>{eur(order.total_eur)}</strong>
                  <small>{aoa(order.total_aoa)}</small>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem("ak_selected_order_id", String(order.id));
                    go("user-order-details");
                  }}
                  type="button"
                >
                  Details
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
