import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";

type UserOrder = {
  id: number;
  order_number: string;
  status: string;
  fulfillment_type: string;
  total_eur: number;
  total_aoa: number;
  created_at: string;
};

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: string) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "-";
}

export default function UserDashboardPage({
  go,
}: {
  go: (page: string) => void;
}) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    get<UserOrder[]>("/orders?limit=5")
      .then((data) => {
        if (active) setOrders(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger le tableau de bord.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((order) =>
      ["paid", "completed"].includes(order.status),
    ).length;
    const active = orders.filter(
      (order) => !["completed", "cancelled", "refunded"].includes(order.status),
    ).length;
    const total = orders.reduce(
      (sum, order) => sum + Number(order.total_eur || 0),
      0,
    );
    return [
      ["Commandes", String(orders.length), "Total recent"],
      ["En cours", String(active), "A suivre"],
      ["Payees", String(paid), "Confirmees"],
      ["Depenses", eur(total), "Sur les dernieres commandes"],
    ];
  }, [orders]);

  return (
    <section className="user-dashboard-page">
      <section className="user-welcome-panel">
        <div>
          <p className="eyebrow">Apercu</p>
          <h2>Votre activite AK Fashion Plus</h2>
          <p>
            Suivez vos commandes, vos locations, vos cartes cadeaux et vos
            favoris depuis votre espace personnel.
          </p>
        </div>
        <button onClick={() => go("shop")} type="button">
          Retourner a la boutique
        </button>
      </section>

      {error && <div className="user-alert">{error}</div>}

      <section className="user-stat-grid">
        {stats.map(([label, value, helper]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{loading ? "..." : value}</strong>
            <small>{helper}</small>
          </article>
        ))}
      </section>

      <section className="user-dashboard-grid">
        <article className="user-panel">
          <div className="user-panel-head">
            <h2>Dernieres commandes</h2>
            <button onClick={() => go("user-orders")} type="button">
              Voir tout
            </button>
          </div>
          {loading && <p className="user-muted">Chargement des commandes...</p>}
          {!loading && orders.length === 0 && (
            <p className="user-muted">
              Aucune commande trouvee pour ce compte.
            </p>
          )}
          {!loading &&
            orders.map((order) => (
              <div className="user-order-row" key={order.id}>
                <div>
                  <strong>{order.order_number}</strong>
                  <small>
                    {date(order.created_at)} - {order.fulfillment_type}
                  </small>
                </div>
                <span className={`user-status status-${order.status}`}>
                  {order.status}
                </span>
                <b>{eur(order.total_eur)}</b>
              </div>
            ))}
        </article>

        <article className="user-panel user-next-panel">
          <h2>Actions rapides</h2>
          <button onClick={() => go("user-orders")} type="button">
            Suivre mes commandes
          </button>
          <button onClick={() => go("user-gift-cards")} type="button">
            Mes cartes cadeaux
          </button>
          <button onClick={() => go("user-profile")} type="button">
            Modifier mon profil
          </button>
        </article>
      </section>
    </section>
  );
}
