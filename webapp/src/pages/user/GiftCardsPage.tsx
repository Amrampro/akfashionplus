import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";

type UserGiftCard = {
  id: number;
  owner_user_id: number;
  serial_number: string;
  card_name: string;
  card_code: string;
  initial_balance_eur: number;
  current_balance_eur: number;
  reserved_balance_eur: number;
  available_balance_eur: number;
  status: string;
  expires_at: string | null;
  created_at: string;
};

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "-";
}

function maskSerial(value: string) {
  if (!value) return "GC-XXXX";
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Active",
    blocked: "Bloquee",
    cancelled: "Annulee",
    expired: "Expiree",
    fully_used: "Utilisee",
    pending_payment: "Paiement en attente",
    unassigned: "Non assignee",
  };
  return labels[status] || status;
}

export default function UserGiftCardsPage({
  go,
}: {
  go: (page: string) => void;
}) {
  const [cards, setCards] = useState<UserGiftCard[]>([]);
  const [status, setStatus] = useState("all");
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

    const query =
      status === "all" ? "/gift-cards" : `/gift-cards?status=${status}`;
    get<UserGiftCard[]>(query)
      .then((data) => {
        if (active) setCards(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger vos cartes cadeaux.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  const totals = useMemo(() => {
    return cards.reduce(
      (sum, card) => ({
        available: sum.available + Number(card.available_balance_eur || 0),
        current: sum.current + Number(card.current_balance_eur || 0),
        initial: sum.initial + Number(card.initial_balance_eur || 0),
        reserved: sum.reserved + Number(card.reserved_balance_eur || 0),
      }),
      { available: 0, current: 0, initial: 0, reserved: 0 },
    );
  }, [cards]);

  return (
    <section className="user-giftcards-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Cartes cadeaux</p>
          <h2>Mes cartes cadeaux</h2>
          <p>
            Consultez vos cartes AK Fashion Plus avec leur solde initial, solde
            courant, montant reserve et solde disponible.
          </p>
        </div>
        <button onClick={() => go("gift-cards")} type="button">
          Acheter une carte cadeau
        </button>
      </section>

      <section className="user-stat-grid">
        <article>
          <span>Cartes</span>
          <strong>{loading ? "..." : cards.length}</strong>
          <small>Filtre courant</small>
        </article>
        <article>
          <span>Solde initial</span>
          <strong>{loading ? "..." : eur(totals.initial)}</strong>
          <small>Valeur chargee</small>
        </article>
        <article>
          <span>Solde courant</span>
          <strong>{loading ? "..." : eur(totals.current)}</strong>
          <small>Avant reservations</small>
        </article>
        <article>
          <span>Disponible</span>
          <strong>{loading ? "..." : eur(totals.available)}</strong>
          <small>Utilisable au paiement</small>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head user-orders-toolbar">
          <h2>Portefeuille cartes cadeaux</h2>
          <select
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="pending_payment">Paiement en attente</option>
            <option value="fully_used">Utilisees</option>
            <option value="blocked">Bloquees</option>
            <option value="expired">Expirees</option>
            <option value="cancelled">Annulees</option>
          </select>
        </div>

        {error && <div className="user-alert">{error}</div>}
        {loading && <p className="user-muted">Chargement des cartes...</p>}
        {!loading && cards.length === 0 && (
          <div className="user-empty-state">
            <h3>Aucune carte cadeau trouvee</h3>
            <p>
              Les cartes achetees ou recues apparaitront ici apres confirmation
              du paiement Stripe.
            </p>
            <button onClick={() => go("gift-cards")} type="button">
              Acheter une carte cadeau
            </button>
          </div>
        )}

        {!loading && cards.length > 0 && (
          <div className="user-giftcard-grid">
            {cards.map((card, index) => (
              <article className="user-giftcard-card" key={card.id}>
                <div
                  className={`user-giftcard-visual tone-${index % 3}`}
                  aria-label={card.card_name}
                >
                  <div>
                    <span>AK</span>
                    <small>Fashion Plus</small>
                  </div>
                  <strong>{card.card_name}</strong>
                  <p>{maskSerial(card.serial_number)}</p>
                  <b>{eur(card.available_balance_eur)}</b>
                </div>
                <div className="user-giftcard-info">
                  <div>
                    <small>{card.card_code}</small>
                    <h3>{card.card_name}</h3>
                  </div>
                  <span className={`user-status status-${card.status}`}>
                    {statusLabel(card.status)}
                  </span>
                  <dl>
                    <div>
                      <dt>Solde initial</dt>
                      <dd>{eur(card.initial_balance_eur)}</dd>
                    </div>
                    <div>
                      <dt>Solde courant</dt>
                      <dd>{eur(card.current_balance_eur)}</dd>
                    </div>
                    <div>
                      <dt>Reserve</dt>
                      <dd>{eur(card.reserved_balance_eur)}</dd>
                    </div>
                    <div>
                      <dt>Disponible</dt>
                      <dd>{eur(card.available_balance_eur)}</dd>
                    </div>
                  </dl>
                  <small>Expire le : {date(card.expires_at)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
