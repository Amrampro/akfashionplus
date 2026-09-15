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

type RentalRow = {
  order_item_id: number;
  order_number: string;
  product_name: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_days: number | null;
  rental_status: string;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number;
  rental_late_fee_eur: number;
  rental_damage_fee_eur: number;
  line_total_eur: number;
  rental_picked_up_at: string | null;
  rental_returned_at: string | null;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  beneficiary_name: string | null;
  branch_name: string | null;
  pickup_completed_at: string | null;
  pickup_branch_name: string | null;
  pickup_cashier_name: string | null;
  return_completed_at: string | null;
  return_branch_name: string | null;
  return_cashier_name: string | null;
  image_url: string;
};

const rentalStatuses = [
  ["", "Tous les statuts"],
  ["reserved", "Reservee"],
  ["ready_for_pickup", "Prete retrait"],
  ["active", "Recuperee / active"],
  ["return_due", "Retour attendu"],
  ["overdue", "En retard"],
  ["returned", "Retournee"],
  ["damaged", "Abimee"],
  ["lost", "Perdue"],
  ["cancelled", "Annulee"],
];

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(String(value)),
  );
}

function dateTime(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(String(value)));
}

function dayTime(value: unknown, fallback = "9999-12-31") {
  const raw = String(value || fallback);
  if (raw.includes("T")) {
    const dateValue = new Date(raw);
    if (!Number.isNaN(dateValue.getTime())) {
      return new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
      ).getTime();
    }
  }

  const [year, month, day] = raw.slice(0, 10).split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day).getTime();
  }

  return dayTime(fallback);
}

function isOpenRental(status: string) {
  return ["ready_for_pickup", "active", "return_due", "overdue"].includes(
    status,
  );
}

function isClosedRental(status: string) {
  return ["returned", "damaged", "lost", "cancelled"].includes(status);
}

function statusLabel(status: string) {
  return rentalStatuses.find(([id]) => id === status)?.[1] || status || "-";
}

export default function RentalsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
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
    return `/rentals?${params.toString()}`;
  }, [branchId, query, status]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([get<RentalRow[]>(listPath), get<Branch[]>("/branches?admin=1")])
      .then(([rentalRows, branchRows]) => {
        if (!active) return;
        setRentals(rentalRows || []);
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

  const todayTime = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current.getTime();
  }, []);

  const visibleRentals = useMemo(() => {
    return rentals
      .filter((rental) => {
        const endTime = rental.rental_end_date
          ? dayTime(rental.rental_end_date)
          : null;
        if (view === "past") {
          return (
            isClosedRental(rental.rental_status) ||
            Boolean(endTime && endTime < todayTime && !isOpenRental(rental.rental_status))
          );
        }
        if (view === "upcoming") {
          return (
            isOpenRental(rental.rental_status) ||
            !endTime ||
            endTime >= todayTime
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = dayTime(a.rental_start_date || a.rental_end_date);
        const dateB = dayTime(b.rental_start_date || b.rental_end_date);
        return view === "past" ? dateB - dateA : dateA - dateB;
      });
  }, [rentals, todayTime, view]);

  const totalPages = Math.max(1, Math.ceil(visibleRentals.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedRentals = visibleRentals.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => ({
      upcoming: rentals.filter((item) => {
        const endTime = item.rental_end_date ? dayTime(item.rental_end_date) : null;
        return isOpenRental(item.rental_status) || !endTime || endTime >= todayTime;
      }).length,
      past: rentals.filter((item) => {
        const endTime = item.rental_end_date ? dayTime(item.rental_end_date) : null;
        return (
          isClosedRental(item.rental_status) ||
          Boolean(endTime && endTime < todayTime && !isOpenRental(item.rental_status))
        );
      }).length,
      active: rentals.filter((item) =>
        ["active", "return_due", "overdue"].includes(item.rental_status),
      ).length,
      amount: rentals.reduce(
        (total, item) => total + Number(item.line_total_eur || 0),
        0,
      ),
    }),
    [rentals, todayTime],
  );

  function resetPage() {
    setTablePage(1);
  }

  function updateRentalStatus(rental: RentalRow, nextStatus: string) {
    setSavingId(rental.order_item_id);
    setError("");
    setSuccess("");
    put(`/rentals/${rental.order_item_id}/status`, {
      status: nextStatus,
      notes: `Mise a jour admin: ${statusLabel(nextStatus)}`,
    })
      .then(() => get<RentalRow[]>(listPath))
      .then((rows) => {
        setRentals(rows || []);
        setSuccess("Location mise a jour.");
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
      <section className="admin-rentals-page">
        <section className="admin-hero">
          <div>
            <p>Locations</p>
            <h2>Gestion des locations</h2>
            <span>
              Suivez les articles loues, dates de retrait, dates de retour,
              prix journalier, total, guichet et statut de recuperation.
            </span>
          </div>
          <button onClick={() => go("shop")} type="button">
            Voir le site
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>A venir / en cours</span>
            <strong>{loading ? "..." : stats.upcoming}</strong>
          </article>
          <article>
            <span>Locations passees</span>
            <strong>{loading ? "..." : stats.past}</strong>
          </article>
          <article>
            <span>Actives / retards</span>
            <strong>{loading ? "..." : stats.active}</strong>
          </article>
          <article>
            <span>Total location</span>
            <strong>{loading ? "..." : eur(stats.amount)}</strong>
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
              placeholder="Commande, client, produit..."
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
              {rentalStatuses.map(([id, label]) => (
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

        <div className="admin-view-tabs">
          {[
            ["upcoming", "A venir / en cours"],
            ["past", "Passees"],
            ["all", "Toutes"],
          ].map(([id, label]) => (
            <button
              className={view === id ? "active" : ""}
              key={id}
              onClick={() => {
                setView(id as typeof view);
                resetPage();
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="admin-error-message">{error}</p>}
        {success && <p className="admin-success-message">{success}</p>}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Calendrier location</p>
              <h3>Articles loues</h3>
            </div>
            <strong>{visibleRentals.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-rentals-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Article</th>
                  <th>Client</th>
                  <th>Dates</th>
                  <th>Prix</th>
                  <th>Recuperation</th>
                  <th>Retour</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRentals.map((rental, index) => (
                  <tr key={rental.order_item_id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="admin-line-with-image">
                        {rental.image_url ? (
                          <img alt={rental.product_name} src={rental.image_url} />
                        ) : (
                          <i>{rental.product_name.slice(0, 2).toUpperCase()}</i>
                        )}
                        <span>
                          <strong>{rental.product_name}</strong>
                          <small>
                            {rental.sku} - {rental.size || "-"} /{" "}
                            {rental.color || "-"}
                          </small>
                          <small>{rental.order_number}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{rental.customer_name}</strong>
                      <small>{rental.customer_email}</small>
                      <small>
                        Beneficiaire: {rental.beneficiary_name || "-"}
                      </small>
                    </td>
                    <td>
                      <strong>{date(rental.rental_start_date)}</strong>
                      <small>Retour: {date(rental.rental_end_date)}</small>
                      <small>{rental.rental_days || 0} jour(s)</small>
                    </td>
                    <td>
                      <strong>{eur(rental.line_total_eur)}</strong>
                      <small>
                        {eur(rental.rental_price_per_day_eur)} / jour
                      </small>
                      <small>Caution: {eur(rental.rental_deposit_eur)}</small>
                    </td>
                    <td>
                      <strong>
                        {rental.rental_picked_up_at ||
                        rental.pickup_completed_at
                          ? "Recupere"
                          : "Non recupere"}
                      </strong>
                      <small>
                        {dateTime(
                          rental.rental_picked_up_at ||
                            rental.pickup_completed_at,
                        )}
                      </small>
                      <small>
                        {rental.pickup_branch_name ||
                          rental.branch_name ||
                          "Guichet non renseigne"}
                      </small>
                      <small>
                        {rental.pickup_cashier_name
                          ? `Caissier: ${rental.pickup_cashier_name}`
                          : "Caissier non renseigne"}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {rental.rental_returned_at || rental.return_completed_at
                          ? "Retourne"
                          : "Non retourne"}
                      </strong>
                      <small>
                        {dateTime(
                          rental.rental_returned_at ||
                            rental.return_completed_at,
                        )}
                      </small>
                      <small>
                        {rental.return_branch_name ||
                          rental.branch_name ||
                          "Guichet non renseigne"}
                      </small>
                      <small>
                        {rental.return_cashier_name
                          ? `Caissier: ${rental.return_cashier_name}`
                          : "Caissier non renseigne"}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${rental.rental_status}`}>
                        {statusLabel(rental.rental_status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          void downloadReceipt(
                            "rental",
                            rental.order_item_id,
                          ).catch((requestError: Error) =>
                            setError(requestError.message),
                          )
                        }
                        type="button"
                      >
                        Recu PDF
                      </button>
                      <select
                        disabled={savingId === rental.order_item_id}
                        onChange={(event) =>
                          updateRentalStatus(rental, event.target.value)
                        }
                        value={rental.rental_status}
                      >
                        {rentalStatuses
                          .filter(([id]) => id)
                          .map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !visibleRentals.length && (
              <div className="admin-empty-state">
                <strong>Aucune location trouvee</strong>
                <p>Les articles loues apparaitront ici apres commande.</p>
              </div>
            )}
            {visibleRentals.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={visibleRentals.length}
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
