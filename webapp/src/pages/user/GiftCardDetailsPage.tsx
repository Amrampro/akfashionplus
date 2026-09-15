import PageShell from "../PageShell";

export default function GiftCardDetailsPage() {
  return (
    <PageShell
      area="Client"
      title="Details carte cadeau"
      description="Historique complet d une carte cadeau et solde disponible apres reservations."
      metrics={["Solde", "Reserve", "Historique", "Statut"]}
    />
  );
}
