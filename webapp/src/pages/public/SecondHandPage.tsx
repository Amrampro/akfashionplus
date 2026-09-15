import PageShell from "../PageShell";

export default function SecondHandPage() {
  return (
    <PageShell
      area="Public"
      title="Seconde main"
      description="Articles verifies pour la revente avec etat, prix multidevise et disponibilite boutique."
      metrics={["Articles verifies", "Reventes", "Prix moyen", "Stock"]}
    />
  );
}
