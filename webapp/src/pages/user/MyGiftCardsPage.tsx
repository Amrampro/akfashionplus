import PageShell from "../PageShell";

export default function MyGiftCardsPage() {
  return (
    <PageShell
      area="Client"
      title="Mes cartes cadeaux"
      description="Cartes possedees, solde courant, solde reserve et transactions recentes."
      metrics={["Cartes", "Solde", "Reserve", "Transactions"]}
    />
  );
}
