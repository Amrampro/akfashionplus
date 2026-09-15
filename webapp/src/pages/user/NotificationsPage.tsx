import { useCallback, useEffect, useMemo, useState } from "react";
import { get, put } from "../../services/api";

type NotificationRow = {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean | number;
  read_at: string | null;
  created_at: string;
};

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeLabel(value: string) {
  const labels: Record<string, string> = {
    admin_message: "Message AK",
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

function isRead(notification: NotificationRow) {
  return notification.is_read === true || notification.is_read === 1;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(() => {
    setLoading(true);
    setError("");
    get<NotificationRow[]>("/notifications")
      .then((rows) => setNotifications(rows || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 150);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  async function markAsRead(notificationId: number) {
    setError("");
    try {
      await put(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function markAllAsRead() {
    setError("");
    try {
      await put("/notifications/read-all");
      loadNotifications();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (filter === "unread") return !isRead(notification);
        if (filter === "read") return isRead(notification);
        return true;
      }),
    [filter, notifications],
  );

  const unreadCount = notifications.filter((notification) => !isRead(notification))
    .length;

  return (
    <section className="user-notifications-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Mes notifications</h2>
          <span>
            Retrouvez les alertes de commande, paiement, location, revente et
            cartes cadeaux.
          </span>
        </div>
        <button disabled={!unreadCount} onClick={markAllAsRead} type="button">
          Tout marquer comme lu
        </button>
      </section>

      <section className="user-stat-grid">
        <article>
          <span>Total</span>
          <strong>{loading ? "..." : notifications.length}</strong>
          <small>Messages recus</small>
        </article>
        <article>
          <span>Non lues</span>
          <strong>{unreadCount}</strong>
          <small>A traiter</small>
        </article>
        <article>
          <span>Lues</span>
          <strong>{notifications.length - unreadCount}</strong>
          <small>Historique</small>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head">
          <div>
            <p className="eyebrow">Messages</p>
            <h2>Centre de notifications</h2>
          </div>
          <select
            aria-label="Filtrer les notifications"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}

        <div className="account-notification-list">
          {filteredNotifications.map((notification) => (
            <article
              className={isRead(notification) ? "read" : "unread"}
              key={notification.id}
            >
              <div>
                <span>{typeLabel(notification.type)}</span>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <small>{dateTime(notification.created_at)}</small>
              </div>
              <button
                disabled={isRead(notification)}
                onClick={() => markAsRead(notification.id)}
                type="button"
              >
                {isRead(notification) ? "Lu" : "Marquer lu"}
              </button>
            </article>
          ))}
          {!filteredNotifications.length ? (
            <div className="user-empty-state">
              <strong>Aucune notification</strong>
              <p>Les messages de votre compte apparaitront ici.</p>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
