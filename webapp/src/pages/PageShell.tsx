import { useLanguage } from "../hooks/useLanguage";

type PageShellProps = {
  title: string;
  area: "Public" | "Client" | "Caissier" | "Admin";
  description: string;
  metrics?: string[];
};

const defaultRows = [
  ["#AK12345", "Robe satinee elegante", "En cours", "79,90 EUR"],
  ["#AK12346", "Blazer structure", "Confirmee", "99,90 EUR"],
  [
    "#REV641",
    "Revente boutique",
    "Approuvee",
    `47 000 ${localStorage.getItem("ak_display_currency") || "AOA"}`,
  ],
];

export default function PageShell({
  area,
  description,
  metrics = [],
  title,
}: PageShellProps) {
  const { language, t } = useLanguage();
  const text = (value: string) => (language === "fr" ? value : t[value] || value);

  return (
    <section className="ak-page rich-page">
      <div className="page-hero">
        <p className="eyebrow">{text(area)}</p>
        <h1>{text(title)}</h1>
        <p>{text(description)}</p>
      </div>
      <div className="stats-grid">
        {(metrics.length ? metrics : ["Commandes", "Locations", "Cartes cadeaux", "Notifications"]).map((metric, index) => (
          <article key={metric}>
            <span>{text(metric)}</span>
            <strong>{["128", "34", "2350 EUR", "18"][index] || "12"}</strong>
            <small>{text("Actif")}</small>
          </article>
        ))}
      </div>
      <section className="data-panel">
        <h2>{text("Activite recente")}</h2>
        {defaultRows.map((row) => (
          <div className="data-row" key={row.join("-")}>
            {row.map((cell) => (
              <span key={cell}>{text(cell)}</span>
            ))}
          </div>
        ))}
      </section>
    </section>
  );
}
