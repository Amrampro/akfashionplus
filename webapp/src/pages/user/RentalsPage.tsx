import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";

type Rental = {
  order_item_id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  rental_start_date: string;
  rental_end_date: string;
  rental_days: number;
  rental_status: string;
  rental_price_per_day_eur: number;
  rental_deposit_eur: number;
  rental_late_fee_eur: number;
  rental_damage_fee_eur: number;
  line_total_eur: number;
  payment_status: string;
  order_status: string;
  fulfillment_type: string;
  beneficiary_name: string | null;
  ordered_at: string;
  image_url: string | null;
};

type RentalView = "upcoming" | "past" | "all";

const closedStatuses = new Set(["returned", "damaged", "lost", "cancelled"]);

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: string) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "-";
}

function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function isPastRental(rental: Rental) {
  return (
    closedStatuses.has(rental.rental_status) ||
    daysUntil(rental.rental_end_date) < 0
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "En cours",
    cancelled: "Annulee",
    damaged: "Retour avec dommage",
    lost: "Perdue",
    overdue: "En retard",
    ready_for_pickup: "Prete au retrait",
    reserved: "Reservee",
    return_due: "Retour attendu",
    returned: "Retournee",
  };
  return labels[status] || status;
}

export default function RentalsPage({ go }: { go: (page: string) => void }) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [view, setView] = useState<RentalView>("upcoming");
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

    get<Rental[]>("/rentals")
      .then((data) => {
        if (active) setRentals(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger vos locations.",
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

  const grouped = useMemo(() => {
    const upcoming = rentals
      .filter((rental) => !isPastRental(rental))
      .sort(
        (a, b) =>
          new Date(a.rental_start_date).getTime() -
          new Date(b.rental_start_date).getTime(),
      );
    const past = rentals
      .filter(isPastRental)
      .sort(
        (a, b) =>
          new Date(b.rental_end_date).getTime() -
          new Date(a.rental_end_date).getTime(),
      );
    return { all: [...upcoming, ...past], past, upcoming };
  }, [rentals]);

  const visibleRentals = grouped[view];
  const activeTotal = grouped.upcoming.reduce(
    (sum, rental) => sum + Number(rental.line_total_eur || 0),
    0,
  );

  return (
    <section className="user-rentals-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Locations</p>
          <h2>Mes vetements loues</h2>
          <p>
            Retrouvez les articles reserves, les dates de retrait, les dates de
            retour, le prix journalier et le montant total.
          </p>
        </div>
        <button onClick={() => go("rental")} type="button">
          Louer un article
        </button>
      </section>

      <section className="user-stat-grid">
        <article>
          <span>A venir</span>
          <strong>{loading ? "..." : grouped.upcoming.length}</strong>
          <small>Du plus proche au plus loin</small>
        </article>
        <article>
          <span>Passees</span>
          <strong>{loading ? "..." : grouped.past.length}</strong>
          <small>Historique des retours</small>
        </article>
        <article>
          <span>Total actif</span>
          <strong>{loading ? "..." : eur(activeTotal)}</strong>
          <small>Locations a venir/en cours</small>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head user-orders-toolbar">
          <h2>Calendrier location</h2>
          <div className="rental-tabs">
            {[
              ["upcoming", "A venir"],
              ["past", "Passees"],
              ["all", "Toutes"],
            ].map(([id, label]) => (
              <button
                className={view === id ? "active" : ""}
                key={id}
                onClick={() => setView(id as RentalView)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="user-alert">{error}</div>}
        {loading && <p className="user-muted">Chargement des locations...</p>}
        {!loading && visibleRentals.length === 0 && (
          <div className="user-empty-state">
            <h3>Aucune location trouvee</h3>
            <p>
              Les articles loues depuis ce compte apparaitront ici apres la
              commande.
            </p>
            <button onClick={() => go("rental")} type="button">
              Voir les articles a louer
            </button>
          </div>
        )}

        {!loading && visibleRentals.length > 0 && (
          <div className="rental-card-list">
            {visibleRentals.map((rental) => {
              const startsIn = daysUntil(rental.rental_start_date);
              const returnsIn = daysUntil(rental.rental_end_date);
              return (
                <article className="rental-card" key={rental.order_item_id}>
                  <div className="rental-card-media">
                    {rental.image_url ? (
                      <img src={rental.image_url} alt={rental.product_name} />
                    ) : (
                      <span>{rental.product_name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="rental-card-main">
                    <div>
                      <small>{rental.order_number}</small>
                      <h3>{rental.product_name}</h3>
                      <p>
                        {rental.size || "Taille unique"} -{" "}
                        {rental.color || rental.sku}
                      </p>
                    </div>
                    <div className="rental-card-dates">
                      <span>
                        Retrait
                        <strong>{date(rental.rental_start_date)}</strong>
                        <small>
                          {startsIn >= 0
                            ? `Dans ${startsIn} jour(s)`
                            : "Date passee"}
                        </small>
                      </span>
                      <span>
                        Retour
                        <strong>{date(rental.rental_end_date)}</strong>
                        <small>
                          {returnsIn >= 0
                            ? `Dans ${returnsIn} jour(s)`
                            : "Retour passe"}
                        </small>
                      </span>
                    </div>
                  </div>
                  <div className="rental-card-side">
                    <span
                      className={`user-status status-${rental.rental_status}`}
                    >
                      {statusLabel(rental.rental_status)}
                    </span>
                    <strong>{eur(rental.line_total_eur)}</strong>
                    <small>
                      {rental.rental_days} jour(s) x{" "}
                      {eur(rental.rental_price_per_day_eur)} / jour
                    </small>
                    {Number(rental.rental_deposit_eur || 0) > 0 && (
                      <small>Depot : {eur(rental.rental_deposit_eur)}</small>
                    )}
                    <small>Paiement : {rental.payment_status}</small>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
