import { useCallback, useEffect, useMemo, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get, put } from "../../services/api";
import { downloadReceipt } from "../../utils/receipts";
import {
  dateOnly,
  eur,
  isPastRental,
  statusLabel,
  type CashierPageProps,
} from "./cashierUtils";

type RentalRow = {
  order_item_id: number;
  branch_id: number | null;
  order_number: string;
  product_name: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  rental_start_date: string;
  rental_end_date: string;
  rental_days: number;
  rental_status: string;
  rental_price_per_day_eur: number;
  rental_deposit_eur: number;
  rental_late_fee_eur: number | null;
  rental_damage_fee_eur: number | null;
  line_total_eur: number;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  customer_name: string;
  customer_email: string;
  branch_name: string | null;
  pickup_cashier_name: string | null;
  return_cashier_name: string | null;
  image_url: string;
};

type CashierProfile = {
  branch_id: number | null;
  branch_name?: string | null;
  branch_city?: string | null;
};

const statusOptions = [
  "reserved",
  "ready_for_pickup",
  "active",
  "return_due",
  "overdue",
  "returned",
  "damaged",
  "lost",
  "cancelled",
];

function canActOnRental(
  rental: Pick<RentalRow, "branch_id">,
  profile: CashierProfile | null,
) {
  if (!profile?.branch_id) return false;
  return (
    !rental.branch_id || Number(rental.branch_id) === Number(profile.branch_id)
  );
}

export default function RentalsPage(props: CashierPageProps) {
  const [rows, setRows] = useState<RentalRow[]>([]);
  const [cashierProfile, setCashierProfile] = useState<CashierProfile | null>(
    null,
  );
  const [scope, setScope] = useState<"upcoming" | "past" | "all">("upcoming");
  const [cashierScope, setCashierScope] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRows = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    if (cashierScope !== "all") params.set("cashier_scope", cashierScope);
    get<RentalRow[]>(`/rentals?${params.toString()}`)
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [cashierScope, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadRows, 220);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  useEffect(() => {
    get<CashierProfile>("/users/me")
      .then((profile) => setCashierProfile(profile))
      .catch(() => setCashierProfile(null));
  }, []);

  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(a.rental_start_date).getTime() -
        new Date(b.rental_start_date).getTime(),
    );
    if (scope === "past") {
      return sorted.filter(
        (row) =>
          isPastRental(row.rental_end_date) ||
          ["returned", "damaged", "lost", "cancelled"].includes(
            row.rental_status,
          ),
      );
    }
    if (scope === "upcoming") {
      return sorted.filter(
        (row) =>
          !isPastRental(row.rental_end_date) &&
          !["returned", "damaged", "lost", "cancelled"].includes(
            row.rental_status,
          ),
      );
    }
    return sorted;
  }, [rows, scope]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const branchLabel = cashierProfile?.branch_name
    ? [cashierProfile.branch_name, cashierProfile.branch_city]
        .filter(Boolean)
        .join(" - ")
    : "Aucun guichet";

  const stats = useMemo(
    () => ({
      upcoming: rows.filter((row) => !isPastRental(row.rental_end_date)).length,
      past: rows.filter((row) => isPastRental(row.rental_end_date)).length,
      active: rows.filter((row) =>
        ["active", "return_due", "overdue"].includes(row.rental_status),
      ).length,
      total: rows.reduce((sum, row) => sum + Number(row.line_total_eur || 0), 0),
    }),
    [rows],
  );

  async function updateStatus(row: RentalRow, nextStatus: string) {
    if (!canActOnRental(row, cashierProfile)) {
      setError("Action impossible: cette location n'est pas dans votre guichet.");
      return;
    }

    setSavingId(row.order_item_id);
    setError("");
    setNotice("");
    try {
      await put(`/rentals/${row.order_item_id}/status`, {
        status: nextStatus,
      });
      setNotice(`${row.product_name} mis a jour.`);
      loadRows();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Locations</p>
            <h2>Articles loues</h2>
            <span>
              Controlez les remises, retours, cautions, retards et statuts des
              vetements loues dans le guichet.
            </span>
            <small className="cashier-hero-branch">
              Votre guichet: {branchLabel}
            </small>
          </div>
          <button onClick={loadRows} type="button">
            Actualiser
          </button>
        </section>

        {notice ? <div className="cashier-success">{notice}</div> : null}
        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          <article>
            <span>A venir / en cours</span>
            <strong>{loading ? "..." : stats.upcoming}</strong>
          </article>
          <article>
            <span>Passees</span>
            <strong>{stats.past}</strong>
          </article>
          <article>
            <span>Actives / retards</span>
            <strong>{stats.active}</strong>
          </article>
          <article>
            <span>Total location</span>
            <strong>{eur(stats.total)}</strong>
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
              placeholder="Commande, client, produit..."
              value={search}
            />
          </label>
          <label>
            Perimetre
            <select
              onChange={(event) => {
                setCashierScope(event.target.value);
                setTablePage(1);
              }}
              value={cashierScope}
            >
              <option value="all">Toutes les locations</option>
              <option value="own">Mon guichet</option>
              <option value="unassigned">Non assignees</option>
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
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {statusLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="cashier-tabs">
            {[
              ["upcoming", "A venir / en cours"],
              ["past", "Passees"],
              ["all", "Toutes"],
            ].map(([id, label]) => (
              <button
                className={scope === id ? "active" : ""}
                key={id}
                onClick={() => {
                  setScope(id as typeof scope);
                  setTablePage(1);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="cashier-panel">
          <div className="cashier-panel-head">
            <div>
              <p>Calendrier location</p>
              <h3>Vetements loues</h3>
            </div>
            <strong>{filteredRows.length}</strong>
          </div>
          <div className="cashier-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Article</th>
                  <th>Client</th>
                  <th>Dates</th>
                  <th>Prix</th>
                  <th>Guichet</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={row.order_item_id}>
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
                      {row.customer_name}
                      <small>{row.customer_email}</small>
                      <small>Beneficiaire: {row.beneficiary_name}</small>
                    </td>
                    <td>
                      {dateOnly(row.rental_start_date)}
                      <small>Retour: {dateOnly(row.rental_end_date)}</small>
                      <small>{row.rental_days} jour(s)</small>
                    </td>
                    <td>
                      {eur(row.line_total_eur)}
                      <small>{eur(row.rental_price_per_day_eur)} / jour</small>
                      <small>Caution: {eur(row.rental_deposit_eur)}</small>
                    </td>
                    <td>
                      {row.branch_name || "Guichet non assigne"}
                      <small>Remise: {row.pickup_cashier_name || "-"}</small>
                      <small>Retour: {row.return_cashier_name || "-"}</small>
                      {!canActOnRental(row, cashierProfile) ? (
                        <small>Lecture seule</small>
                      ) : !row.branch_id ? (
                        <small>Premiere action: {branchLabel}</small>
                      ) : null}
                    </td>
                    <td>
                      <span className="cashier-status">
                        {statusLabel(row.rental_status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          void downloadReceipt(
                            "rental",
                            row.order_item_id,
                          ).catch((requestError: Error) =>
                            setError(requestError.message),
                          )
                        }
                        type="button"
                      >
                        Recu PDF
                      </button>
                      <select
                        disabled={
                          savingId === row.order_item_id ||
                          !canActOnRental(row, cashierProfile)
                        }
                        onChange={(event) => updateStatus(row, event.target.value)}
                        value={row.rental_status}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {statusLabel(option)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!filteredRows.length ? (
                  <tr>
                    <td colSpan={8}>Aucune location trouvee.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!loading && filteredRows.length > 0 ? (
            <div className="cashier-pagination">
              <span>
                {Math.min((safePage - 1) * pageSize + 1, filteredRows.length)}-
                {Math.min(safePage * pageSize, filteredRows.length)} sur{" "}
                {filteredRows.length}
              </span>
              <select
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setTablePage(1);
                }}
                value={pageSize}
              >
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
              </select>
              <button
                disabled={safePage <= 1}
                onClick={() => setTablePage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Precedent
              </button>
              <strong>
                Page {safePage} / {totalPages}
              </strong>
              <button
                disabled={safePage >= totalPages}
                onClick={() =>
                  setTablePage((current) => Math.min(totalPages, current + 1))
                }
                type="button"
              >
                Suivant
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </CashierLayout>
  );
}
