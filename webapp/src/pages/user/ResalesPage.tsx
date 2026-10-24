import PageShell from "../PageShell";

export default function ResalesPage() {
  const displayCurrency =
    localStorage.getItem("ak_display_currency") || "AOA";

  return (
    <PageShell
      area="Client"
      title="Mes cadeaux offerts"
      description="Mes cadeaux offerts et leur statut de traitement."
      metrics={["Demandes", "Approuvees", "Payees", displayCurrency]}
    />
  );
}
