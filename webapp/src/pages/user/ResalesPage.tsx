import PageShell from "../PageShell";

export default function ResalesPage() {
  const displayCurrency =
    localStorage.getItem("ak_display_currency") || "AOA";

  return (
    <PageShell
      area="Client"
      title="Mes reventes"
      description={`Demandes de revente a AK Fashion Plus avec estimation, validation et paiement ${displayCurrency}.`}
      metrics={["Demandes", "Approuvees", "Payees", displayCurrency]}
    />
  );
}
