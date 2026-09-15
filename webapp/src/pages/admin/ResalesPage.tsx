import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, put } from "../../services/api";
import { downloadReceipt } from "../../utils/receipts";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type Branch = {
  id: number;
  name: string;
  city: string;
};

type ResaleRow = {
  id: number;
  order_number: string;
  product_name: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  line_total_eur: number;
  amount_eur: number;
  payout_amount_aoa: number;
  exchange_rate_eur_to_aoa: number;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  branch_name: string;
  branch_city: string | null;
  cashier_name: string | null;
  cashier_email: string | null;
  approved_by_name: string | null;
  identity_document_type: string | null;
  identity_document_number: string | null;
  notes: string | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  image_url: string;
};

const resaleStatuses = [
  ["", "Tous les statuts"],
  ["pending", "En attente"],
  ["approved", "Approuvee"],
  ["ready_for_payout", "Prete paiement"],
  ["paid", "Recuperee / payee"],
  ["rejected", "Refusee"],
  ["cancelled", "Annulee"],
];

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function aoa(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} ${
    localStorage.getItem("ak_display_currency") || "AOA"
  }`;
}

function dateTime(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(String(value)));
}

function statusLabel(status: string) {
  return resaleStatuses.find(([id]) => id === status)?.[1] || status || "-";
}

export default function ResalesPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [resales, setResales] = useState<ResaleRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const listPath = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (branchId) params.set("branch_id", branchId);
    return `/resales?${params.toString()}`;
  }, [branchId, query, status]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([get<ResaleRow[]>(listPath), get<Branch[]>("/branches?admin=1")])
      .then(([resaleRows, branchRows]) => {
        if (!active) return;
        setResales(resaleRows || []);
        setBranches(branchRows || []);
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
  }, [listPath]);

  const visibleResales = useMemo(
    () =>
      [...resales].sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      ),
    [resales],
  );
  const totalPages = Math.max(1, Math.ceil(visibleResales.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedResales = visibleResales.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => ({
      total: resales.length,
      pending: resales.filter((item) =>
        ["pending", "approved", "ready_for_payout"].includes(item.status),
      ).length,
      recovered: resales.filter((item) => item.status === "paid").length,
      payoutAoa: resales.reduce(
        (total, item) => total + Number(item.payout_amount_aoa || 0),
        0,
      ),
    }),
    [resales],
  );

  function resetPage() {
    setTablePage(1);
  }

  function updateStatus(resale: ResaleRow, nextStatus: string) {
    if (nextStatus === "paid") return;
    setSavingId(resale.id);
    setError("");
    setSuccess("");
    put(`/resales/${resale.id}/status`, {
      status: nextStatus,
      notes: `Mise a jour admin: ${statusLabel(nextStatus)}`,
    })
      .then(() => get<ResaleRow[]>(listPath))
      .then((rows) => {
        setResales(rows || []);
        setSuccess("Revente mise a jour.");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSavingId(null));
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-resales-page">
        <section className="admin-hero">
          <div>
            <p>Reventes</p>
            <h2>Reventes AK Fashion Plus</h2>
            <span>
              Suivez uniquement les articles marques "revendre a AK Fashion
              Plus", avec statut de recuperation, guichet, caissier et valeur
              {localStorage.getItem("ak_display_currency") || "AOA"}.
            </span>
          </div>
          <button onClick={() => go("admin-orders")} type="button">
            Voir commandes
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Operations</span>
            <strong>{loading ? "..." : stats.total}</strong>
          </article>
          <article>
            <span>A recuperer / payer</span>
            <strong>{loading ? "..." : stats.pending}</strong>
          </article>
          <article>
            <span>Recuperees</span>
            <strong>{loading ? "..." : stats.recovered}</strong>
          </article>
          <article>
            <span>Total {localStorage.getItem("ak_display_currency") || "AOA"}</span>
            <strong>{loading ? "..." : aoa(stats.payoutAoa)}</strong>
          </article>
        </section>

        <section className="admin-product-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Commande, client, produit, beneficiaire..."
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
              {resaleStatuses.map(([id, label]) => (
                <option key={id || "all"} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Guichet
            <select
              onChange={(event) => {
                setBranchId(event.target.value);
                resetPage();
              }}
              value={branchId}
            >
              <option value="">Tous les guichets</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error && <p className="admin-error-message">{error}</p>}
        {success && <p className="admin-success-message">{success}</p>}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Guichet {localStorage.getItem("ak_display_currency") || "AOA"}</p>
              <h3>Articles a revendre</h3>
            </div>
            <strong>{visibleResales.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-resales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Article</th>
                  <th>Client</th>
                  <th>Beneficiaire</th>
                  <th>Montants</th>
                  <th>Recuperation</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResales.map((resale, index) => (
                  <tr key={resale.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="admin-line-with-image">
                        {resale.image_url ? (
                          <img alt={resale.product_name} src={resale.image_url} />
                        ) : (
                          <i>{resale.product_name.slice(0, 2).toUpperCase()}</i>
                        )}
                        <span>
                          <strong>{resale.product_name}</strong>
                          <small>
                            {resale.sku} - {resale.size || "-"} /{" "}
                            {resale.color || "-"}
                          </small>
                          <small>{resale.order_number}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{resale.customer_name}</strong>
                      <small>{resale.customer_email}</small>
                      <small>{resale.customer_phone || "-"}</small>
                    </td>
                    <td>
                      <strong>{resale.beneficiary_name}</strong>
                      <small>{resale.beneficiary_phone || "-"}</small>
                      <small>Demande: {dateTime(resale.requested_at)}</small>
                    </td>
                    <td>
                      <strong>{aoa(resale.payout_amount_aoa)}</strong>
                      <small>Valeur EUR: {eur(resale.amount_eur)}</small>
                      <small>
                        Taux: {Number(resale.exchange_rate_eur_to_aoa || 0)}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {resale.status === "paid"
                          ? "Article recupere et paye"
                          : "Non finalise"}
                      </strong>
                      <small>Guichet: {resale.branch_name}</small>
                      <small>Ville: {resale.branch_city || "-"}</small>
                      <small>
                        Caissier: {resale.cashier_name || "Non renseigne"}
                      </small>
                      <small>Paiement: {dateTime(resale.paid_at)}</small>
                      <small>
                        Document: {resale.identity_document_type || "-"}{" "}
                        {resale.identity_document_number || ""}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${resale.status}`}>
                        {statusLabel(resale.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          void downloadReceipt("resale", resale.id).catch(
                            (requestError: Error) =>
                              setError(requestError.message),
                          )
                        }
                        type="button"
                      >
                        Recu PDF
                      </button>
                      <select
                        disabled={
                          savingId === resale.id || resale.status === "paid"
                        }
                        onChange={(event) =>
                          updateStatus(resale, event.target.value)
                        }
                        value={resale.status}
                      >
                        {resaleStatuses
                          .filter(([id]) => id && id !== "paid")
                          .map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        {resale.status === "paid" && (
                          <option value="paid">Recuperee / payee</option>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !visibleResales.length && (
              <div className="admin-empty-state">
                <strong>Aucune revente trouvee</strong>
                <p>
                  Les articles apparaitront ici uniquement si le client a choisi
                  l'option revendre a AK Fashion Plus pendant sa commande.
                </p>
              </div>
            )}
            {visibleResales.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={visibleResales.length}
                totalPages={totalPages}
                onPageChange={setTablePage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  resetPage();
                }}
              />
            )}
          </div>
        </section>
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
