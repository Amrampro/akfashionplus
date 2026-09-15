import PageShell from "../PageShell";

export default function CashiersPage() {
  return (
    <PageShell
      area="Admin"
      title="Caissiers"
      description="Administration des comptes caissiers et des affectations de branches."
      metrics={["Caissiers", "Branches", "Actifs", "Operations"]}
    />
  );
}
