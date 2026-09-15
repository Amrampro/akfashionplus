import PageShell from "../PageShell";

export default function ExchangeRatePage() {
  const displayCurrency =
    localStorage.getItem("ak_display_currency") || "AOA";

  return (
    <PageShell
      area="Admin"
      title={`Taux EUR/${displayCurrency}`}
      description={`Gestion du taux courant EUR vers ${displayCurrency} avec historique auditable.`}
      metrics={["Taux courant", "Historique", "EUR", displayCurrency]}
    />
  );
}
