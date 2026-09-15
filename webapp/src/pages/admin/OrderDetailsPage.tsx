import PageShell from "../PageShell";

export default function OrderDetailsPage() {
  return (
    <PageShell
      area="Admin"
      title="Details commande"
      description="Vision administrative des articles, paiements, client, branche et historique."
      metrics={["Client", "Paiements", "Articles", "Historique"]}
    />
  );
}
