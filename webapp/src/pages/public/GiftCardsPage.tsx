import { useEffect, useState } from "react";
import { appConfig } from "../../config/app";
import { useLanguage } from "../../hooks/useLanguage";

type GiftCardType = {
  id: number;
  name: string;
  code: string;
  value_eur: number;
  description: string | null;
  image_url: string | null;
  status: "active" | "inactive";
};
type BalanceResult = {
  serial_number: string;
  card_name: string;
  current_balance_eur: number;
  reserved_balance_eur: number;
  available_balance_eur: number;
  status: string;
};

const API_URL = appConfig.apiUrl;

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function GiftCardsPage({ go }: { go: (page: string) => void }) {
  const { language } = useLanguage();
  const [cards, setCards] = useState<GiftCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serial, setSerial] = useState("");
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [balanceError, setBalanceError] = useState("");
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [buyingCardId, setBuyingCardId] = useState<number | null>(null);

  const heroCards = cards.slice(0, 3);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });

    fetch(`${API_URL}/gift-card-types?lang=${language}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success === false)
          throw new Error(payload.message || "Cartes cadeaux indisponibles");
        setCards(payload.data || []);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setCards([]);
        setError(
          "Impossible de charger les cartes cadeaux depuis la base de donnees. Verifiez que l'API est lancee.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [language]);

  async function checkBalance() {
    const value = serial.trim();
    setBalance(null);
    setBalanceError("");
    if (!value) {
      setBalanceError("Entrez un numero de carte cadeau.");
      return;
    }

    setCheckingBalance(true);
    try {
      const response = await fetch(
        `${API_URL}/gift-cards/balance/${encodeURIComponent(value)}`,
      );
      const payload = await response.json();
      if (!response.ok || payload.success === false)
        throw new Error(payload.message || "Carte introuvable");
      setBalance(payload.data);
    } catch (requestError) {
      setBalanceError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de verifier cette carte.",
      );
    } finally {
      setCheckingBalance(false);
    }
  }

  async function buyGiftCard(card: GiftCardType) {
    const token = localStorage.getItem("ak_auth_token");
    if (!token) {
      go("login");
      return;
    }

    setBuyingCardId(card.id);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/gift-cards/purchase/stripe-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gift_card_type_id: card.id,
            success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/order-failure?session_id={CHECKOUT_SESSION_ID}`,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Achat de carte cadeau refuse.");
      }
      localStorage.setItem(
        "ak_pending_order",
        JSON.stringify({
          destination: "user-gift-cards",
          destinationLabel: "Voir mes cartes",
          kind: "gift_card_purchase",
          message: "Paiement Stripe en attente pour votre carte cadeau.",
          order_number: payload.data?.serial_number,
          total_eur: Number(card.value_eur || 0),
        }),
      );
      window.location.assign(payload.data.url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de lancer le paiement Stripe.",
      );
    } finally {
      setBuyingCardId(null);
    }
  }

  return (
    <section className="giftcards-page">
      <section className="giftcards-hero">
        <div>
          <p className="eyebrow">Cartes cadeaux AK Fashion Plus</p>
          <h1>Offrez plus qu'un cadeau, offrez le choix.</h1>
          <p>
            Les cartes cadeaux AK Fashion Plus peuvent etre offertes a un proche
            et utilisees pour acheter des articles sur la plateforme, selon le
            solde disponible.
          </p>
          <button onClick={() => go("gift-cards")} type="button">
            Offrir une carte cadeau
          </button>
        </div>
        <div className="giftcards-hero-stack">
          {heroCards.length > 0 ? (
            heroCards.map((card, index) => (
              <GiftCardVisual
                key={card.id}
                name={card.name}
                value={Number(card.value_eur || 0)}
                tone={["gold", "silver", "black"][index % 3]}
              />
            ))
          ) : (
            <>
              <GiftCardVisual name="AK Gift" value={0} tone="gold" />
              <GiftCardVisual name="Fashion Plus" value={0} tone="silver" />
              <GiftCardVisual name="Premium" value={0} tone="black" />
            </>
          )}
        </div>
      </section>

      <section className="giftcards-steps">
        {[
          [
            "1",
            "Choisissez une carte",
            "Selectionnez le montant adapte a l'occasion.",
          ],
          [
            "2",
            "Designez le beneficiaire",
            "Achetez pour vous ou offrez-la a un proche.",
          ],
          [
            "3",
            "Payez en ligne",
            "La carte est creee apres confirmation du paiement.",
          ],
        ].map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="giftcards-section">
        <GiftCardsTitle
          eyebrow="Disponibles"
          title="Cartes cadeaux disponibles"
        />
        {error && <div className="giftcards-message error">{error}</div>}
        {loading && <GiftCardsSkeleton />}
        {!loading && !error && cards.length === 0 && (
          <div className="giftcards-message">
            Aucun type de carte cadeau actif n'est present dans la base.
          </div>
        )}
        {!loading && !error && cards.length > 0 && (
          <div className="giftcards-grid">
            {cards.map((card, index) => (
              <article className="giftcards-card" key={card.id}>
                <GiftCardVisual
                  name={card.name}
                  referenceSeed={`${card.code}-${card.id}`}
                  tone={["gold", "silver", "black"][index % 3]}
                  value={Number(card.value_eur)}
                />
                <div>
                  <p>{card.code}</p>
                  <h2>{card.name}</h2>
                  <strong>{eur(Number(card.value_eur || 0))}</strong>
                  <span>
                    {card.description ||
                      "Carte cadeau utilisable sur les achats AK Fashion Plus."}
                  </span>
                  <div className="giftcards-card-actions">
                    <button
                      disabled={buyingCardId === card.id}
                      onClick={() => void buyGiftCard(card)}
                      type="button"
                    >
                      {buyingCardId === card.id ? "Stripe..." : "Acheter"}
                    </button>
                    <button
                      className="ghost"
                      onClick={() =>
                        setSelectedCardId((current) =>
                          current === card.id ? null : card.id,
                        )
                      }
                      type="button"
                    >
                      Voir les details
                    </button>
                  </div>
                  {selectedCardId === card.id && (
                    <div className="giftcards-card-details">
                      <small>Code type : {card.code}</small>
                      <small>Statut : {card.status}</small>
                      <small>
                        Utilisable selon le solde attribue au beneficiaire apres
                        achat.
                      </small>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="giftcards-offer">
        <div>
          <p className="eyebrow">Comment offrir une carte ?</p>
          <h2>Choisissez pour vous ou pour un proche</h2>
          <p>
            Lors de l'achat, l'utilisateur peut choisir{" "}
            <strong>Je l'achete pour moi</strong> ou{" "}
            <strong>Je l'offre a quelqu'un</strong>. S'il choisit de l'offrir,
            il renseigne le nom du beneficiaire et, selon le parcours, son email
            ou son compte AK Fashion Plus.
          </p>
        </div>
        <div className="giftcards-choice-panel">
          <article>
            <span>Moi</span>
            <strong>Je l'achete pour moi</strong>
            <small>La carte est rattachee a mon compte.</small>
          </article>
          <article>
            <span>Cadeau</span>
            <strong>Je l'offre a quelqu'un</strong>
            <small>Je renseigne le beneficiaire.</small>
          </article>
        </div>
      </section>

      <section className="giftcards-balance">
        <div>
          <p className="eyebrow">Solde</p>
          <h2>Vous avez deja une carte cadeau ?</h2>
          <p>
            Entrez le numero de carte pour consulter son solde disponible et son
            statut.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void checkBalance();
          }}
        >
          <input
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            placeholder="Numero de carte cadeau"
          />
          <button disabled={checkingBalance} type="submit">
            {checkingBalance ? "Verification..." : "Verifier le solde"}
          </button>
        </form>
        {balanceError && (
          <div className="giftcards-message error">{balanceError}</div>
        )}
        {balance && (
          <div className="giftcards-balance-result">
            <span>{balance.card_name}</span>
            <strong>{eur(Number(balance.available_balance_eur || 0))}</strong>
            <small>
              Solde courant {eur(Number(balance.current_balance_eur || 0))} -
              Reserve {eur(Number(balance.reserved_balance_eur || 0))} - Statut{" "}
              {balance.status}
            </small>
          </div>
        )}
      </section>

      <section className="giftcards-benefits">
        {[
          [
            "Utilisable sur plusieurs achats",
            "Le solde peut etre consomme progressivement.",
          ],
          [
            "Solde consultable",
            "Le beneficiaire peut verifier le montant disponible.",
          ],
          [
            "Paiement securise",
            "Achat en ligne via le parcours de paiement AK.",
          ],
          [
            "Offrir a un proche",
            "La carte peut etre destinee a un beneficiaire.",
          ],
        ].map(([title, text]) => (
          <article key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </article>
        ))}
      </section>

      <section className="giftcards-faq">
        <GiftCardsTitle eyebrow="FAQ" title="Questions frequentes" />
        {[
          [
            "Comment utiliser ma carte cadeau ?",
            "Au moment du paiement, choisissez carte cadeau et renseignez la carte disponible sur votre compte.",
          ],
          [
            "Puis-je utiliser plusieurs cartes ?",
            "Le systeme peut accepter plusieurs paiements selon les regles configurees dans le checkout.",
          ],
          [
            "Que se passe-t-il si mon achat coute plus cher que le solde ?",
            "Vous completez la difference avec un autre moyen de paiement, par exemple Stripe.",
          ],
          [
            "Puis-je utiliser seulement une partie du montant ?",
            "Oui, le solde restant reste disponible pour un prochain achat.",
          ],
          [
            "La carte expire-t-elle ?",
            "Cela depend des parametres definis par AK Fashion Plus.",
          ],
          [
            "Puis-je transferer une carte ?",
            "La carte peut etre offerte lors de l'achat; le transfert depend des regles de compte.",
          ],
          [
            "Puis-je demander un remboursement ?",
            "Les remboursements dependent des conditions commerciales AK Fashion Plus.",
          ],
        ].map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}

function GiftCardsTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="giftcards-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function GiftCardVisual({
  name,
  referenceSeed,
  tone,
  value,
}: {
  name: string;
  referenceSeed?: string;
  tone: string;
  value: number;
}) {
  const reference = buildGiftCardReference(referenceSeed || name);

  return (
    <div className={`giftcard-visual ${tone}`}>
      <div className="giftcard-brand-row">
        <div>
          <span>AK</span>
          <small>Fashion Plus</small>
        </div>
        <div className="giftcard-badge">Carte cadeau</div>
      </div>
      <div className="giftcard-chip-row">
        <i className="giftcard-contactless" />
        <i className="giftcard-chip" />
      </div>
      <div className="giftcard-number">{reference}</div>
      <div className="giftcard-meta-row">
        <div>
          <small>Titulaire</small>
          <strong>Ana Kiala</strong>
        </div>
        <div>
          <small>Expire le</small>
          <strong>00/00</strong>
        </div>
      </div>
      <div className="giftcard-bottom-row">
        <h3>{name}</h3>
        <div>
          <small>Solde</small>
          <strong>{eur(value)}</strong>
        </div>
      </div>
    </div>
  );
}

function buildGiftCardReference(seed: string) {
  const digits = Array.from(seed).reduce(
    (value, char) => value + char.charCodeAt(0),
    4609000000000000,
  );
  return String(digits)
    .padEnd(16, "0")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function GiftCardsSkeleton() {
  return (
    <div className="giftcards-grid">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="giftcards-skeleton" key={index}>
          <span />
          <strong />
          <i />
        </div>
      ))}
    </div>
  );
}
