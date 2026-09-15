import { useCallback, useEffect, useState, type ReactNode } from "react";
import UserSidebar from "../user/UserSidebar";
import { get } from "../../services/api";

type Language = "fr" | "en" | "pt";
type UserLayoutSession = {
  name: string;
  email: string;
};

export default function UserLayout({
  children,
  currentPage,
  go,
  language,
  onLogout,
  session,
  setLanguage,
}: {
  children: ReactNode;
  currentPage: string;
  go: (page: string) => void;
  language: Language;
  onLogout: () => void;
  session: UserLayoutSession | null;
  setLanguage: (language: Language) => void;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const name = session?.name || "Client AK";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const loadUnreadCount = useCallback(() => {
    get<{ is_read: boolean | number }[]>("/notifications")
      .then((rows) =>
        setUnreadCount(
          (rows || []).filter(
            (notification) =>
              notification.is_read === false || notification.is_read === 0,
          ).length,
        ),
      )
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadUnreadCount, 150);
    return () => window.clearTimeout(timer);
  }, [currentPage, loadUnreadCount]);

  return (
    <section className="user-account-shell">
      <UserSidebar currentPage={currentPage} go={go} />
      <main className="user-account-main">
        <header className="user-account-topbar">
          <div>
            <p className="eyebrow">Espace client</p>
            <h1>{name}</h1>
          </div>
          <div className="user-account-actions">
            <label>
              Langue
              <select
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as Language)
                }
              >
                <option value="fr">FR - Francais</option>
                <option value="en">EN - English</option>
                <option value="pt">PT - Portugues</option>
              </select>
            </label>
            <div className="user-mini-profile">
              <span>{initials}</span>
              <div>
                <strong>{name}</strong>
                <small>{session?.email || "Compte client"}</small>
              </div>
            </div>
            <button
              aria-label={`${unreadCount} notification(s) non lue(s)`}
              className="account-notification-button"
              onClick={() => go("user-notifications")}
              type="button"
            >
              <NotificationIcon />
              {unreadCount > 0 ? <span>{unreadCount}</span> : null}
            </button>
            <button onClick={onLogout} type="button">
              Deconnexion
            </button>
          </div>
        </header>
        {children}
      </main>
    </section>
  );
}

function NotificationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 21h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
