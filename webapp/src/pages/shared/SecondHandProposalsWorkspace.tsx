import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  confirmSecondHandProposalPayment,
  evaluateSecondHandProposal,
  getStaffSecondHandProposal,
  getStaffSecondHandProposals,
  markSecondHandProposalReceived,
  secondHandStatusLabel,
  secondHandStatuses,
  setSecondHandProposalInstructions,
  updateSecondHandProposalStatus,
  verifySecondHandProposal,
  type SecondHandHandoverMethod,
  type SecondHandProposal,
} from "../../services/secondHandProposal.service";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  variant: "admin" | "cashier";
};

const conditionLabels: Record<string, string> = {
  new_never_worn: "Neuf / jamais porte",
  excellent: "Excellent etat",
  very_good: "Tres bon etat",
  good: "Bon etat",
  fair: "Etat correct",
};

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function SecondHandProposalsWorkspace({ variant }: Props) {
  const isCashier = variant === "cashier";
  const heroClass = isCashier ? "cashier-hero" : "admin-hero";
  const kpisClass = isCashier ? "cashier-kpis" : "admin-product-kpis";
  const filtersClass = isCashier ? "cashier-filters" : "admin-product-filters";
  const panelClass = isCashier ? "cashier-panel" : "admin-data-card";
  const panelHeadClass = isCashier ? "cashier-panel-head" : "admin-section-heading";
  const tableWrapClass = isCashier ? "cashier-table" : "admin-table-scroll";
  const tableClass = isCashier ? "" : "admin-management-table admin-resales-table";
  const successClass = isCashier ? "cashier-success" : "admin-success-message";
  const errorClass = isCashier ? "cashier-error" : "admin-error-message";

  const [rows, setRows] = useState<SecondHandProposal[]>([]);
  const [selected, setSelected] = useState<SecondHandProposal | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [offer, setOffer] = useState("");
  const [notes, setNotes] = useState("");
  const [handoverMethod, setHandoverMethod] = useState<SecondHandHandoverMethod>("dropoff");
  const [instructions, setInstructions] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (status) next.set("status", status);
    if (dateFrom) next.set("date_from", dateFrom);
    if (dateTo) next.set("date_to", dateTo);
    return next;
  }, [dateFrom, dateTo, query, status]);

  const loadRows = useCallback(() => {
    setLoading(true);
    setError("");
    getStaffSecondHandProposals(params)
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(loadRows, 180);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      ),
    [rows],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedRows = sortedRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      waiting: rows.filter((row) =>
        ["submitted", "under_review"].includes(row.status),
      ).length,
      offers: rows.filter((row) => row.status === "offer_sent").length,
      closed: rows.filter((row) =>
        ["paid", "completed", "rejected", "cancelled"].includes(row.status),
      ).length,
    }),
    [rows],
  );

  function resetPage() {
    setTablePage(1);
  }

  async function openDetail(id: number) {
    setError("");
    try {
      const proposal = await getStaffSecondHandProposal(id);
      setSelected(proposal);
      setOffer(proposal.offered_price_eur ? String(proposal.offered_price_eur) : "");
      setNotes(proposal.admin_notes || "");
      setHandoverMethod(proposal.handover_method || "dropoff");
      setInstructions(proposal.handover_instructions || "");
      setPaymentReference(proposal.payment_reference || "");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function refreshSelected(id: number) {
    const proposal = await getStaffSecondHandProposal(id);
    setSelected(proposal);
    loadRows();
    return proposal;
  }

  async function runAction(action: () => Promise<SecondHandProposal>, message: string) {
    if (!selected) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refreshSelected(selected.id);
      setNotice(message);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function sendOffer(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(offer.replace(",", "."));
    void runAction(
      () =>
        evaluateSecondHandProposal(selected.id, {
          offered_price_eur: amount,
          admin_notes: notes.trim() || undefined,
        }),
      "Offre envoyee au client.",
    );
  }

  return (
    <section className={isCashier ? "cashier-page" : "admin-resales-page"}>
      <section className={heroClass}>
        <div>
          <p>Seconde main</p>
          <h2>Propositions de vente</h2>
          <span>
            Consultez les articles proposes par les clients, envoyez une offre,
            suivez la remise de l'article et cloturez le paiement.
          </span>
        </div>
        <button onClick={loadRows} type="button">
          Actualiser
        </button>
      </section>

      {notice ? <p className={successClass}>{notice}</p> : null}
      {error ? <p className={errorClass}>{error}</p> : null}

      <section className={kpisClass}>
        <article>
          <span>Propositions</span>
          <strong>{loading ? "..." : stats.total}</strong>
        </article>
        <article>
          <span>A evaluer</span>
          <strong>{stats.waiting}</strong>
        </article>
        <article>
          <span>Offres envoyees</span>
          <strong>{stats.offers}</strong>
        </article>
        <article>
          <span>Dossiers clos</span>
          <strong>{stats.closed}</strong>
        </article>
      </section>

      <section className={filtersClass}>
        <label>
          Recherche
          <input
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            placeholder="Numero, client, marque, article..."
            type="search"
            value={query}
          />
        </label>
        <label>
          Statut
          <select
            onChange={(event) => {
              setStatus(event.target.value);
              resetPage();
            }}
            value={status}
          >
            {secondHandStatuses.map(([id, label]) => (
              <option key={id || "all"} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date debut
          <input
            onChange={(event) => {
              setDateFrom(event.target.value);
              resetPage();
            }}
            type="date"
            value={dateFrom}
          />
        </label>
        <label>
          Date fin
          <input
            onChange={(event) => {
              setDateTo(event.target.value);
              resetPage();
            }}
            type="date"
            value={dateTo}
          />
        </label>
      </section>

      <section className={panelClass}>
        <div className={panelHeadClass}>
          <div>
            <p>Liste</p>
            <h3>Articles proposes</h3>
          </div>
          <strong>{sortedRows.length}</strong>
        </div>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>#</th>
                <th>Article</th>
                <th>Client</th>
                <th>Prix</th>
                <th>Etat</th>
                <th>Dates</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((proposal, index) => (
                <tr key={proposal.id}>
                  <td>{(safePage - 1) * pageSize + index + 1}</td>
                  <td>
                    <div className={isCashier ? "cashier-product-cell" : "admin-line-with-image"}>
                      {proposal.cover_image_url ? (
                        <img alt={`${proposal.item_type} ${proposal.brand}`} src={absoluteImageUrl(proposal.cover_image_url)} />
                      ) : (
                        <i>{proposal.brand.slice(0, 2).toUpperCase()}</i>
                      )}
                      <span>
                        <strong>{proposal.item_type} {proposal.brand}</strong>
                        <small>{proposal.proposal_number}</small>
                        <small>{proposal.size || "-"} / {proposal.color || "-"}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{proposal.user_name || "-"}</strong>
                    <small>{proposal.user_email || "-"}</small>
                    <small>{proposal.user_phone || "-"}</small>
                  </td>
                  <td>
                    <strong>Souhaite: {eur(proposal.desired_price_eur)}</strong>
                    <small>Offre: {numberValue(proposal.offered_price_eur) ? eur(proposal.offered_price_eur) : "-"}</small>
                    <small>Final: {numberValue(proposal.final_price_eur) ? eur(proposal.final_price_eur) : "-"}</small>
                  </td>
                  <td>
                    <strong>{conditionLabels[proposal.condition_state] || proposal.condition_state}</strong>
                    <small>{proposal.category_name_fr || "-"}</small>
                  </td>
                  <td>
                    <strong>{dateTime(proposal.created_at)}</strong>
                    <small>Evaluation: {dateTime(proposal.evaluated_at)}</small>
                    <small>Paiement: {dateTime(proposal.paid_at)}</small>
                  </td>
                  <td>
                    <span className={isCashier ? "cashier-status" : `admin-status-pill ${proposal.status}`}>
                      {secondHandStatusLabel(proposal.status)}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => void openDetail(proposal.id)} type="button">
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !sortedRows.length ? (
                <tr>
                  <td colSpan={8}>Aucune proposition trouvee.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {sortedRows.length > 0 ? (
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={sortedRows.length}
            totalPages={totalPages}
            onPageChange={setTablePage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              resetPage();
            }}
          />
        ) : null}
      </section>

      {selected ? (
        <div className={isCashier ? "cashier-modal-backdrop" : "admin-product-modal"} role="presentation">
          {!isCashier ? <button className="admin-product-modal-backdrop" onClick={() => setSelected(null)} type="button" /> : null}
          <section className={isCashier ? "cashier-modal" : "admin-product-editor"} role="dialog">
            <div className={isCashier ? "cashier-panel-head" : "admin-product-modal-head"}>
              <div>
                <p>{selected.proposal_number}</p>
                <h3>{selected.item_type} {selected.brand}</h3>
              </div>
              <button onClick={() => setSelected(null)} type="button">
                Fermer
              </button>
            </div>

            <div className="second-hand-workspace-grid">
              <section className="admin-data-card">
                <div className="admin-section-heading">
                  <div>
                    <p>Article</p>
                    <h3>Details client</h3>
                  </div>
                </div>
                <div className="second-hand-detail-list">
                  <span>Client <strong>{selected.user_name || "-"}</strong></span>
                  <span>Email <strong>{selected.user_email || "-"}</strong></span>
                  <span>Telephone <strong>{selected.user_phone || "-"}</strong></span>
                  <span>Etat <strong>{conditionLabels[selected.condition_state] || selected.condition_state}</strong></span>
                  <span>Banque <strong>{selected.bank_name || "-"}</strong></span>
                  <span>Titulaire <strong>{selected.bank_account_holder || "-"}</strong></span>
                  <span>Compte <strong>{selected.bank_account_number || selected.bank_account_number_masked || "-"}</strong></span>
                </div>
                <p>{selected.description || "Aucune description."}</p>
              </section>

              <form className="admin-data-card" onSubmit={sendOffer}>
                <div className="admin-section-heading">
                  <div>
                    <p>Evaluation</p>
                    <h3>Offre AK Fashion Plus</h3>
                  </div>
                </div>
                <label>
                  Offre en EUR
                  <input
                    onChange={(event) => setOffer(event.target.value)}
                    placeholder="30,00"
                    value={offer}
                  />
                </label>
                <label>
                  Notes internes
                  <textarea
                    onChange={(event) => setNotes(event.target.value)}
                    value={notes}
                  />
                </label>
                <button disabled={saving} type="submit">
                  Envoyer l'offre
                </button>
                <button
                  disabled={saving}
                  onClick={() =>
                    selected &&
                    void runAction(
                      () =>
                        updateSecondHandProposalStatus(selected.id, {
                          status: "under_review",
                          admin_notes: notes.trim() || undefined,
                        }),
                      "Proposition placee en evaluation.",
                    )
                  }
                  type="button"
                >
                  Mettre en evaluation
                </button>
              </form>

              <section className="admin-data-card">
                <div className="admin-section-heading">
                  <div>
                    <p>Remise</p>
                    <h3>Instructions article</h3>
                  </div>
                </div>
                <label>
                  Methode
                  <select
                    onChange={(event) =>
                      setHandoverMethod(event.target.value as SecondHandHandoverMethod)
                    }
                    value={handoverMethod}
                  >
                    <option value="dropoff">Depot physique</option>
                    <option value="shipping">Envoi article</option>
                  </select>
                </label>
                <label>
                  Instructions
                  <textarea
                    onChange={(event) => setInstructions(event.target.value)}
                    value={instructions}
                  />
                </label>
                <button
                  disabled={saving}
                  onClick={() =>
                    selected &&
                    void runAction(
                      () =>
                        setSecondHandProposalInstructions(selected.id, {
                          handover_method: handoverMethod,
                          handover_instructions: instructions,
                        }),
                      "Instructions envoyees au client.",
                    )
                  }
                  type="button"
                >
                  Envoyer instructions
                </button>
                <button
                  disabled={saving}
                  onClick={() =>
                    selected &&
                    void runAction(
                      () => markSecondHandProposalReceived(selected.id, notes),
                      "Article marque comme recu.",
                    )
                  }
                  type="button"
                >
                  Article recu
                </button>
              </section>

              <section className="admin-data-card">
                <div className="admin-section-heading">
                  <div>
                    <p>Conclusion</p>
                    <h3>Validation et paiement</h3>
                  </div>
                </div>
                <label>
                  Reference paiement
                  <input
                    onChange={(event) => setPaymentReference(event.target.value)}
                    value={paymentReference}
                  />
                </label>
                <div className="admin-modal-actions">
                  <button
                    disabled={saving}
                    onClick={() =>
                      selected &&
                      void runAction(
                        () =>
                          verifySecondHandProposal(selected.id, {
                            valid: true,
                            admin_notes: notes.trim() || undefined,
                          }),
                        "Article valide.",
                      )
                    }
                    type="button"
                  >
                    Valider
                  </button>
                  <button
                    className="danger"
                    disabled={saving}
                    onClick={() =>
                      selected &&
                      void runAction(
                        () =>
                          verifySecondHandProposal(selected.id, {
                            valid: false,
                            admin_notes: notes.trim() || undefined,
                          }),
                        "Article refuse apres verification.",
                      )
                    }
                    type="button"
                  >
                    Refuser
                  </button>
                </div>
                <button
                  disabled={saving}
                  onClick={() =>
                    selected &&
                    void runAction(
                      () =>
                        confirmSecondHandProposalPayment(selected.id, {
                          final_price_eur: numberValue(
                            offer || selected.offered_price_eur || selected.desired_price_eur,
                          ),
                          payment_reference: paymentReference.trim() || undefined,
                          admin_notes: notes.trim() || undefined,
                        }),
                      "Paiement enregistre et deal cloture.",
                    )
                  }
                  type="button"
                >
                  Confirmer paiement
                </button>
                <button
                  disabled={saving}
                  onClick={() =>
                    selected &&
                    void runAction(
                      () =>
                        updateSecondHandProposalStatus(selected.id, {
                          status: "completed",
                          admin_notes: notes.trim() || undefined,
                        }),
                      "Deal cloture.",
                    )
                  }
                  type="button"
                >
                  Cloturer le deal
                </button>
              </section>
            </div>

            {selected.images?.length ? (
              <section className="admin-data-card">
                <div className="admin-section-heading">
                  <div>
                    <p>Photos</p>
                    <h3>Images envoyees</h3>
                  </div>
                </div>
                <div className="second-hand-photo-grid">
                  {selected.images.map((image) => (
                    <img
                      alt={`${selected.item_type} ${selected.brand}`}
                      key={image.id || image.image_url}
                      src={absoluteImageUrl(image.image_url)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function Pagination({
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
  return (
    <div className="admin-pagination cashier-pagination">
      <span>
        Page <strong>{page}</strong> / {totalPages} - {total} ligne(s)
      </span>
      <select
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        value={pageSize}
      >
        <option value={10}>10 lignes</option>
        <option value={20}>20 lignes</option>
        <option value={50}>50 lignes</option>
      </select>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        type="button"
      >
        Precedent
      </button>
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
