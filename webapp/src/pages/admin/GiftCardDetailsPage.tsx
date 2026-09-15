import PageShell from "../PageShell";

export default function GiftCardDetailsPage() {
  return (
    <PageShell
      area="Admin"
      title="Details carte cadeau"
      description="Historique administratif d une carte cadeau et operations de credit/debit."
      metrics={["Transactions", "Credit", "Debit", "Audit"]}
    />
  );
}
