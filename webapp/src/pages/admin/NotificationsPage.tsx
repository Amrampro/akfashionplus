import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, post, put } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type NotificationRow = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: 0 | 1 | boolean;
  read_at: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  user_status: string;
};

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

type UserResponse = UserRow[] | { rows: UserRow[] };

const emptyForm = {
  user_id: "all",
  type: "admin_message",
  title: "",
  message: "",
};

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(value: string) {
  const labels: Record<string, string> = {
    admin: "Administrateur",
    cashier: "Employe guichet",
    user: "Utilisateur",
  };
  return labels[value] || value;
}

function typeLabel(value: string) {
  const labels: Record<string, string> = {
    admin_message: "Message admin",
    gift_card: "Carte cadeau",
    order: "Commande",
    payment: "Paiement",
    pickup: "Retrait",
    rental: "Location",
    resale: "Revente",
    stock: "Stock",
  };
  return labels[value] || value;
}

function isRead(value: NotificationRow["is_read"]) {
  return value === true || value === 1;
}

export default function NotificationsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [readStatus, setReadStatus] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadNotifications = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (type !== "all") params.set("type", type);
    if (readStatus !== "all") params.set("read", readStatus);
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);

    get<NotificationRow[]>(`/notifications/admin?${params.toString()}`)
      .then((rows) => setNotifications(rows || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [createdFrom, createdTo, readStatus, search, type]);

  useEffect(() => {
    get<UserResponse>("/users?limit=100")
      .then((payload) =>
        setUsers(Array.isArray(payload) ? payload : payload.rows || []),
      )
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 250);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  async function saveNotification(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await post("/notifications/admin", {
        user_id: form.user_id,
        type: form.type,
        title: form.title.trim(),
        message: form.message.trim(),
      });
      setNotice("Notification envoyee.");
      setForm(emptyForm);
      setEditorOpen(false);
      loadNotifications();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleRead(notification: NotificationRow) {
    setError("");
    try {
      await put(`/notifications/admin/${notification.id}`, {
        is_read: !isRead(notification.is_read),
      });
      setSelectedNotification((current) =>
        current?.id === notification.id
          ? { ...current, is_read: !isRead(notification.is_read) }
          : current,
      );
      loadNotifications();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function removeNotification(notification: NotificationRow) {
    setError("");
    try {
      await del(`/notifications/admin/${notification.id}`);
      setSelectedNotification(null);
      setNotice("Notification supprimee.");
      loadNotifications();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const types = useMemo(
    () =>
      Array.from(
        new Set(notifications.map((notification) => notification.type)),
      ).sort(),
    [notifications],
  );

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((notification) => !isRead(notification.is_read))
        .length,
      read: notifications.filter((notification) => isRead(notification.is_read))
        .length,
      operational: notifications.filter((notification) =>
        ["stock", "payment", "pickup", "rental", "resale"].includes(
          notification.type,
        ),
      ).length,
    }),
    [notifications],
  );

  const totalPages = Math.max(1, Math.ceil(notifications.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedNotifications = notifications.slice(
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
      <section className="admin-notifications-page">
        <section className="admin-hero">
          <div>
            <p>Notifications</p>
            <h2>Notifications et alertes</h2>
            <span>
              Consultez les messages utilisateurs, alertes operationnelles et
              notifications recentes.
            </span>
          </div>
          <button onClick={() => setEditorOpen(true)} type="button">
            Nouvelle notification
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Notifications</span>
            <strong>{loading ? "..." : stats.total}</strong>
          </article>
          <article>
            <span>Non lues</span>
            <strong>{stats.unread}</strong>
          </article>
          <article>
            <span>Lues</span>
            <strong>{stats.read}</strong>
          </article>
          <article>
            <span>Alertes operations</span>
            <strong>{stats.operational}</strong>
          </article>
        </section>

        <section className="admin-product-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Titre, message, utilisateur..."
              type="search"
              value={search}
            />
          </label>
          <label>
            Type
            <select
              onChange={(event) => {
                setType(event.target.value);
                setTablePage(1);
              }}
              value={type}
            >
              <option value="all">Tous les types</option>
              {types.map((notificationType) => (
                <option key={notificationType} value={notificationType}>
                  {typeLabel(notificationType)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Lecture
            <select
              onChange={(event) => {
                setReadStatus(event.target.value);
                setTablePage(1);
              }}
              value={readStatus}
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
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

        {notice ? <div className="admin-success">{notice}</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Donnees</p>
              <h3>Notifications recentes</h3>
            </div>
            <strong>{notifications.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Destinataire</th>
                  <th>Lecture</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notification, index) => (
                  <tr key={notification.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <span className="admin-status-pill reserved">
                        {typeLabel(notification.type)}
                      </span>
                    </td>
                    <td>
                      <strong>{notification.title}</strong>
                      <small>{notification.message}</small>
                    </td>
                    <td>
                      <strong>
                        {notification.first_name} {notification.last_name}
                      </strong>
                      <small>
                        {notification.email} - {roleLabel(notification.role)}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill ${
                          isRead(notification.is_read) ? "active" : "pending"
                        }`}
                      >
                        {isRead(notification.is_read) ? "Lue" : "Non lue"}
                      </span>
                    </td>
                    <td>{dateTime(notification.created_at)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => setSelectedNotification(notification)}
                          type="button"
                        >
                          Ouvrir
                        </button>
                        <button onClick={() => toggleRead(notification)} type="button">
                          {isRead(notification.is_read)
                            ? "Marquer non lue"
                            : "Marquer lue"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!paginatedNotifications.length ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="admin-empty-state">
                        <strong>Aucune notification trouvee</strong>
                        <p>Les notifications envoyees apparaitront ici.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
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
            </select>
            <button
              disabled={safePage <= 1}
              onClick={() => setTablePage((current) => current - 1)}
              type="button"
            >
              Precedent
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setTablePage((current) => current + 1)}
              type="button"
            >
              Suivant
            </button>
          </div>
        </section>

        {editorOpen ? (
          <div className="admin-modal-backdrop" role="presentation">
            <form className="admin-editor-modal compact" onSubmit={saveNotification}>
              <div className="admin-editor-modal-header">
                <div>
                  <p>Message</p>
                  <h3>Nouvelle notification</h3>
                </div>
                <button onClick={() => setEditorOpen(false)} type="button">
                  Fermer
                </button>
              </div>
              <div className="admin-form-grid">
                <label>
                  Destinataire
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        user_id: event.target.value,
                      }))
                    }
                    value={form.user_id}
                  >
                    <option value="all">Tous les utilisateurs actifs</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} - {roleLabel(user.role)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                    value={form.type}
                  >
                    <option value="admin_message">Message admin</option>
                    <option value="order">Commande</option>
                    <option value="payment">Paiement</option>
                    <option value="rental">Location</option>
                    <option value="gift_card">Carte cadeau</option>
                    <option value="pickup">Retrait</option>
                    <option value="resale">Revente</option>
                    <option value="stock">Stock</option>
                  </select>
                </label>
                <label>
                  Titre
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                    value={form.title}
                  />
                </label>
              </div>
              <label className="admin-category-form">
                Message
                <textarea
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  required
                  rows={5}
                  value={form.message}
                />
              </label>
              <div className="admin-form-actions">
                <button disabled={saving} type="submit">
                  {saving ? "Envoi..." : "Envoyer"}
                </button>
                <button onClick={() => setEditorOpen(false)} type="button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {selectedNotification ? (
          <div className="admin-modal-backdrop" role="presentation">
            <div className="admin-editor-modal compact">
              <div className="admin-editor-modal-header">
                <div>
                  <p>{typeLabel(selectedNotification.type)}</p>
                  <h3>{selectedNotification.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <div className="admin-payment-detail">
                <article>
                  <span>Destinataire</span>
                  <strong>
                    {selectedNotification.first_name}{" "}
                    {selectedNotification.last_name}
                  </strong>
                  <small>{selectedNotification.email}</small>
                </article>
                <article>
                  <span>Role</span>
                  <strong>{roleLabel(selectedNotification.role)}</strong>
                  <small>{selectedNotification.user_status}</small>
                </article>
                <article>
                  <span>Lecture</span>
                  <strong>
                    {isRead(selectedNotification.is_read) ? "Lue" : "Non lue"}
                  </strong>
                  <small>{dateTime(selectedNotification.read_at)}</small>
                </article>
                <article>
                  <span>Date</span>
                  <strong>{dateTime(selectedNotification.created_at)}</strong>
                </article>
              </div>
              <div className="admin-empty-state">
                <strong>Message</strong>
                <p>{selectedNotification.message}</p>
              </div>
              <div className="admin-form-actions">
                <button
                  onClick={() => toggleRead(selectedNotification)}
                  type="button"
                >
                  {isRead(selectedNotification.is_read)
                    ? "Marquer non lue"
                    : "Marquer lue"}
                </button>
                <button
                  className="danger"
                  onClick={() => removeNotification(selectedNotification)}
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
