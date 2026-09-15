import { useEffect, useMemo, useState, type CSSProperties } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  fetchAdminDashboard,
  type AdminDashboardFilters,
} from "../../services/adminDashboard";
import type {
  AdminDashboardData,
  AdminMetricRow,
} from "../../types/adminDashboard";

type AdminDashboardPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

const periods = [
  ["today", "Aujourd'hui"],
  ["7d", "7 jours"],
  ["30d", "30 jours"],
  ["3m", "3 mois"],
  ["6m", "6 mois"],
  ["1y", "1 an"],
  ["custom", "Personnalise"],
];

const moduleCopy: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "admin-dashboard": {
    eyebrow: "Pilotage",
    title: "Dashboard administrateur",
    description:
      "Vue complete des ventes, locations, clients, cartes cadeaux, paiements et operations guichet.",
  },
  "admin-orders": {
    eyebrow: "Commandes",
    title: "Commandes et statuts",
    description:
      "Suivez les commandes recentes, les paiements et les retraits.",
  },
  "admin-products": {
    eyebrow: "Catalogue",
    title: "Produits et performances",
    description:
      "Analysez les produits actifs, les meilleurs articles et la performance par categorie.",
  },
  "admin-categories": {
    eyebrow: "Catalogue",
    title: "Categories",
    description: "Mesurez le poids de chaque categorie dans les ventes.",
  },
  "admin-inventory": {
    eyebrow: "Inventaire",
    title: "Stock et mouvements",
    description: "Reperez les variantes critiques et les derniers mouvements.",
  },
  "admin-rentals": {
    eyebrow: "Locations",
    title: "Gestion des locations",
    description:
      "Controlez les reservations, retraits, retours, retards et revenus de location.",
  },
  "admin-customers": {
    eyebrow: "Clients",
    title: "Clients et activite",
    description:
      "Identifiez les meilleurs clients et la croissance des comptes.",
  },
  "admin-users": {
    eyebrow: "Clients",
    title: "Utilisateurs et clients",
    description:
      "Consultez les comptes clients, les meilleurs acheteurs et la repartition par pays.",
  },
  "admin-gift-cards": {
    eyebrow: "Cartes cadeaux",
    title: "Portefeuille cartes cadeaux",
    description:
      "Surveillez les cartes actives, soldes, reserves et types vendus.",
  },
  "admin-resales": {
    eyebrow: "Reventes",
    title: "Reventes AK Fashion Plus",
    description:
      "Suivez les montants a reverser aux guichets et les operations par agence.",
  },
  "admin-payments": {
    eyebrow: "Finances",
    title: "Paiements et recettes",
    description:
      "Controlez Stripe, cartes cadeaux, paiements reussis et echecs.",
  },
  "admin-reviews": {
    eyebrow: "Avis",
    title: "Avis clients",
    description: "Suivez la satisfaction, les notes et les avis a moderer.",
  },
  "admin-branches": {
    eyebrow: "Guichets",
    title: "Performance des guichets",
    description: "Comparez les agences, retraits et revenus associes.",
  },
  "admin-cashiers": {
    eyebrow: "Guichets",
    title: "Caissiers et guichets",
    description:
      "Gardez une vue d'ensemble des agences et des operations de retrait.",
  },
  "admin-notifications": {
    eyebrow: "Notifications",
    title: "Notifications et alertes",
    description: "Consultez les messages recents et alertes operationnelles.",
  },
  "admin-settings": {
    eyebrow: "Parametres",
    title: "Parametres admin",
    description:
      "Vue de controle pour les donnees critiques et la configuration future.",
  },
};

function toNumber(value: unknown) {
  return Number(value || 0);
}

function toText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value));
}

function aoa(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(toNumber(value))} ${
    localStorage.getItem("ak_display_currency") || "AOA"
  }`;
}

function dateLabel(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(String(value)));
}

function percentage(value: unknown) {
  const numeric = toNumber(value);
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(1)}%`;
}

function maxOf(rows: AdminMetricRow[], key: string) {
  return Math.max(...rows.map((row) => toNumber(row[key])), 1);
}

export default function AdminDashboardPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminDashboardPageProps) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdminDashboardFilters>({
    period: "30d",
    activityType: "all",
  });

  useEffect(() => {
    let mounted = true;

    fetchAdminDashboard(filters)
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((requestError: Error) => {
        if (mounted) setError(requestError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  const copy = moduleCopy[page] || moduleCopy["admin-dashboard"];
  const cards = useMemo(() => buildCards(data), [data]);
  const updateFilters = (nextFilters: Partial<AdminDashboardFilters>) => {
    setLoading(true);
    setError("");
    setFilters((current) => ({ ...current, ...nextFilters }));
  };

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-hero">
        <div>
          <p>{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <span>{copy.description}</span>
        </div>
        <button onClick={() => go("home")} type="button">
          Voir le site
        </button>
      </section>

      <section className="admin-filters">
        <div className="admin-periods">
          {periods.map(([id, label]) => (
            <button
              className={filters.period === id ? "active" : ""}
              key={id}
              onClick={() => updateFilters({ period: id })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          Guichet
          <select
            onChange={(event) =>
              updateFilters({
                branchId: event.target.value,
              })
            }
            value={filters.branchId || ""}
          >
            <option value="">Tous les guichets</option>
            {data?.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Activite
          <select
            onChange={(event) =>
              updateFilters({
                activityType: event.target.value,
              })
            }
            value={filters.activityType || "all"}
          >
            <option value="all">Tout</option>
            <option value="sales">Ventes</option>
            <option value="rentals">Locations</option>
          </select>
        </label>
        {filters.period === "custom" && (
          <>
            <label>
              Debut
              <input
                onChange={(event) =>
                  updateFilters({
                    startDate: event.target.value,
                  })
                }
                type="date"
                value={filters.startDate || ""}
              />
            </label>
            <label>
              Fin
              <input
                onChange={(event) =>
                  updateFilters({
                    endDate: event.target.value,
                  })
                }
                type="date"
                value={filters.endDate || ""}
              />
            </label>
          </>
        )}
      </section>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">Chargement des donnees...</p>}
      {!loading && data && (
        <>
          <section className="admin-kpis">
            {cards.map((card) => (
              <article key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small className={card.delta.startsWith("-") ? "down" : ""}>
                  {card.delta}
                </small>
              </article>
            ))}
          </section>
          {renderModule(page, data)}
        </>
      )}
    </AdminLayout>
  );
}

function buildCards(data: AdminDashboardData | null) {
  return [
    {
      label: "Chiffre d'affaires",
      value: eur(data?.overview.revenue_eur),
      delta: percentage(data?.overview.revenue_trend),
    },
    {
      label: "Commandes",
      value: toText(data?.overview.total_orders || 0),
      delta: percentage(data?.overview.orders_trend),
    },
    {
      label: "Clients",
      value: toText(data?.overview.total_customers || 0),
      delta: `${toNumber(data?.overview.new_customers)} nouveaux`,
    },
    {
      label: "Cartes cadeaux",
      value: eur(data?.overview.gift_card_balance_eur),
      delta: `${toNumber(data?.overview.active_gift_cards)} actives`,
    },
  ];
}

function renderModule(page: string, data: AdminDashboardData) {
  if (page === "admin-orders") {
    return (
      <AdminGrid>
        <StatusPanel rows={data.order_statuses} />
        <DataPanel
          columns={["Reference", "Client", "Statut", "Paiement", "Total"]}
          rows={data.recent_activity.filter((row) => row.type === "Commande")}
          title="Commandes recentes"
          values={["label", "actor", "status", "type", "amount_eur"]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-products" || page === "admin-categories") {
    return (
      <AdminGrid>
        <DataPanel
          columns={["Produit", "Categorie", "Quantite", "Revenu"]}
          rows={data.top_products}
          title="Meilleurs produits"
          values={[
            "product_name",
            "category_name",
            "total_quantity",
            "revenue_eur",
          ]}
        />
        <BarPanel
          labelKey="category_name"
          rows={data.category_performance}
          title="Performance par categorie"
          valueKey="revenue_eur"
        />
      </AdminGrid>
    );
  }

  if (page === "admin-inventory") {
    return (
      <AdminGrid>
        <InventorySummary summary={data.inventory.summary} />
        <DataPanel
          columns={["Produit", "Taille", "Couleur", "Disponible"]}
          rows={data.inventory.critical_stock}
          title="Stock critique"
          values={["product_name", "size", "color_name", "available_quantity"]}
        />
        <DataPanel
          columns={["Produit", "Mouvement", "Avant", "Apres", "Date"]}
          rows={data.inventory.movements}
          title="Derniers mouvements"
          values={[
            "product_name",
            "movement_type",
            "quantity_before",
            "quantity_after",
            "created_at",
          ]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-rentals") {
    return (
      <AdminGrid>
        <StatusPanel rows={data.rentals.summary} title="Statuts location" />
        <DataPanel
          columns={[
            "Commande",
            "Produit",
            "Client",
            "Debut",
            "Retour",
            "Total",
          ]}
          rows={data.rentals.upcoming}
          title="Locations a venir ou en cours"
          values={[
            "order_number",
            "product_name",
            "customer_name",
            "rental_start_date",
            "rental_end_date",
            "line_total_eur",
          ]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-customers" || page === "admin-users") {
    return (
      <AdminGrid>
        <DataPanel
          columns={["Client", "Email", "Commandes", "Depense"]}
          rows={data.customers.top}
          title="Meilleurs clients"
          values={["customer_name", "email", "orders", "spent_eur"]}
        />
        <BarPanel
          labelKey="country_code"
          rows={data.customers.by_country}
          title="Clients par pays"
          valueKey="customers"
        />
      </AdminGrid>
    );
  }

  if (page === "admin-gift-cards") {
    return (
      <AdminGrid>
        <GiftCardSummary data={data} />
        <BarPanel
          labelKey="name"
          rows={data.gift_cards.by_type}
          title="Cartes par modele"
          valueKey="current_balance_eur"
        />
      </AdminGrid>
    );
  }

  if (page === "admin-resales") {
    return (
      <AdminGrid>
        <FinancePanel
          rows={[
            ["Operations", data.resales.summary.total_resales],
            ["En attente", data.resales.summary.pending_payouts],
            ["Montant EUR", eur(data.resales.summary.amount_eur)],
            [
              `Montant ${localStorage.getItem("ak_display_currency") || "AOA"}`,
              aoa(data.resales.summary.payout_aoa),
            ],
          ]}
          title="Synthese reventes"
        />
        <BarPanel
          labelKey="branch_name"
          rows={data.resales.by_branch}
          title="Reventes par guichet"
          valueKey="payout_aoa"
        />
      </AdminGrid>
    );
  }

  if (page === "admin-payments") {
    return (
      <AdminGrid>
        <FinancePanel
          rows={[
            ["Paiements", data.payments.summary.total_payments],
            ["Reussis", data.payments.summary.succeeded_payments],
            ["En attente", data.payments.summary.pending_payments],
            ["Echecs", data.payments.summary.failed_payments],
            ["Montant reussi", eur(data.payments.summary.succeeded_amount_eur)],
          ]}
          title="Synthese paiements"
        />
        <DataPanel
          columns={["Methode", "Objet", "Statut", "Montant"]}
          rows={data.payments.by_method}
          title="Paiements par methode"
          values={["method", "purpose", "status", "amount_eur"]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-reviews") {
    return (
      <AdminGrid>
        <BarPanel
          labelKey="rating"
          rows={data.reviews.by_stars}
          title="Repartition des notes"
          valueKey="reviews"
        />
        <DataPanel
          columns={["Produit", "Client", "Note", "Statut", "Date"]}
          rows={data.reviews.recent}
          title="Avis recents"
          values={[
            "product_name",
            "customer_name",
            "rating",
            "status",
            "created_at",
          ]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-branches" || page === "admin-cashiers") {
    return (
      <AdminGrid>
        <DataPanel
          columns={["Guichet", "Commandes", "Revenu", "Prets retrait"]}
          rows={data.branches_performance}
          title="Performance des guichets"
          values={["branch_name", "orders", "revenue_eur", "ready_for_pickup"]}
        />
      </AdminGrid>
    );
  }

  if (page === "admin-notifications" || page === "admin-settings") {
    return (
      <AdminGrid>
        <AlertsPanel rows={data.alerts} />
        <DataPanel
          columns={["Type", "Titre", "Message", "Lu", "Date"]}
          rows={data.notifications}
          title="Notifications recentes"
          values={["type", "title", "message", "is_read", "created_at"]}
        />
      </AdminGrid>
    );
  }

  return (
    <AdminGrid>
      <RevenuePanel data={data} />
      <StatusPanel rows={data.order_statuses} />
      <BarPanel
        labelKey="product_name"
        rows={data.top_products}
        title="Top produits"
        valueKey="revenue_eur"
      />
      <DataPanel
        columns={["Activite", "Reference", "Acteur", "Statut", "Date"]}
        rows={data.recent_activity}
        title="Activite recente"
        values={["type", "label", "actor", "status", "created_at"]}
      />
      <AlertsPanel rows={data.alerts} />
    </AdminGrid>
  );
}

function AdminGrid({ children }: { children: React.ReactNode }) {
  return <section className="admin-grid">{children}</section>;
}

function RevenuePanel({ data }: { data: AdminDashboardData }) {
  const max = maxOf(data.revenue_series, "revenue_eur");
  return (
    <section className="admin-panel wide">
      <div className="admin-panel-head">
        <div>
          <p>Revenus</p>
          <h3>Evolution du chiffre d'affaires</h3>
        </div>
        <strong>{eur(data.overview.revenue_eur)}</strong>
      </div>
      <div className="admin-chart">
        {data.revenue_series.length ? (
          data.revenue_series.map((row) => (
            <div className="admin-chart-column" key={toText(row.date)}>
              <span
                style={
                  {
                    "--height": `${Math.max((toNumber(row.revenue_eur) / max) * 100, 4)}%`,
                  } as CSSProperties
                }
              />
              <small>{toText(row.label)}</small>
            </div>
          ))
        ) : (
          <EmptyState text="Aucun revenu sur cette periode." />
        )}
      </div>
    </section>
  );
}

function StatusPanel({
  rows,
  title = "Statuts commandes",
}: {
  rows: AdminMetricRow[];
  title?: string;
}) {
  const total = rows.reduce((sum, row) => sum + toNumber(row.count), 0) || 1;
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p>Repartition</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="admin-status-list">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${row.status}-${row.rental_status}`}>
              <span>
                {toText(row.status || row.rental_status)}
                <strong>{toNumber(row.count)}</strong>
              </span>
              <i
                style={
                  {
                    "--width": `${(toNumber(row.count) / total) * 100}%`,
                  } as CSSProperties
                }
              />
            </div>
          ))
        ) : (
          <EmptyState text="Aucun statut disponible." />
        )}
      </div>
    </section>
  );
}

function BarPanel({
  labelKey,
  rows,
  title,
  valueKey,
}: {
  labelKey: string;
  rows: AdminMetricRow[];
  title: string;
  valueKey: string;
}) {
  const max = maxOf(rows, valueKey);
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p>Classement</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="admin-bars">
        {rows.length ? (
          rows.slice(0, 8).map((row) => (
            <div key={`${row[labelKey]}-${row[valueKey]}`}>
              <span>{toText(row[labelKey])}</span>
              <strong>
                {valueKey.includes("eur")
                  ? eur(row[valueKey])
                  : toText(row[valueKey])}
              </strong>
              <i
                style={
                  {
                    "--width": `${Math.max((toNumber(row[valueKey]) / max) * 100, 3)}%`,
                  } as CSSProperties
                }
              />
            </div>
          ))
        ) : (
          <EmptyState text="Aucune donnee pour ce classement." />
        )}
      </div>
    </section>
  );
}

function DataPanel({
  columns,
  rows,
  title,
  values,
}: {
  columns: string[];
  rows: AdminMetricRow[];
  title: string;
  values: string[];
}) {
  return (
    <section className="admin-panel wide">
      <div className="admin-panel-head">
        <div>
          <p>Donnees</p>
          <h3>{title}</h3>
        </div>
      </div>
      {rows.length ? (
        <div className="admin-table">
          <div
            className="admin-table-row head"
            style={{ "--columns": columns.length } as CSSProperties}
          >
            {columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {rows.slice(0, 10).map((row, index) => (
            <div
              className="admin-table-row"
              key={`${title}-${index}`}
              style={{ "--columns": columns.length } as CSSProperties}
            >
              {values.map((key) => (
                <span key={key}>{formatCell(key, row[key])}</span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Aucune donnee disponible." />
      )}
    </section>
  );
}

function formatCell(key: string, value: unknown) {
  if (key.includes("eur") || key === "amount_eur") return eur(value);
  if (key.includes("aoa")) return aoa(value);
  if (key.includes("date") || key.includes("created_at"))
    return dateLabel(value);
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value === 1 || value === 0)
    return key === "is_read" ? (value ? "Oui" : "Non") : toText(value);
  return toText(value);
}

function InventorySummary({ summary }: { summary: AdminMetricRow }) {
  return (
    <FinancePanel
      rows={[
        ["Variantes", summary.variants],
        ["Stock total", summary.stock_quantity],
        ["Reserve", summary.reserved_quantity],
        ["Rupture", summary.out_of_stock],
        ["Stock faible", summary.low_stock],
      ]}
      title="Synthese stock"
    />
  );
}

function GiftCardSummary({ data }: { data: AdminDashboardData }) {
  return (
    <FinancePanel
      rows={[
        ["Cartes actives", data.gift_cards.liability.active_cards],
        ["Solde courant", eur(data.gift_cards.liability.total_balance_eur)],
        ["Solde reserve", eur(data.gift_cards.liability.total_reserved_eur)],
        ["Disponible", eur(data.gift_cards.liability.total_available_eur)],
      ]}
      title="Synthese cartes cadeaux"
    />
  );
}

function FinancePanel({
  rows,
  title,
}: {
  rows: [string, string | number | null | undefined][];
  title: string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p>Synthese</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="admin-finance-list">
        {rows.map(([label, value]) => (
          <span key={label}>
            {label}
            <strong>{toText(value)}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}

function AlertsPanel({ rows }: { rows: AdminMetricRow[] }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p>Priorites</p>
          <h3>Alertes operationnelles</h3>
        </div>
      </div>
      <div className="admin-alerts">
        {rows.length ? (
          rows.map((row, index) => (
            <article key={`${row.title}-${index}`}>
              <strong>{toText(row.title)}</strong>
              <span>{toText(row.message)}</span>
              <small>{toText(row.severity)}</small>
            </article>
          ))
        ) : (
          <EmptyState text="Aucune alerte critique." />
        )}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="admin-empty">{text}</p>;
}
