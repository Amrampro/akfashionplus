import { useCallback, useEffect, useMemo, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get, put } from "../../services/api";
import { dateTime, statusLabel, type CashierPageProps } from "./cashierUtils";

type NotificationRow = {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean | 0 | 1;
  created_at: string;
};

function isRead(value: NotificationRow["is_read"]) {
  return value === true || value === 1;
}

export default function NotificationsPage(props: CashierPageProps) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRows = useCallback(() => {
    setLoading(true);
    setError("");
    get<NotificationRow[]>("/notifications")
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadRows, 150);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    if (filter === "unread") return rows.filter((row) => !isRead(row.is_read));
    if (filter === "read") return rows.filter((row) => isRead(row.is_read));
    return rows;
  }, [filter, rows]);

  async function markRead(row: NotificationRow) {
    setError("");
    setNotice("");
    try {
      await put(`/notifications/${row.id}/read`);
      setNotice("Notification marquee comme lue.");
      loadRows();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function markAllRead() {
    setError("");
    setNotice("");
    try {
      await put("/notifications/read-all");
      setNotice("Toutes les notifications sont marquees comme lues.");
      loadRows();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Notifications</p>
            <h2>Messages guichet</h2>
            <span>
              Consultez les alertes de commande, paiement, retrait, location et
              messages operationnels destines au guichet.
            </span>
          </div>
          <button onClick={markAllRead} type="button">
            Tout marquer lu
          </button>
        </section>

        {notice ? <div className="cashier-success">{notice}</div> : null}
        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          <article>
            <span>Total</span>
            <strong>{loading ? "..." : rows.length}</strong>
          </article>
          <article>
            <span>Non lues</span>
            <strong>{rows.filter((row) => !isRead(row.is_read)).length}</strong>
          </article>
          <article>
            <span>Lues</span>
            <strong>{rows.filter((row) => isRead(row.is_read)).length}</strong>
          </article>
          <article>
            <span>Filtre</span>
            <strong>{statusLabel(filter)}</strong>
          </article>
        </section>

        <section className="cashier-filters">
          <div className="cashier-tabs">
            {[
              ["all", "Toutes"],
              ["unread", "Non lues"],
              ["read", "Lues"],
            ].map(([id, label]) => (
              <button
                className={filter === id ? "active" : ""}
                key={id}
                onClick={() => setFilter(id as typeof filter)}
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
              <p>Boite de reception</p>
              <h3>Notifications recentes</h3>
            </div>
            <strong>{filteredRows.length}</strong>
          </div>
          <div className="cashier-notification-list">
            {filteredRows.map((row) => (
              <article className={isRead(row.is_read) ? "" : "unread"} key={row.id}>
                <div>
                  <span>{row.type}</span>
                  <h4>{row.title}</h4>
                  <p>{row.message}</p>
                  <small>{dateTime(row.created_at)}</small>
                </div>
                {!isRead(row.is_read) ? (
                  <button onClick={() => markRead(row)} type="button">
                    Marquer lu
                  </button>
                ) : (
                  <small>Deja lue</small>
                )}
              </article>
            ))}
            {!filteredRows.length ? (
              <p className="cashier-empty">Aucune notification trouvee.</p>
            ) : null}
          </div>
        </section>
      </section>
    </CashierLayout>
  );
}
