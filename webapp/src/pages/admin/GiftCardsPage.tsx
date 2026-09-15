import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, post, put } from "../../services/api";

type AdminGiftCardsPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type GiftCardType = {
  id: number;
  name: string;
  code: string;
  value_eur: number;
  description: string | null;
  image_url: string | null;
  status: "active" | "inactive";
  issued_count: number;
  issued_value_eur: number;
  current_balance_eur: number;
};

type GiftCard = {
  id: number;
  gift_card_type_id: number;
  owner_user_id: number | null;
  purchased_by: number | null;
  serial_number: string;
  card_name: string;
  card_code: string;
  initial_balance_eur: number;
  current_balance_eur: number;
  reserved_balance_eur: number;
  available_balance_eur: number;
  source: "customer_purchase" | "admin_created";
  status: string;
  expires_at: string | null;
  activated_at: string | null;
  assigned_at: string | null;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  purchaser_name: string | null;
  purchaser_email: string | null;
};

type UserOption = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

type TransactionRow = {
  id: number;
  transaction_reference: string;
  type: string;
  amount_eur: number;
  balance_before_eur: number;
  balance_after_eur: number;
  description: string | null;
  created_at: string;
};

type TypeForm = {
  name: string;
  code: string;
  value_eur: string;
  description_fr: string;
  description_en: string;
  description_pt: string;
  image_url: string;
  status: "active" | "inactive";
};

const emptyTypeForm: TypeForm = {
  name: "",
  code: "",
  value_eur: "",
  description_fr: "",
  description_en: "",
  description_pt: "",
  image_url: "",
  status: "active",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  blocked: "Bloquee",
  cancelled: "Annulee",
  expired: "Expiree",
  fully_used: "Utilisee",
  pending_payment: "Paiement en attente",
  unassigned: "Non assignee",
};

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function maskSerial(value: string) {
  return value ? `${value.slice(0, 10)}...${value.slice(-5)}` : "-";
}

function initials(name: string | null, email: string | null) {
  return (name || email || "AK")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function codeFromName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export default function GiftCardsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminGiftCardsPageProps) {
  const [types, setTypes] = useState<GiftCardType[]>([]);
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [source, setSource] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [typeForm, setTypeForm] = useState<TypeForm>(emptyTypeForm);
  const [generateForm, setGenerateForm] = useState({
    gift_card_type_id: "",
    owner_user_id: "",
  });
  const [adjustment, setAdjustment] = useState({
    amount_eur: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadData();
    get<UserOption[]>("/users?limit=100")
      .then((rows) =>
        setUsers((rows || []).filter((user) => user.role === "user")),
      )
      .catch(() => setUsers([]));
  }, []);

  function loadData() {
    setLoading(true);
    setError("");
    Promise.all([
      get<GiftCardType[]>("/gift-cards/types?admin=1&lang=fr"),
      get<GiftCard[]>("/gift-cards"),
    ])
      .then(([typeRows, cardRows]) => {
        setTypes(typeRows || []);
        setCards(cardRows || []);
        setGenerateForm((current) => ({
          ...current,
          gift_card_type_id:
            current.gift_card_type_id || typeRows?.[0]?.id
              ? String(typeRows?.[0]?.id || "")
              : "",
        }));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards
      .filter((card) => {
        const matchesSearch =
          !term ||
          [
            card.serial_number,
            card.card_name,
            card.card_code,
            card.owner_name || "",
            card.owner_email || "",
            card.purchaser_name || "",
            card.purchaser_email || "",
          ].some((value) => value.toLowerCase().includes(term));
        const matchesStatus = status === "all" || card.status === status;
        const matchesType =
          typeId === "all" || String(card.gift_card_type_id) === typeId;
        const matchesSource = source === "all" || card.source === source;

        return matchesSearch && matchesStatus && matchesType && matchesSource;
      })
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [cards, search, source, status, typeId]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedCards = filteredCards.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const totals = useMemo(
    () =>
      cards.reduce(
        (sum, card) => ({
          active: sum.active + (card.status === "active" ? 1 : 0),
          initial: sum.initial + Number(card.initial_balance_eur || 0),
          current: sum.current + Number(card.current_balance_eur || 0),
          reserved: sum.reserved + Number(card.reserved_balance_eur || 0),
          available: sum.available + Number(card.available_balance_eur || 0),
        }),
        { active: 0, available: 0, current: 0, initial: 0, reserved: 0 },
      ),
    [cards],
  );

  function submitType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    post("/gift-cards/types", {
      ...typeForm,
      code: typeForm.code || codeFromName(typeForm.name),
      value_eur: Number(typeForm.value_eur || 0),
      image_url: typeForm.image_url || null,
    })
      .then(() => {
        setNotice("Type de carte cadeau cree.");
        setTypeModalOpen(false);
        loadData();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function submitGeneratedCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    post("/gift-cards/admin", {
      gift_card_type_id: Number(generateForm.gift_card_type_id),
      owner_user_id: generateForm.owner_user_id
        ? Number(generateForm.owner_user_id)
        : null,
    })
      .then(() => {
        setNotice("Carte cadeau generee.");
        setGenerateModalOpen(false);
        loadData();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function openCardDetails(card: GiftCard) {
    setSelectedCard(card);
    setTransactions([]);
    get<TransactionRow[]>(`/gift-cards/${card.id}/transactions`)
      .then((rows) => setTransactions(rows || []))
      .catch(() => setTransactions([]));
  }

  function updateCardStatus(card: GiftCard, nextStatus: string) {
    setSaving(true);
    setError("");
    put(`/gift-cards/${card.id}/status`, { status: nextStatus })
      .then(() => {
        setNotice("Statut de la carte mis a jour.");
        setSelectedCard(null);
        loadData();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCard) return;
    setSaving(true);
    setError("");
    post(`/gift-cards/${selectedCard.id}/adjust`, {
      amount_eur: Number(adjustment.amount_eur || 0),
      description: adjustment.description || null,
    })
      .then(() => {
        setNotice("Solde de carte ajuste.");
        setAdjustment({ amount_eur: "", description: "" });
        setSelectedCard(null);
        loadData();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-giftcards-page">
        <section className="admin-hero">
          <div>
            <p>Cartes cadeaux</p>
            <h2>Portefeuille cartes cadeaux</h2>
            <span>
              Suivez les types disponibles, les cartes generees, les
              proprietaires, les acheteurs et les soldes restants.
            </span>
          </div>
          <div className="admin-hero-actions">
            <button onClick={() => setTypeModalOpen(true)} type="button">
              Nouveau type
            </button>
            <button onClick={() => setGenerateModalOpen(true)} type="button">
              Generer une carte
            </button>
          </div>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Cartes actives</span>
            <strong>{loading ? "..." : totals.active}</strong>
          </article>
          <article>
            <span>Solde initial</span>
            <strong>{eur(totals.initial)}</strong>
          </article>
          <article>
            <span>Solde restant</span>
            <strong>{eur(totals.current)}</strong>
          </article>
          <article>
            <span>Disponible</span>
            <strong>{eur(totals.available)}</strong>
          </article>
        </section>

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Modeles</p>
              <h3>Types de cartes</h3>
            </div>
            <strong>{types.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-giftcard-types-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Modele</th>
                  <th>Code</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {types.map((type, index) => (
                  <tr key={type.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{type.name}</strong>
                      <small>Type de carte cadeau</small>
                    </td>
                    <td>{type.code}</td>
                    <td>
                      <strong>{eur(type.value_eur)}</strong>
                    </td>
                    <td>{type.description || "Carte cadeau AK Fashion Plus"}</td>
                    <td>
                      <span className={`admin-status-pill ${type.status}`}>
                        {type.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!types.length && (
              <div className="admin-empty-state">
                <strong>Aucun type de carte trouve</strong>
                <p>Creez un type de carte cadeau pour commencer.</p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-product-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Numero, type, proprietaire, acheteur..."
              value={search}
            />
          </label>
          <label>
            Type
            <select
              onChange={(event) => {
                setTypeId(event.target.value);
                setTablePage(1);
              }}
              value={typeId}
            >
              <option value="all">Tous les types</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select
              onChange={(event) => {
                setStatus(event.target.value);
                setTablePage(1);
              }}
              value={status}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="pending_payment">Paiement en attente</option>
              <option value="unassigned">Non assignees</option>
              <option value="fully_used">Utilisees</option>
              <option value="blocked">Bloquees</option>
              <option value="expired">Expirees</option>
              <option value="cancelled">Annulees</option>
            </select>
          </label>
          <label>
            Source
            <select
              onChange={(event) => {
                setSource(event.target.value);
                setTablePage(1);
              }}
              value={source}
            >
              <option value="all">Toutes les sources</option>
              <option value="customer_purchase">Achat client</option>
              <option value="admin_created">Creation admin</option>
            </select>
          </label>
        </section>

        {notice && <p className="admin-success-message">{notice}</p>}
        {error && <p className="admin-error-message">{error}</p>}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Cartes generees</p>
              <h3>Cartes cadeaux emises</h3>
            </div>
            <strong>{filteredCards.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-giftcards-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Carte</th>
                  <th>Proprietaire</th>
                  <th>Acheteur</th>
                  <th>Soldes</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCards.map((card, index) => (
                  <tr key={card.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <strong>{card.card_name}</strong>
                      <small>{card.card_code}</small>
                      <span>{maskSerial(card.serial_number)}</span>
                      <small>Creee le {date(card.created_at)}</small>
                    </td>
                    <td>
                      <div className="admin-user-cell compact">
                        <i>{initials(card.owner_name, card.owner_email)}</i>
                        <span>
                          <strong>{card.owner_name || "Non assignee"}</strong>
                          <small>{card.owner_email || "-"}</small>
                          <small>{card.owner_phone || ""}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{card.purchaser_name || "Administration"}</strong>
                      <small>{card.purchaser_email || "-"}</small>
                    </td>
                    <td>
                      <strong>Initial: {eur(card.initial_balance_eur)}</strong>
                      <small>Restant: {eur(card.current_balance_eur)}</small>
                      <small>Reserve: {eur(card.reserved_balance_eur)}</small>
                      <span>Disponible: {eur(card.available_balance_eur)}</span>
                    </td>
                    <td>
                      {card.source === "customer_purchase"
                        ? "Achat client"
                        : "Creation admin"}
                    </td>
                    <td>
                      <span className={`admin-status-pill ${card.status}`}>
                        {statusLabels[card.status] || card.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => openCardDetails(card)}
                          type="button"
                        >
                          Ouvrir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredCards.length && (
              <div className="admin-empty-state">
                <strong>Aucune carte cadeau trouvee</strong>
                <p>
                  Les cartes achetees par les clients ou generees par
                  l'administration apparaitront ici.
                </p>
              </div>
            )}
            {filteredCards.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={filteredCards.length}
                totalPages={totalPages}
                onPageChange={setTablePage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setTablePage(1);
                }}
              />
            )}
          </div>
        </section>

        {typeModalOpen && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal compact" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Modele</p>
                  <h3>Nouveau type</h3>
                </div>
                <button onClick={() => setTypeModalOpen(false)} type="button">
                  Fermer
                </button>
              </div>
              <form className="admin-category-form" onSubmit={submitType}>
                <label>
                  Nom
                  <input
                    onChange={(event) =>
                      setTypeForm({
                        ...typeForm,
                        name: event.target.value,
                        code: codeFromName(event.target.value),
                      })
                    }
                    required
                    value={typeForm.name}
                  />
                </label>
                <label>
                  Code
                  <input
                    onChange={(event) =>
                      setTypeForm({
                        ...typeForm,
                        code: codeFromName(event.target.value),
                      })
                    }
                    required
                    value={typeForm.code}
                  />
                </label>
                <label>
                  Montant EUR
                  <input
                    min="1"
                    onChange={(event) =>
                      setTypeForm({
                        ...typeForm,
                        value_eur: event.target.value,
                      })
                    }
                    required
                    step="0.01"
                    type="number"
                    value={typeForm.value_eur}
                  />
                </label>
                <label>
                  Description FR
                  <textarea
                    onChange={(event) =>
                      setTypeForm({
                        ...typeForm,
                        description_fr: event.target.value,
                      })
                    }
                    value={typeForm.description_fr}
                  />
                </label>
                <div className="admin-form-actions">
                  <button disabled={saving} type="submit">
                    Creer le type
                  </button>
                  <button onClick={() => setTypeModalOpen(false)} type="button">
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {generateModalOpen && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal compact" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Emission</p>
                  <h3>Generer une carte</h3>
                </div>
                <button
                  onClick={() => setGenerateModalOpen(false)}
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <form
                className="admin-category-form"
                onSubmit={submitGeneratedCard}
              >
                <label>
                  Type de carte
                  <select
                    onChange={(event) =>
                      setGenerateForm({
                        ...generateForm,
                        gift_card_type_id: event.target.value,
                      })
                    }
                    required
                    value={generateForm.gift_card_type_id}
                  >
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {eur(type.value_eur)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Proprietaire
                  <select
                    onChange={(event) =>
                      setGenerateForm({
                        ...generateForm,
                        owner_user_id: event.target.value,
                      })
                    }
                    value={generateForm.owner_user_id}
                  >
                    <option value="">Non assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} - {user.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="admin-form-actions">
                  <button disabled={saving} type="submit">
                    Generer
                  </button>
                  <button
                    onClick={() => setGenerateModalOpen(false)}
                    type="button"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {selectedCard && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Carte cadeau</p>
                  <h3>{selectedCard.card_name}</h3>
                </div>
                <button onClick={() => setSelectedCard(null)} type="button">
                  Fermer
                </button>
              </div>
              <div className="admin-giftcard-detail">
                <div className="admin-giftcard-detail-card">
                  <div className="admin-giftcard-mini tone-1 large">
                    <span>AK</span>
                    <strong>{selectedCard.card_name}</strong>
                    <small>{selectedCard.serial_number}</small>
                    <b>{eur(selectedCard.available_balance_eur)}</b>
                  </div>
                  <dl>
                    <div>
                      <dt>Proprietaire</dt>
                      <dd>{selectedCard.owner_name || "Non assignee"}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selectedCard.owner_email || "-"}</dd>
                    </div>
                    <div>
                      <dt>Acheteur</dt>
                      <dd>{selectedCard.purchaser_name || "Administration"}</dd>
                    </div>
                    <div>
                      <dt>Activation</dt>
                      <dd>{date(selectedCard.activated_at)}</dd>
                    </div>
                  </dl>
                </div>
                <form className="admin-category-form" onSubmit={submitAdjustment}>
                  <div className="admin-form-grid">
                    <label>
                      Statut
                      <select
                        onChange={(event) =>
                          updateCardStatus(selectedCard, event.target.value)
                        }
                        value={selectedCard.status}
                      >
                        <option value="active">Active</option>
                        <option value="blocked">Bloquee</option>
                        <option value="expired">Expiree</option>
                        <option value="cancelled">Annulee</option>
                      </select>
                    </label>
                    <label>
                      Ajustement EUR
                      <input
                        onChange={(event) =>
                          setAdjustment({
                            ...adjustment,
                            amount_eur: event.target.value,
                          })
                        }
                        placeholder="-10 ou 25"
                        step="0.01"
                        type="number"
                        value={adjustment.amount_eur}
                      />
                    </label>
                    <label>
                      Description
                      <input
                        onChange={(event) =>
                          setAdjustment({
                            ...adjustment,
                            description: event.target.value,
                          })
                        }
                        value={adjustment.description}
                      />
                    </label>
                  </div>
                  <div className="admin-form-actions">
                    <button disabled={saving} type="submit">
                      Ajuster le solde
                    </button>
                  </div>
                </form>
                <section>
                  <h4>Transactions</h4>
                  <div className="admin-giftcard-transactions">
                    {transactions.map((transaction) => (
                      <article key={transaction.id}>
                        <strong>{transaction.transaction_reference}</strong>
                        <span>{transaction.type}</span>
                        <b>{eur(transaction.amount_eur)}</b>
                        <small>
                          {eur(transaction.balance_before_eur)} vers{" "}
                          {eur(transaction.balance_after_eur)}
                        </small>
                        <small>{date(transaction.created_at)}</small>
                      </article>
                    ))}
                    {!transactions.length && (
                      <div className="admin-empty-state">
                        <strong>Aucune transaction</strong>
                        <p>Les mouvements de solde apparaitront ici.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

function PaginationControls({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  total,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="admin-pagination">
      <span>
        {start}-{end} sur {total}
      </span>
      <select
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        value={pageSize}
      >
        <option value={10}>10 par page</option>
        <option value={20}>20 par page</option>
      </select>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        type="button"
      >
        Precedent
      </button>
      <strong>
        Page {page} / {totalPages}
      </strong>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        type="button"
      >
        Suivant
      </button>
    </div>
  );
}
