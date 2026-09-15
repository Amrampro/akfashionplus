import PageShell from "../PageShell";

export default function AuditLogsPage() {
  return (
    <PageShell
      area="Admin"
      title="Audit logs"
      description="Journal des actions sensibles sur produits, paiements, taux, cartes et utilisateurs."
      metrics={["Actions", "Entites", "Admins", "Dates"]}
    />
  );
}
