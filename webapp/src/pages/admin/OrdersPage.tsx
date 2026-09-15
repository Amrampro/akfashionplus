import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, put } from "../../services/api";
import { downloadReceipt } from "../../utils/receipts";

type AdminOrdersPageProps = {
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
  status: string;
};

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  branch_name: string | null;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  total_eur: number;
  total_aoa: number;
  paid_total_eur: number;
  items_count: number;
  rental_items_count: number;
  purchase_items_count: number;
  beneficiary_name: string | null;
  beneficiary_phone: string | null;
  created_at: string;
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
  rental_status: string;
  resell_to_company: number;
};

type PaymentRow = {
  id: number;
  payment_reference: string;
  method: string;
  purpose: string;
  amount_eur: number;
  status: string;
  created_at: string;
};

type HistoryRow = {
  id: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
};

type OrderDetails = OrderRow & {
  branch_id: number | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_address_line_2: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  shipping_country_code: string | null;
  shipping_carrier: string | null;
  shipping_tracking_number: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  items: OrderItem[];
  payments: PaymentRow[];
  history: HistoryRow[];
};

type OrderForm = {
  fulfillment_type: string;
  branch_id: string;
  status: string;
  payment_status: string;
  beneficiary_name: string;
  beneficiary_phone: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_country_code: string;
  shipping_carrier: string;
  shipping_tracking_number: string;
  customer_notes: string;
  admin_notes: string;
  status_notes: string;
};

const orderStatuses = [
  ["", "Tous les statuts"],
  ["pending_payment", "Paiement en attente"],
  ["confirmed", "Confirmee"],
  ["processing", "En preparation"],
  ["ready_for_pickup", "Prete retrait"],
  ["shipped", "Expediee"],
  ["completed", "Terminee"],
  ["cancelled", "Annulee"],
];

const editableOrderStatuses = orderStatuses.filter(([value]) => value);

const paymentStatuses = [
  ["", "Tous les paiements"],
  ["unpaid", "Non payee"],
  ["partially_paid", "Partiellement payee"],
  ["paid", "Payee"],
  ["partially_refunded", "Partiellement remboursee"],
  ["refunded", "Remboursee"],
  ["failed", "Echec"],
];

const editablePaymentStatuses = paymentStatuses.filter(([value]) => value);

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

function labelOf(options: string[][], value: string) {
  return options.find(([id]) => id === value)?.[1] || value || "-";
}

function formFromOrder(order: OrderDetails): OrderForm {
  return {
    fulfillment_type: order.fulfillment_type || "pickup",
    branch_id: order.branch_id ? String(order.branch_id) : "",
    status: order.status || "pending_payment",
    payment_status: order.payment_status || "unpaid",
    beneficiary_name: order.beneficiary_name || "",
    beneficiary_phone: order.beneficiary_phone || "",
    shipping_name: order.shipping_name || "",
    shipping_phone: order.shipping_phone || "",
    shipping_address_line_1: order.shipping_address_line_1 || "",
    shipping_address_line_2: order.shipping_address_line_2 || "",
    shipping_city: order.shipping_city || "",
    shipping_province: order.shipping_province || "",
    shipping_postal_code: order.shipping_postal_code || "",
    shipping_country_code: order.shipping_country_code || "AO",
    shipping_carrier: order.shipping_carrier || "",
    shipping_tracking_number: order.shipping_tracking_number || "",
    customer_notes: order.customer_notes || "",
    admin_notes: order.admin_notes || "",
    status_notes: "",
  };
}

export default function OrdersPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminOrdersPageProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [form, setForm] = useState<OrderForm | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [branchId, setBranchId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ limit: "80" });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (paymentStatus) params.set("payment_status", paymentStatus);
    if (fulfillmentType) params.set("fulfillment_type", fulfillmentType);
    if (branchId) params.set("branch_id", branchId);
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);
    return `/orders?${params.toString()}`;
  }, [
    branchId,
    createdFrom,
    createdTo,
    fulfillmentType,
    paymentStatus,
    query,
    status,
  ]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([get<OrderRow[]>(listPath), get<Branch[]>("/branches?admin=1")])
      .then(([orderRows, branchRows]) => {
        if (!active) return;
        setOrders(orderRows || []);
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

  const totals = useMemo(
    () => ({
      amount: orders.reduce(
        (sum, order) => sum + Number(order.total_eur || 0),
        0,
      ),
      paid: orders.filter((order) => order.payment_status === "paid").length,
      pending: orders.filter((order) => order.status === "pending_payment")
        .length,
      rentals: orders.reduce(
        (sum, order) => sum + Number(order.rental_items_count || 0),
        0,
      ),
    }),
    [orders],
  );

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

  function loadOrder(orderId: number) {
    setSelectedOrder(null);
    setForm(null);
    setDetailsLoading(true);
    setError("");
    setSuccess("");
    get<OrderDetails>(`/orders/${orderId}`)
      .then((details) => {
        setSelectedOrder(details);
        setForm(formFromOrder(details));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setDetailsLoading(false));
  }

  function closeOrderModal() {
    setSelectedOrder(null);
    setForm(null);
    setDetailsLoading(false);
  }

  function updateForm(field: keyof OrderForm, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveOrder(event: FormEvent) {
    event.preventDefault();
    if (!selectedOrder || !form) return;

    setSaving(true);
    setError("");
    setSuccess("");
    put<OrderRow>(`/orders/${selectedOrder.id}/admin`, {
      ...form,
      branch_id: form.branch_id || null,
    })
      .then(() => {
        setSuccess("Commande mise a jour.");
        return Promise.all([
          get<OrderDetails>(`/orders/${selectedOrder.id}`),
          get<OrderRow[]>(listPath),
        ]);
      })
      .then(([details, rows]) => {
        setSelectedOrder(details);
        setForm(formFromOrder(details));
        setOrders(rows || []);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function quickStatus(nextStatus: string) {
    if (!form) return;
    updateForm("status", nextStatus);
    updateForm(
      "status_notes",
      `Action rapide admin: ${labelOf(editableOrderStatuses, nextStatus)}`,
    );
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-orders-page">
        <section className="admin-hero">
          <div>
            <p>Commandes</p>
            <h2>Commandes administrateur</h2>
            <span>
              Consultez, filtrez et mettez a jour les commandes, paiements,
              retraits, livraisons, notes et informations beneficiaire.
            </span>
          </div>
          <button onClick={() => go("admin-dashboard")} type="button">
            Retour dashboard
          </button>
        </section>

        <section className="admin-order-kpis">
          <article>
            <span>Commandes affichees</span>
            <strong>{loading ? "..." : orders.length}</strong>
          </article>
          <article>
            <span>Total affiche</span>
            <strong>{loading ? "..." : eur(totals.amount)}</strong>
          </article>
          <article>
            <span>Paiements reussis</span>
            <strong>{loading ? "..." : totals.paid}</strong>
          </article>
          <article>
            <span>Articles loues</span>
            <strong>{loading ? "..." : totals.rentals}</strong>
          </article>
        </section>

        <section className="admin-order-toolbar">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setQuery(event.target.value);
                setTablePage(1);
              }}
              placeholder="Reference, client, email, telephone..."
              type="search"
              value={query}
            />
          </label>
          <label>
            Statut commande
            <select
              onChange={(event) => {
                setStatus(event.target.value);
                setTablePage(1);
              }}
              value={status}
            >
              {orderStatuses.map(([id, label]) => (
                <option key={id || "all"} value={id}>
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
            Livraison / retrait
            <select
              onChange={(event) => {
                setFulfillmentType(event.target.value);
                setTablePage(1);
              }}
              value={fulfillmentType}
            >
              <option value="">Tout</option>
              <option value="pickup">Retrait guichet</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
          <label>
            Guichet
            <select
              onChange={(event) => {
                setBranchId(event.target.value);
                setTablePage(1);
              }}
              value={branchId}
            >
              <option value="">Tous</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date debut
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
            Date fin
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

        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success">{success}</p>}

        <section className="admin-orders-layout single">
          <section className="admin-orders-list admin-panel">
            <div className="admin-panel-head">
              <div>
                <p>Liste</p>
                <h3>Commandes</h3>
              </div>
              <strong>{orders.length}</strong>
            </div>

            {loading && (
              <p className="admin-loading">Chargement des commandes...</p>
            )}
            {!loading && orders.length === 0 && (
              <p className="admin-empty">
                Aucune commande ne correspond aux filtres.
              </p>
            )}
            {!loading && orders.length > 0 && (
              <div className="admin-orders-table">
                <div className="admin-orders-row head">
                  <span>Reference</span>
                  <span>Client</span>
                  <span>Statut</span>
                  <span>Paiement</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>
                {paginatedOrders.map((order) => (
                  <div
                    className={`admin-orders-row ${selectedOrder?.id === order.id ? "active" : ""}`}
                    key={order.id}
                    onClick={() => loadOrder(order.id)}
                  >
                    <span>
                      <strong>{order.order_number}</strong>
                      <small>{dateTime(order.created_at)}</small>
                    </span>
                    <span>
                      <strong>{order.customer_name}</strong>
                      <small>{order.customer_email}</small>
                    </span>
                    <span className={`admin-badge status-${order.status}`}>
                      {labelOf(editableOrderStatuses, order.status)}
                    </span>
                    <span
                      className={`admin-badge payment-${order.payment_status}`}
                    >
                      {labelOf(editablePaymentStatuses, order.payment_status)}
                    </span>
                    <span>
                      <strong>{eur(order.total_eur)}</strong>
                      <small>{aoa(order.total_aoa)}</small>
                    </span>
                    <span className="admin-row-actions">
                      <button type="button">Ouvrir</button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void downloadReceipt("order", order.id).catch(
                            (requestError: Error) => setError(requestError.message),
                          );
                        }}
                        type="button"
                      >
                        Recu PDF
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {!loading && orders.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={sortedOrders.length}
                totalPages={totalPages}
                onPageChange={setTablePage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setTablePage(1);
                }}
              />
            )}
          </section>
        </section>

        {(detailsLoading || selectedOrder) && (
          <div className="admin-modal-backdrop" role="presentation">
            <section
              aria-modal="true"
              className="admin-editor-modal admin-order-modal"
              role="dialog"
            >
              <div className="admin-editor-modal-header">
                <div>
                  <p>Detail commande</p>
                  <h3>{selectedOrder?.order_number || "Chargement..."}</h3>
                </div>
                <button onClick={closeOrderModal} type="button">
                  Fermer
                </button>
              </div>
              {detailsLoading && (
                <p className="admin-loading">Chargement du detail...</p>
              )}
              {selectedOrder && form && (
              <form onSubmit={saveOrder}>
                <div className="admin-panel-head">
                  <div>
                    <p>Detail commande</p>
                    <h3>{selectedOrder.order_number}</h3>
                  </div>
                  <strong>{eur(selectedOrder.total_eur)}</strong>
                </div>

                <div className="admin-order-actions">
                  <button
                    onClick={() => quickStatus("processing")}
                    type="button"
                  >
                    Preparation
                  </button>
                  <button
                    onClick={() => quickStatus("ready_for_pickup")}
                    type="button"
                  >
                    Pret retrait
                  </button>
                  <button onClick={() => quickStatus("shipped")} type="button">
                    Expedier
                  </button>
                  <button
                    onClick={() => quickStatus("completed")}
                    type="button"
                  >
                    Terminer
                  </button>
                  <button
                    onClick={() => quickStatus("cancelled")}
                    type="button"
                  >
                    Annuler
                  </button>
                </div>

                <div className="admin-order-form-grid">
                  <label>
                    Statut commande
                    <select
                      onChange={(event) =>
                        updateForm("status", event.target.value)
                      }
                      value={form.status}
                    >
                      {editableOrderStatuses.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Statut paiement
                    <select
                      onChange={(event) =>
                        updateForm("payment_status", event.target.value)
                      }
                      value={form.payment_status}
                    >
                      {editablePaymentStatuses.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mode
                    <select
                      onChange={(event) =>
                        updateForm("fulfillment_type", event.target.value)
                      }
                      value={form.fulfillment_type}
                    >
                      <option value="pickup">Retrait guichet</option>
                      <option value="delivery">Livraison</option>
                    </select>
                  </label>
                  <label>
                    Guichet
                    <select
                      onChange={(event) =>
                        updateForm("branch_id", event.target.value)
                      }
                      value={form.branch_id}
                    >
                      <option value="">Aucun</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Beneficiaire
                    <input
                      onChange={(event) =>
                        updateForm("beneficiary_name", event.target.value)
                      }
                      value={form.beneficiary_name}
                    />
                  </label>
                  <label>
                    Telephone beneficiaire
                    <input
                      onChange={(event) =>
                        updateForm("beneficiary_phone", event.target.value)
                      }
                      value={form.beneficiary_phone}
                    />
                  </label>
                  <label>
                    Nom livraison
                    <input
                      onChange={(event) =>
                        updateForm("shipping_name", event.target.value)
                      }
                      value={form.shipping_name}
                    />
                  </label>
                  <label>
                    Telephone livraison
                    <input
                      onChange={(event) =>
                        updateForm("shipping_phone", event.target.value)
                      }
                      value={form.shipping_phone}
                    />
                  </label>
                  <label className="wide">
                    Adresse ligne 1
                    <input
                      onChange={(event) =>
                        updateForm(
                          "shipping_address_line_1",
                          event.target.value,
                        )
                      }
                      value={form.shipping_address_line_1}
                    />
                  </label>
                  <label className="wide">
                    Adresse ligne 2
                    <input
                      onChange={(event) =>
                        updateForm(
                          "shipping_address_line_2",
                          event.target.value,
                        )
                      }
                      value={form.shipping_address_line_2}
                    />
                  </label>
                  <label>
                    Ville
                    <input
                      onChange={(event) =>
                        updateForm("shipping_city", event.target.value)
                      }
                      value={form.shipping_city}
                    />
                  </label>
                  <label>
                    Province
                    <input
                      onChange={(event) =>
                        updateForm("shipping_province", event.target.value)
                      }
                      value={form.shipping_province}
                    />
                  </label>
                  <label>
                    Code postal
                    <input
                      onChange={(event) =>
                        updateForm("shipping_postal_code", event.target.value)
                      }
                      value={form.shipping_postal_code}
                    />
                  </label>
                  <label>
                    Pays
                    <input
                      onChange={(event) =>
                        updateForm("shipping_country_code", event.target.value)
                      }
                      value={form.shipping_country_code}
                    />
                  </label>
                  <label>
                    Transporteur
                    <input
                      onChange={(event) =>
                        updateForm("shipping_carrier", event.target.value)
                      }
                      value={form.shipping_carrier}
                    />
                  </label>
                  <label>
                    Numero de suivi
                    <input
                      onChange={(event) =>
                        updateForm(
                          "shipping_tracking_number",
                          event.target.value,
                        )
                      }
                      value={form.shipping_tracking_number}
                    />
                  </label>
                  <label className="wide">
                    Note client
                    <textarea
                      onChange={(event) =>
                        updateForm("customer_notes", event.target.value)
                      }
                      value={form.customer_notes}
                    />
                  </label>
                  <label className="wide">
                    Note admin
                    <textarea
                      onChange={(event) =>
                        updateForm("admin_notes", event.target.value)
                      }
                      value={form.admin_notes}
                    />
                  </label>
                  <label className="wide">
                    Note changement de statut
                    <textarea
                      onChange={(event) =>
                        updateForm("status_notes", event.target.value)
                      }
                      value={form.status_notes}
                    />
                  </label>
                </div>

                <button
                  className="admin-save-order"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? "Enregistrement..." : "Enregistrer la commande"}
                </button>

                <OrderDetailsPanels order={selectedOrder} />
              </form>
            )}
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

function OrderDetailsPanels({ order }: { order: OrderDetails }) {
  return (
    <div className="admin-order-subpanels">
      <section>
        <h4>Articles</h4>
        {order.items.map((item) => (
          <article className="admin-order-item-card" key={item.id}>
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
                {item.item_type} - {item.quantity} x {eur(item.unit_price_eur)}
              </span>
              <small>
                {item.size || "-"} / {item.color || "-"} / {item.sku}
              </small>
              {item.item_type === "rental" && (
                <small>
                  Location du {item.rental_start_date || "-"} au{" "}
                  {item.rental_end_date || "-"} - {item.rental_days || 0}{" "}
                  jour(s)
                </small>
              )}
            </div>
            <b>{eur(item.line_total_eur)}</b>
          </article>
        ))}
      </section>
      <section>
        <h4>Paiements</h4>
        {order.payments.length ? (
          order.payments.map((payment) => (
            <article key={payment.id}>
              <strong>{payment.payment_reference}</strong>
              <span>
                {payment.method} - {payment.purpose}
              </span>
              <small>{payment.status}</small>
              <b>{eur(payment.amount_eur)}</b>
            </article>
          ))
        ) : (
          <p>Aucun paiement enregistre.</p>
        )}
      </section>
      <section>
        <h4>Historique</h4>
        {order.history.length ? (
          order.history.map((entry) => (
            <article key={entry.id}>
              <strong>
                {entry.old_status || "-"} {"->"} {entry.new_status}
              </strong>
              <span>{entry.notes || "Sans note"}</span>
              <small>{dateTime(entry.created_at)}</small>
            </article>
          ))
        ) : (
          <p>Aucun historique de statut.</p>
        )}
      </section>
    </div>
  );
}
