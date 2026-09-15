import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type PaymentRow = {
  id: number;
  payment_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  order_number: string | null;
  gift_card_serial: string | null;
  gift_card_name: string | null;
  purpose: string;
  method: string;
  amount_eur: number;
  status: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  failure_message: string | null;
  succeeded_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

const paymentStatuses = [
  ["all", "Tous les statuts"],
  ["succeeded", "Reussis"],
  ["pending", "En attente"],
  ["requires_action", "Action requise"],
  ["failed", "Echecs"],
  ["cancelled", "Annules"],
  ["refunded", "Rembourses"],
];

const methods = [
  ["all", "Toutes les methodes"],
  ["stripe", "Stripe"],
  ["gift_card", "Carte cadeau"],
];

const purposes = [
  ["all", "Tous les usages"],
  ["order", "Commande"],
  ["gift_card_purchase", "Achat carte cadeau"],
  ["rental_fee", "Location"],
  ["rental_deposit", "Caution"],
  ["other", "Autre"],
];

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    cancelled: "Annule",
    failed: "Echec",
    pending: "En attente",
    refunded: "Rembourse",
    requires_action: "Action requise",
    reserved: "Reserve",
    succeeded: "Reussi",
  };
  return labels[value] || value;
}

function purposeLabel(value: string) {
  const labels: Record<string, string> = {
    gift_card_purchase: "Achat carte cadeau",
    order: "Commande",
    other: "Autre",
    rental_damage_fee: "Frais degat",
    rental_deposit: "Caution location",
    rental_fee: "Location",
    rental_late_fee: "Retard location",
  };
  return labels[value] || value;
}

export default function PaymentsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [purpose, setPurpose] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    if (method !== "all") params.set("method", method);
    if (purpose !== "all") params.set("purpose", purpose);
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);

    get<PaymentRow[]>(`/payments?${params.toString()}`)
      .then((rows) => {
        if (active) setPayments(rows || []);
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
  }, [createdFrom, createdTo, method, purpose, search, status]);

  const totals = useMemo(
    () => ({
      count: payments.length,
      succeeded: payments.filter((payment) => payment.status === "succeeded")
        .length,
      pending: payments.filter((payment) =>
        ["pending", "requires_action", "reserved"].includes(payment.status),
      ).length,
      failed: payments.filter((payment) =>
        ["failed", "cancelled"].includes(payment.status),
      ).length,
      amount: payments
        .filter((payment) => payment.status === "succeeded")
        .reduce((sum, payment) => sum + Number(payment.amount_eur || 0), 0),
    }),
    [payments],
  );

  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedPayments = payments.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-payments-page">
        <section className="admin-hero">
          <div>
            <p>Finances</p>
            <h2>Paiements et recettes</h2>
            <span>
              Controlez Stripe, cartes cadeaux, paiements reussis, echecs,
              remboursements et commandes liees.
            </span>
          </div>
          <button onClick={() => go("admin-orders")} type="button">
            Voir commandes
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Paiements</span>
            <strong>{loading ? "..." : totals.count}</strong>
          </article>
          <article>
            <span>Reussis</span>
            <strong>{totals.succeeded}</strong>
          </article>
          <article>
            <span>En attente</span>
            <strong>{totals.pending}</strong>
          </article>
          <article>
            <span>Montant reussi</span>
            <strong>{eur(totals.amount)}</strong>
          </article>
        </section>

        <section className="admin-product-filters admin-payment-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Reference, commande, client, carte..."
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
              {paymentStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Methode
            <select
              onChange={(event) => {
                setMethod(event.target.value);
                setTablePage(1);
              }}
              value={method}
            >
              {methods.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Usage
            <select
              onChange={(event) => {
                setPurpose(event.target.value);
                setTablePage(1);
              }}
              value={purpose}
            >
              {purposes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Du
            <input
              onChange={(event) => {
                setCreatedFrom(event.target.value);
                setTablePage(1);
              }}
              type="date"
              value={createdFrom}
            />
          </label>
          <label>
            Au
            <input
              onChange={(event) => {
                setCreatedTo(event.target.value);
                setTablePage(1);
              }}
              type="date"
              value={createdTo}
            />
          </label>
        </section>

        {error && <p className="admin-error-message">{error}</p>}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Transactions</p>
              <h3>Paiements</h3>
            </div>
            <strong>{payments.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-payments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Paiement</th>
                  <th>Client</th>
                  <th>Commande / carte</th>
                  <th>Methode</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <strong>{payment.payment_reference}</strong>
                      <small>{purposeLabel(payment.purpose)}</small>
                      <span>{dateTime(payment.created_at)}</span>
                    </td>
                    <td>
                      <strong>{payment.customer_name}</strong>
                      <small>{payment.customer_email}</small>
                      <small>{payment.customer_phone || ""}</small>
                    </td>
                    <td>
                      <strong>{payment.order_number || "-"}</strong>
                      <small>
                        {payment.gift_card_name
                          ? `${payment.gift_card_name} - ${payment.gift_card_serial}`
                          : "Aucune carte cadeau"}
                      </small>
                    </td>
                    <td>{payment.method === "stripe" ? "Stripe" : "Carte cadeau"}</td>
                    <td>
                      <strong>{eur(payment.amount_eur)}</strong>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${payment.status}`}>
                        {statusLabel(payment.status)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => setSelectedPayment(payment)}
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
            {!payments.length && (
              <div className="admin-empty-state">
                <strong>Aucun paiement trouve</strong>
                <p>Les transactions Stripe et cartes cadeaux apparaitront ici.</p>
              </div>
            )}
            {payments.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={payments.length}
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

        {selectedPayment && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal compact" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Paiement</p>
                  <h3>{selectedPayment.payment_reference}</h3>
                </div>
                <button onClick={() => setSelectedPayment(null)} type="button">
                  Fermer
                </button>
              </div>
              <div className="admin-payment-detail">
                <Detail label="Client" value={selectedPayment.customer_name} />
                <Detail label="Email" value={selectedPayment.customer_email} />
                <Detail label="Usage" value={purposeLabel(selectedPayment.purpose)} />
                <Detail
                  label="Methode"
                  value={
                    selectedPayment.method === "stripe"
                      ? "Stripe"
                      : "Carte cadeau"
                  }
                />
                <Detail label="Montant" value={eur(selectedPayment.amount_eur)} />
                <Detail label="Statut" value={statusLabel(selectedPayment.status)} />
                <Detail
                  label="Commande"
                  value={selectedPayment.order_number || "-"}
                />
                <Detail
                  label="Carte cadeau"
                  value={selectedPayment.gift_card_serial || "-"}
                />
                <Detail
                  label="Session Stripe"
                  value={selectedPayment.stripe_checkout_session_id || "-"}
                />
                <Detail
                  label="Payment Intent"
                  value={selectedPayment.stripe_payment_intent_id || "-"}
                />
                <Detail
                  label="Reussi le"
                  value={dateTime(selectedPayment.succeeded_at)}
                />
                <Detail
                  label="Erreur"
                  value={selectedPayment.failure_message || "-"}
                />
              </div>
            </section>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
