import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get, post } from "../../services/api";
import { downloadReceipt } from "../../utils/receipts";
import {
  aoa,
  dateTime,
  eur,
  statusLabel,
  type CashierPageProps,
} from "./cashierUtils";

type ResaleRow = {
  id: number;
  order_number: string;
  product_name: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  amount_eur: number;
  exchange_rate_eur_to_aoa: number;
  payout_amount_aoa: number;
  status: string;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  customer_name: string;
  customer_email: string;
  branch_name: string;
  cashier_name: string | null;
  approved_by_name: string | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  image_url: string;
};

const payoutStatuses = ["all", "approved", "ready_for_payout", "paid", "rejected"];

export default function ResalePayoutsPage(props: CashierPageProps) {
  const [rows, setRows] = useState<ResaleRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<ResaleRow | null>(null);
  const [documentType, setDocumentType] = useState("BI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadRows = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    get<ResaleRow[]>(`/resales?${params.toString()}`)
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadRows, 220);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      payable: rows.filter((row) =>
        ["approved", "ready_for_payout"].includes(row.status),
      ).length,
      paid: rows.filter((row) => row.status === "paid").length,
      amount: rows
        .filter((row) => ["approved", "ready_for_payout"].includes(row.status))
        .reduce((sum, row) => sum + Number(row.payout_amount_aoa || 0), 0),
    }),
    [rows],
  );

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      ),
    [rows],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedRows = sortedRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  async function paySelected(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await post(`/resales/${selected.id}/pay`, {
        identity_document_type: documentType,
        identity_document_number: documentNumber.trim() || null,
        notes: notes.trim() || null,
      });
      setNotice(`Paiement ${selected.order_number} enregistre.`);
      setSelected(null);
      setDocumentNumber("");
      setNotes("");
      loadRows();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Reventes AK</p>
            <h2>Paiements revente</h2>
            <span>
              Payez au guichet les montants{" "}
              {localStorage.getItem("ak_display_currency") || "AOA"} associes aux commandes ou le
              client a choisi l'option revendre a AK Fashion Plus.
            </span>
          </div>
          <button onClick={loadRows} type="button">
            Actualiser
          </button>
        </section>

        {notice ? <div className="cashier-success">{notice}</div> : null}
        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          <article>
            <span>Operations</span>
            <strong>{loading ? "..." : stats.total}</strong>
          </article>
          <article>
            <span>A payer</span>
            <strong>{stats.payable}</strong>
          </article>
          <article>
            <span>Payees</span>
            <strong>{stats.paid}</strong>
          </article>
          <article>
            <span>Montant a payer</span>
            <strong>{aoa(stats.amount)}</strong>
          </article>
        </section>

        <section className="cashier-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Commande, client, beneficiaire, produit..."
              value={search}
            />
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
              {payoutStatuses.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Tous les statuts" : statusLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="cashier-panel">
          <div className="cashier-panel-head">
            <div>
              <p>Guichet {localStorage.getItem("ak_display_currency") || "AOA"}</p>
              <h3>Reventes a traiter</h3>
            </div>
            <strong>{sortedRows.length}</strong>
          </div>
          <div className="cashier-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Article</th>
                  <th>Beneficiaire</th>
                  <th>Montants</th>
                  <th>Guichet</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="cashier-product-cell">
                        {row.image_url ? (
                          <img alt={row.product_name} src={row.image_url} />
                        ) : (
                          <i>{row.product_name.slice(0, 2)}</i>
                        )}
                        <div>
                          <strong>{row.product_name}</strong>
                          <small>
                            {row.sku || "-"} - {row.size || "-"} /{" "}
                            {row.color || "-"}
                          </small>
                          <small>{row.order_number}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {row.beneficiary_name}
                      <small>{row.beneficiary_phone || "-"}</small>
                      <small>{row.customer_email}</small>
                    </td>
                    <td>
                      {aoa(row.payout_amount_aoa)}
                      <small>{eur(row.amount_eur)}</small>
                      <small>
                        Taux: {Number(row.exchange_rate_eur_to_aoa || 0)}
                      </small>
                    </td>
                    <td>
                      {row.branch_name}
                      <small>Caissier: {row.cashier_name || "-"}</small>
                    </td>
                    <td>
                      <span className="cashier-status">
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setSelected(row)} type="button">
                        Ouvrir
                      </button>
                      <button
                        onClick={() =>
                          void downloadReceipt("resale", row.id).catch(
                            (requestError: Error) =>
                              setError(requestError.message),
                          )
                        }
                        type="button"
                      >
                        Recu PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {!sortedRows.length ? (
                  <tr>
                    <td colSpan={7}>Aucune revente trouvee.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {sortedRows.length > 0 && (
            <div className="cashier-pagination">
              <span>
                Page <strong>{safePage}</strong> / {totalPages}
              </span>
              <select
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setTablePage(1);
                }}
                value={pageSize}
              >
                <option value={10}>10 lignes</option>
                <option value={20}>20 lignes</option>
                <option value={50}>50 lignes</option>
              </select>
              <button
                disabled={safePage <= 1}
                onClick={() => setTablePage((pageNumber) => pageNumber - 1)}
                type="button"
              >
                Precedent
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setTablePage((pageNumber) => pageNumber + 1)}
                type="button"
              >
                Suivant
              </button>
            </div>
          )}
        </section>

        {selected ? (
          <div className="cashier-modal-backdrop" role="presentation">
            <form className="cashier-modal" onSubmit={paySelected}>
              <div className="cashier-panel-head">
                <div>
                  <p>Detail revente</p>
                  <h3>{selected.order_number}</h3>
                </div>
                <button onClick={() => setSelected(null)} type="button">
                  Fermer
                </button>
              </div>
              <div className="cashier-detail-grid">
                <article>
                  <span>Produit</span>
                  <strong>{selected.product_name}</strong>
                  <small>{selected.sku || "-"}</small>
                </article>
                <article>
                  <span>Beneficiaire</span>
                  <strong>{selected.beneficiary_name}</strong>
                  <small>{selected.beneficiary_phone || "-"}</small>
                </article>
                <article>
                  <span>
                    Montant {localStorage.getItem("ak_display_currency") || "AOA"}
                  </span>
                  <strong>{aoa(selected.payout_amount_aoa)}</strong>
                  <small>{eur(selected.amount_eur)}</small>
                </article>
                <article>
                  <span>Dates</span>
                  <strong>{dateTime(selected.requested_at)}</strong>
                  <small>Paye: {dateTime(selected.paid_at)}</small>
                </article>
              </div>
              <div className="cashier-form-grid">
                <label>
                  Type document
                  <select
                    onChange={(event) => setDocumentType(event.target.value)}
                    value={documentType}
                  >
                    <option value="BI">BI</option>
                    <option value="passport">Passeport</option>
                    <option value="driver_license">Permis</option>
                  </select>
                </label>
                <label>
                  Numero document
                  <input
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    value={documentNumber}
                  />
                </label>
              </div>
              <label>
                Notes paiement
                <textarea
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>
              <button
                disabled={
                  saving ||
                  selected.status === "paid" ||
                  !["approved", "ready_for_payout"].includes(selected.status)
                }
                type="submit"
              >
                {saving
                  ? "Enregistrement..."
                  : `Confirmer paiement ${
                      localStorage.getItem("ak_display_currency") || "AOA"
                    }`}
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </CashierLayout>
  );
}
