import PageShell from "../PageShell";

export default function GiftCardTypesPage() {
  return (
    <PageShell
      area="Admin"
      title="Types cartes cadeaux"
      description="Gestion des modeles Kavula, Leticia, Senga, Kimolo, Mwanza et montants."
      metrics={["Types", "Montants", "Actifs", "Creations"]}
    />
  );
}
