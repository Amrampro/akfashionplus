import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LanguageContext } from "../../contexts/LanguageContext";
import { get } from "../../services/api";
import type { Language } from "../../types";
import { translateAdminDom } from "../../utils/adminDomTranslations";

type AdminLayoutProps = {
  children: ReactNode;
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionName?: string;
  sessionEmail?: string;
};

const links = [
  ["admin-dashboard", "admin.nav.dashboard", "admin.navHint.dashboard", "dashboard"],
  ["admin-orders", "admin.nav.orders", "admin.navHint.orders", "orders"],
  ["admin-products", "admin.nav.products", "admin.navHint.products", "products"],
  ["admin-categories", "admin.nav.categories", "admin.navHint.categories", "categories"],
  ["admin-rentals", "admin.nav.rentals", "admin.navHint.rentals", "rentals"],
  ["admin-users", "admin.nav.users", "admin.navHint.users", "customers"],
  ["admin-gift-cards", "admin.nav.giftCards", "admin.navHint.giftCards", "gift"],
  ["admin-resales", "admin.nav.resales", "admin.navHint.resales", "resales"],
  ["admin-second-hand-proposals", "admin.nav.secondHandProposals", "admin.navHint.secondHandProposals", "secondHandProposals"],
  ["admin-payments", "admin.nav.payments", "admin.navHint.payments", "payments"],
  ["admin-reviews", "admin.nav.reviews", "admin.navHint.reviews", "reviews"],
  ["admin-branches", "admin.nav.branches", "admin.navHint.branches", "branches"],
  ["admin-notifications", "admin.nav.notifications", "admin.navHint.notifications", "notifications"],
  ["admin-important-links", "admin.nav.importantLinks", "admin.navHint.importantLinks", "importantLinks"],
  ["admin-settings", "admin.nav.settings", "admin.navHint.settings", "settings"],
] as const;

const titles: Record<string, string> = {
  "admin-dashboard": "admin.nav.dashboard",
  "admin-orders": "admin.nav.orders",
  "admin-products": "admin.nav.products",
  "admin-categories": "admin.nav.categories",
  "admin-rentals": "admin.nav.rentals",
  "admin-users": "admin.nav.users",
  "admin-gift-cards": "admin.nav.giftCards",
  "admin-resales": "admin.nav.resales",
  "admin-second-hand-proposals": "admin.nav.secondHandProposals",
  "admin-payments": "admin.nav.payments",
  "admin-reviews": "admin.nav.reviews",
  "admin-branches": "admin.nav.branches",
  "admin-notifications": "admin.nav.notifications",
  "admin-important-links": "admin.nav.importantLinks",
  "admin-settings": "admin.nav.settings",
  "admin-profile": "admin.nav.profile",
};

export default function AdminLayout({
  children,
  go,
  logout,
  page,
  sessionEmail,
  sessionName = "Administrateur",
}: AdminLayoutProps) {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const text = (key: string) => t[key] || key;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadUnreadCount = useCallback(() => {
    get<{ is_read: boolean | number }[]>("/notifications/admin?read=unread")
      .then((rows) => setUnreadCount((rows || []).length))
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadUnreadCount, 150);
    return () => window.clearTimeout(timer);
  }, [loadUnreadCount, page]);

  useEffect(() => {
    const root = document.querySelector(".admin-shell");
    if (!root) return;

    let translating = false;
    const applyTranslations = () => {
      if (translating) return;
      translating = true;
      translateAdminDom(root, language);
      translating = false;
    };

    const timer = window.setTimeout(applyTranslations, 0);
    const observer = new MutationObserver(() => {
      window.setTimeout(applyTranslations, 0);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [language, page]);

  return (
    <section
      className={`admin-shell ${sidebarOpen ? "menu-open" : ""} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <aside className="admin-sidebar">
          <button
          aria-label={text("admin.layout.closeMenu")}
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-head">
            <button
              className="admin-brand"
              onClick={() => {
                go("admin-dashboard");
                setSidebarOpen(false);
              }}
              type="button"
            >
              <span>AK</span>
              <strong>Fashion Plus</strong>
              <small>{text("admin.layout.administration")}</small>
            </button>
            <button
              aria-label={
                sidebarCollapsed
                  ? text("admin.layout.expandMenu")
                  : text("admin.layout.collapseMenu")
              }
              className="admin-sidebar-toggle"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <nav aria-label={text("admin.layout.navigation")} className="admin-nav">
            {links.map(([id, labelKey, hintKey, icon]) => {
              const label = text(labelKey);
              return (
              <button
                aria-label={label}
                className={page === id ? "active" : ""}
                key={id}
                onClick={() => {
                  go(id);
                  setSidebarOpen(false);
                }}
                title={label}
                type="button"
              >
                <AdminNavIcon name={icon} />
                <span className="admin-nav-label">{label}</span>
                <small className="admin-nav-hint">{text(hintKey)}</small>
              </button>
            );
            })}
          </nav>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            aria-label={text("admin.layout.openMenu")}
            className="admin-menu-button"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <p>{text("admin.layout.backOffice")}</p>
            <h1>{text(titles[page] || "admin.layout.administration")}</h1>
          </div>
          <select
            aria-label={text("admin.layout.language")}
            className="admin-language-select"
            onChange={(event) => setLanguage(event.target.value as Language)}
            value={language}
          >
            <option value="fr">FR - Francais</option>
            <option value="en">EN - English</option>
            <option value="pt">PT - Portugues</option>
          </select>
          <button
            aria-label={text("admin.layout.unreadNotifications").replace(
              "{{count}}",
              String(unreadCount),
            )}
            className="account-notification-button"
            onClick={() => go("admin-notifications")}
            type="button"
          >
            <AdminNavIcon name="notifications" />
            {unreadCount > 0 ? <span>{unreadCount}</span> : null}
          </button>
          <div className="admin-profile-menu">
            <button
              className="admin-user"
              onClick={() => setProfileOpen((open) => !open)}
              type="button"
            >
              <span>{sessionName.slice(0, 2).toUpperCase()}</span>
              <strong>{sessionName}</strong>
              <small>{sessionEmail || "admin@akfashionplus.com"}</small>
            </button>
            {profileOpen ? (
              <div className="admin-profile-dropdown">
                <button
                  onClick={() => {
                    go("admin-profile");
                    setProfileOpen(false);
                  }}
                  type="button"
                >
                  {text("admin.nav.profile")}
                </button>
                <button onClick={logout} type="button">
                  {text("admin.layout.logout")}
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </section>
  );
}

function AdminNavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect height="7" width="7" x="3" y="3" {...common} />
        <rect height="7" width="7" x="14" y="3" {...common} />
        <rect height="7" width="7" x="14" y="14" {...common} />
        <rect height="7" width="7" x="3" y="14" {...common} />
      </>
    ),
    orders: (
      <>
        <path d="M7 3h10l2 4v14H5V7l2-4Z" {...common} />
        <path d="M7 7h10M9 12h6M9 16h4" {...common} />
      </>
    ),
    products: (
      <>
        <path d="M4 7h16v13H4zM8 7a4 4 0 0 1 8 0" {...common} />
        <path d="M9 13h6" {...common} />
      </>
    ),
    categories: (
      <>
        <path
          d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z"
          {...common}
        />
      </>
    ),
    stock: (
      <>
        <path d="M4 8 12 4l8 4-8 4-8-4Z" {...common} />
        <path d="M4 12l8 4 8-4M4 16l8 4 8-4" {...common} />
      </>
    ),
    rentals: (
      <>
        <path d="M8 4h8l1 5H7l1-5ZM7 9l-2 11h14L17 9" {...common} />
        <path d="M9 13h6" {...common} />
      </>
    ),
    customers: (
      <>
        <path
          d="M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 11a3 3 0 0 1 3 3v2"
          {...common}
        />
      </>
    ),
    gift: (
      <>
        <path
          d="M4 10h16v10H4zM4 10h16M12 10v10M7 6c0-2 3-2 5 4M17 6c0-2-3-2-5 4"
          {...common}
        />
      </>
    ),
    resales: (
      <>
        <path d="M4 12a8 8 0 0 1 13-6M20 12a8 8 0 0 1-13 6" {...common} />
        <path d="M17 3v5h-5M7 21v-5h5" {...common} />
      </>
    ),
    secondHandProposals: (
      <>
        <path d="M5 8h14v12H5zM9 8a3 3 0 0 1 6 0" {...common} />
        <path d="M8 14h8M8 17h5" {...common} />
      </>
    ),
    payments: (
      <>
        <rect height="14" width="18" x="3" y="5" rx="2" {...common} />
        <path d="M3 10h18M7 15h4" {...common} />
      </>
    ),
    reviews: (
      <>
        <path
          d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8L3.6 9.1l5.8-.8L12 3Z"
          {...common}
        />
      </>
    ),
    branches: (
      <>
        <path
          d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
          {...common}
        />
        <circle cx="12" cy="10" r="2.5" {...common} />
      </>
    ),
    notifications: (
      <>
        <path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
          {...common}
        />
      </>
    ),
    importantLinks: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11 4.9" {...common} />
        <path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 0 0 7.1 7.1L13 19.1" {...common} />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" {...common} />
        <path
          d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4.8L9.3 6a7 7 0 0 0-1.8 1L5.1 6l-2 3.5L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.8 1l.4 3h4.8l.3-3a7 7 0 0 0 1.8-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z"
          {...common}
        />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="admin-nav-icon" viewBox="0 0 24 24">
      {paths[name] || paths.dashboard}
    </svg>
  );
}
