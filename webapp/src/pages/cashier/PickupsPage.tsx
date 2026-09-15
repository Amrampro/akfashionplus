import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get, post, put } from "../../services/api";
import { downloadReceipt } from "../../utils/receipts";
import {
  aoa,
  dateTime,
  eur,
  statusLabel,
  type CashierPageProps,
} from "./cashierUtils";

type OrderRow = {
  id: number;
  order_number: string;
  branch_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  branch_name: string | null;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  total_eur: number;
  total_aoa: number;
  items_count: number;
  rental_items_count: number;
  beneficiary_name: string | null;
  beneficiary_phone: string | null;
  created_at: string;
};

type CashierProfile = {
  branch_id: number | null;
  branch_name?: string | null;
  branch_city?: string | null;
};

type OrderItem = {
  id: number;
  product_name: string;
  image_url: string;
  image_alt_text: string | null;
  sku: string;
  item_type: "purchase" | "rental";
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price_eur: number;
  line_total_eur: number;
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_days: number | null;
};

type OrderDetails = OrderRow & {
  branch_city: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_city: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  items: OrderItem[];
};

const orderStatuses = [
  ["confirmed", "Confirmee"],
  ["processing", "En preparation"],
  ["ready_for_pickup", "Prete retrait"],
  ["shipped", "Expediee"],
  ["completed", "Terminee"],
  ["cancelled", "Annulee"],
];

const paymentStatuses = [
  ["", "Tous les paiements"],
  ["unpaid", "Non payee"],
  ["partially_paid", "Partiellement payee"],
  ["paid", "Payee"],
  ["failed", "Echec"],
  ["refunded", "Remboursee"],
];

function statusName(status: string) {
  return orderStatuses.find(([id]) => id === status)?.[1] || statusLabel(status);
}

function paymentName(status: string) {
  return paymentStatuses.find(([id]) => id === status)?.[1] || statusLabel(status);
}

function canActOnOrder(
  order: Pick<OrderRow, "branch_id">,
  profile: CashierProfile | null,
) {
  if (!profile?.branch_id) return false;
  return !order.branch_id || Number(order.branch_id) === Number(profile.branch_id);
}

export default function PickupsPage(props: CashierPageProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [cashierProfile, setCashierProfile] = useState<CashierProfile | null>(
    null,
  );
  const [selected, setSelected] = useState<OrderDetails | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [cashierScope, setCashierScope] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nextStatus, setNextStatus] = useState("ready_for_pickup");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (search.trim()) params.set("q", search.trim());
    if (status) params.set("status", status);
    if (paymentStatus) params.set("payment_status", paymentStatus);
    if (fulfillmentType) params.set("fulfillment_type", fulfillmentType);
    if (cashierScope !== "all") params.set("cashier_scope", cashierScope);
    return `/orders?${params.toString()}`;
  }, [cashierScope, fulfillmentType, paymentStatus, search, status]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError("");
    get<OrderRow[]>(listPath)
      .then((data) => setOrders(data || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [listPath]);

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, 220);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    get<CashierProfile>("/users/me")
      .then((profile) => setCashierProfile(profile))
      .catch(() => setCashierProfile(null));
  }, []);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [orders],
  );
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedOrders = sortedOrders.slice(
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
      total: orders.length,
      ready: orders.filter((order) => order.status === "ready_for_pickup")
        .length,
      paid: orders.filter((order) => order.payment_status === "paid").length,
      value: orders.reduce((sum, order) => sum + Number(order.total_eur || 0), 0),
    }),
    [orders],
  );

  function openOrder(orderId: number) {
    setSelected(null);
    setDetailsLoading(true);
    setError("");
    setNotice("");
    get<OrderDetails>(`/orders/${orderId}`)
      .then((details) => {
        setSelected(details);
        setNextStatus(details.status || "ready_for_pickup");
        setNotes("");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setDetailsLoading(false));
  }

  async function updateStatus(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!canActOnOrder(selected, cashierProfile)) {
      setError("Action impossible: cette commande n'est pas dans votre guichet.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await put(`/orders/${selected.id}/status`, {
        status: nextStatus,
        notes: notes.trim() || `Action guichet: ${statusName(nextStatus)}`,
      });
      setNotice(`Commande ${selected.order_number} mise a jour.`);
      setSelected(null);
      loadOrders();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function completePickup() {
    if (!selected) return;
    if (!canActOnOrder(selected, cashierProfile)) {
      setError("Action impossible: cette commande n'est pas dans votre guichet.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await post(`/cashier/pickups/${selected.id}/complete`, {
        notes: notes.trim() || "Remise confirmee au guichet.",
      });
      setNotice(`Retrait ${selected.order_number} confirme.`);
      setSelected(null);
      loadOrders();
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
            <p>Commandes</p>
            <h2>Commandes au guichet</h2>
            <span>
              Consultez les commandes, controlez le paiement, preparez le
              retrait, confirmez la remise ou mettez a jour le statut.
            </span>
            <small className="cashier-hero-branch">
              Votre guichet: {branchLabel}
            </small>
          </div>
          <button onClick={loadOrders} type="button">
            Actualiser
          </button>
        </section>

        {notice ? <div className="cashier-success">{notice}</div> : null}
        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          <article>
            <span>Commandes affichees</span>
            <strong>{loading ? "..." : stats.total}</strong>
          </article>
          <article>
            <span>Pretes retrait</span>
            <strong>{stats.ready}</strong>
          </article>
          <article>
            <span>Payees</span>
            <strong>{stats.paid}</strong>
          </article>
          <article>
            <span>Valeur</span>
            <strong>{eur(stats.value)}</strong>
          </article>
        </section>

        <section className="cashier-filters">
          <label>
            Recherche
            <input
              onChange={(event) => setSearch(event.target.value)}
              onInput={() => setTablePage(1)}
              placeholder="Reference, client, beneficiaire, telephone..."
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
              <option value="all">Toutes les commandes</option>
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
              <option value="">Tous les statuts</option>
              {orderStatuses.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Paiement
            <select
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setTablePage(1);
              }}
              value={paymentStatus}
            >
              {paymentStatuses.map(([id, label]) => (
                <option key={id || "all"} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mode
            <select
              onChange={(event) => {
                setFulfillmentType(event.target.value);
                setTablePage(1);
              }}
              value={fulfillmentType}
            >
              <option value="">Tous</option>
              <option value="pickup">Retrait guichet</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
        </section>

        <section className="cashier-panel">
          <div className="cashier-panel-head">
            <div>
              <p>Liste</p>
              <h3>Commandes disponibles</h3>
            </div>
            <strong>{orders.length}</strong>
          </div>
          <div className="cashier-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Commande</th>
                  <th>Client / beneficiaire</th>
                  <th>Mode</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <strong>{order.order_number}</strong>
                      <small>{dateTime(order.created_at)}</small>
                      <small>{order.items_count || 0} article(s)</small>
                    </td>
                    <td>
                      <strong>{order.customer_name}</strong>
                      <small>{order.customer_email}</small>
                      <small>
                        Beneficiaire: {order.beneficiary_name || "-"}{" "}
                        {order.beneficiary_phone || ""}
                      </small>
                    </td>
                    <td>
                      {order.fulfillment_type === "delivery"
                        ? "Livraison"
                        : "Retrait guichet"}
                      <small>{order.branch_name || "Guichet non assigne"}</small>
                    </td>
                    <td>
                      {eur(order.total_eur)}
                      <small>{aoa(order.total_aoa)}</small>
                    </td>
                    <td>
                      <span className="cashier-status">{statusName(order.status)}</span>
                      <small>{paymentName(order.payment_status)}</small>
                    </td>
                    <td>
                      <button onClick={() => openOrder(order.id)} type="button">
                        Ouvrir
                      </button>
                      <button
                        onClick={() =>
                          void downloadReceipt("order", order.id).catch(
                            (requestError: Error) =>
                              setError(requestError.message),
                          )
                        }
                        type="button"
                      >
                        Recu PDF
                      </button>
                      {!canActOnOrder(order, cashierProfile) ? (
                        <small>Lecture seule</small>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!loading && !orders.length ? (
                  <tr>
                    <td colSpan={7}>Aucune commande trouvee.</td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td colSpan={7}>Chargement des commandes...</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!loading && orders.length > 0 ? (
            <div className="cashier-pagination">
              <span>
                {Math.min((safePage - 1) * pageSize + 1, sortedOrders.length)}-
                {Math.min(safePage * pageSize, sortedOrders.length)} sur{" "}
                {sortedOrders.length}
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

        {(detailsLoading || selected) && (
          <div className="cashier-modal-backdrop" role="presentation">
            <form className="cashier-modal wide" onSubmit={updateStatus}>
              <div className="cashier-panel-head">
                <div>
                  <p>Commande</p>
                  <h3>{selected?.order_number || "Chargement..."}</h3>
                </div>
                <button onClick={() => setSelected(null)} type="button">
                  Fermer
                </button>
              </div>

              {detailsLoading ? (
                <p className="cashier-loading">Chargement du detail...</p>
              ) : null}

              {selected ? (
                <>
                  <div className="cashier-detail-grid">
                    <article>
                      <span>Client</span>
                      <strong>{selected.customer_name}</strong>
                      <small>{selected.customer_email}</small>
                    </article>
                    <article>
                      <span>Beneficiaire</span>
                      <strong>{selected.beneficiary_name || "-"}</strong>
                      <small>{selected.beneficiary_phone || "-"}</small>
                    </article>
                    <article>
                      <span>Total</span>
                      <strong>{eur(selected.total_eur)}</strong>
                      <small>{aoa(selected.total_aoa)}</small>
                    </article>
                    <article>
                      <span>Paiement</span>
                      <strong>{paymentName(selected.payment_status)}</strong>
                      <small>{selected.branch_name || selected.branch_city || "-"}</small>
                    </article>
                  </div>

                  {!canActOnOrder(selected, cashierProfile) ? (
                    <p className="cashier-readonly-note">
                      Cette commande appartient a un autre guichet. Vous pouvez
                      la consulter, mais vous ne pouvez pas la modifier.
                    </p>
                  ) : !selected.branch_id ? (
                    <p className="cashier-claim-note">
                      Cette commande n'est assignee a aucun guichet. La premiere
                      action la rattachera a votre guichet: {branchLabel}.
                    </p>
                  ) : null}

                  <section className="cashier-order-items">
                    <h4>Articles</h4>
                    {selected.items.map((item) => (
                      <article key={item.id}>
                        {item.image_url ? (
                          <img
                            alt={item.image_alt_text || item.product_name}
                            src={item.image_url}
                          />
                        ) : (
                          <i>{item.product_name.slice(0, 2).toUpperCase()}</i>
                        )}
                        <div>
                          <strong>{item.product_name}</strong>
                          <span>
                            {item.item_type === "rental" ? "Location" : "Achat"} -{" "}
                            {item.quantity} x {eur(item.unit_price_eur)}
                          </span>
                          <small>
                            {item.size || "-"} / {item.color || "-"} / {item.sku}
                          </small>
                          {item.item_type === "rental" ? (
                            <small>
                              Du {item.rental_start_date || "-"} au{" "}
                              {item.rental_end_date || "-"} -{" "}
                              {item.rental_days || 0} jour(s)
                            </small>
                          ) : null}
                        </div>
                        <b>{eur(item.line_total_eur)}</b>
                      </article>
                    ))}
                  </section>

                  <div className="cashier-form-grid">
                    <label>
                      Nouveau statut
                      <select
                        onChange={(event) => setNextStatus(event.target.value)}
                        value={nextStatus}
                      >
                        {orderStatuses.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="wide">
                      Note guichet
                      <textarea
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Document verifie, article remis, observation..."
                        value={notes}
                      />
                    </label>
                  </div>

                  <div className="cashier-modal-actions">
                    <button
                      disabled={saving || !canActOnOrder(selected, cashierProfile)}
                      type="submit"
                    >
                      {saving ? "Enregistrement..." : "Mettre a jour"}
                    </button>
                    <button
                      disabled={
                        saving ||
                        !canActOnOrder(selected, cashierProfile) ||
                        selected.payment_status !== "paid" ||
                        selected.status === "completed"
                      }
                      onClick={() => void completePickup()}
                      type="button"
                    >
                      Confirmer la remise
                    </button>
                  </div>
                </>
              ) : null}
            </form>
          </div>
        )}
      </section>
    </CashierLayout>
  );
}
