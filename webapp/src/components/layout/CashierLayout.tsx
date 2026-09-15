import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { get } from "../../services/api";
import { translateAdminDom } from "../../utils/adminDomTranslations";

type CashierLayoutProps = {
  children: ReactNode;
  go: (page: string) => void;
  language: "fr" | "en" | "pt";
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
  setLanguage: (language: "fr" | "en" | "pt") => void;
};

type CashierProfile = {
  branch_name?: string | null;
  branch_city?: string | null;
};

const links = [
  ["cashier-dashboard", "cashier.nav.dashboard", "cashier.navHint.dashboard", "dashboard"],
  ["cashier-pickups", "cashier.nav.pickups", "cashier.navHint.pickups", "pickup"],
  ["cashier-rentals", "cashier.nav.rentals", "cashier.navHint.rentals", "rentals"],
  ["cashier-resales", "cashier.nav.resales", "cashier.navHint.resales", "resales"],
  ["cashier-second-hand-proposals", "cashier.nav.secondHandProposals", "cashier.navHint.secondHandProposals", "secondHandProposals"],
  ["cashier-history", "cashier.nav.history", "cashier.navHint.history", "history"],
  ["cashier-notifications", "cashier.nav.notifications", "cashier.navHint.notifications", "notifications"],
] as const;

const titles: Record<string, string> = {
  "cashier-dashboard": "cashier.nav.dashboard",
  "cashier-pickups": "cashier.nav.pickups",
  "cashier-rentals": "cashier.nav.rentals",
  "cashier-resales": "cashier.nav.resales",
  "cashier-second-hand-proposals": "cashier.nav.secondHandProposals",
  "cashier-history": "cashier.nav.history",
  "cashier-notifications": "cashier.nav.notifications",
  "cashier-pickup-details": "cashier.nav.pickupDetails",
  "cashier-profile": "cashier.nav.profile",
  "cashier-resale-details": "cashier.nav.resaleDetails",
};

export default function CashierLayout({
  children,
  go,
  language,
  logout,
  page,
  sessionEmail,
  sessionName = "Guichet AK",
  setLanguage,
}: CashierLayoutProps) {
  const { t } = useLanguage();
  const text = (key: string) => t[key] || key;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [branchLabel, setBranchLabel] = useState(text("cashier.layout.noBranch"));

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
  }, [loadUnreadCount, page]);

  useEffect(() => {
    get<CashierProfile>("/users/me")
      .then((profile) => {
        const label = [profile.branch_name, profile.branch_city]
          .filter(Boolean)
          .join(" - ");
        setBranchLabel(label || text("cashier.layout.noBranch"));
      })
      .catch(() => setBranchLabel(text("cashier.layout.noBranch")));
  }, [t]);

  useEffect(() => {
    const root = document.querySelector(".cashier-shell");
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
      className={`cashier-shell ${sidebarOpen ? "menu-open" : ""} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <aside className="cashier-sidebar">
        <button
          aria-label={text("cashier.layout.closeMenu")}
          className="cashier-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
        <div className="cashier-sidebar-inner">
          <div className="cashier-sidebar-head">
            <button
              className="cashier-brand"
              onClick={() => {
                go("cashier-dashboard");
                setSidebarOpen(false);
              }}
              type="button"
            >
              <span>AK</span>
              <strong>Fashion Plus</strong>
              <small>{text("cashier.layout.counter")}</small>
            </button>
            <button
              aria-label={
                sidebarCollapsed
                  ? text("cashier.layout.expandMenu")
                  : text("cashier.layout.collapseMenu")
              }
              className="cashier-sidebar-toggle"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <nav aria-label={text("cashier.layout.navigation")} className="cashier-nav">
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
                <CashierIcon name={icon} />
                <span className="cashier-nav-label">{label}</span>
                <small className="cashier-nav-hint">{text(hintKey)}</small>
              </button>
            );
            })}
          </nav>
        </div>
      </aside>

      <div className="cashier-main">
        <header className="cashier-topbar">
          <button
            aria-label={text("cashier.layout.openMenu")}
            className="cashier-menu-button"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <p>{text("cashier.layout.backOffice")}</p>
            <h1>{text(titles[page] || "cashier.layout.counter")}</h1>
            <span className="cashier-branch-label">{branchLabel}</span>
          </div>
          <select
            aria-label={text("cashier.layout.language")}
            onChange={(event) =>
              setLanguage(event.target.value as "fr" | "en" | "pt")
            }
            value={language}
          >
            <option value="fr">FR - Francais</option>
            <option value="en">EN - English</option>
            <option value="pt">PT - Portugues</option>
          </select>
          <button
            aria-label={text("cashier.layout.unreadNotifications").replace(
              "{{count}}",
              String(unreadCount),
            )}
            className="account-notification-button cashier"
            onClick={() => go("cashier-notifications")}
            type="button"
          >
            <CashierIcon name="notifications" />
            {unreadCount > 0 ? <span>{unreadCount}</span> : null}
          </button>
          <div className="cashier-profile-menu">
            <button
              className="cashier-user"
              onClick={() => setProfileOpen((open) => !open)}
              type="button"
            >
              <span>{sessionName.slice(0, 2).toUpperCase()}</span>
              <strong>{sessionName}</strong>
              <small>{sessionEmail || "cashier@akfashionplus.com"}</small>
            </button>
            {profileOpen ? (
              <div className="cashier-profile-dropdown">
                <button
                  onClick={() => {
                    go("cashier-profile");
                    setProfileOpen(false);
                  }}
                  type="button"
                >
                  {text("cashier.nav.profile")}
                </button>
                <button onClick={logout} type="button">
                  {text("cashier.layout.logout")}
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="cashier-content">{children}</main>
      </div>
    </section>
  );
}

function CashierIcon({ name }: { name: string }) {
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
    pickup: (
      <>
        <path d="M4 7h16v12H4zM8 7a4 4 0 0 1 8 0" {...common} />
        <path d="m8 13 2.5 2.5L16 10" {...common} />
      </>
    ),
    rentals: (
      <>
        <path d="M7 4h10l2 5v11H5V9l2-5Z" {...common} />
        <path d="M8 13h8M12 9v8" {...common} />
      </>
    ),
    resales: (
      <>
        <path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" {...common} />
        <path d="M18 3v4h-4M6 21v-4h4" {...common} />
      </>
    ),
    secondHandProposals: (
      <>
        <path d="M5 8h14v12H5zM9 8a3 3 0 0 1 6 0" {...common} />
        <path d="M8 14h8M8 17h5" {...common} />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" {...common} />
        <path d="M3 4v4h4M12 7v6l4 2" {...common} />
      </>
    ),
    notifications: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" {...common} />
        <path d="M10 21h4" {...common} />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="cashier-nav-icon" viewBox="0 0 24 24">
      {paths[name] || paths.dashboard}
    </svg>
  );
}
