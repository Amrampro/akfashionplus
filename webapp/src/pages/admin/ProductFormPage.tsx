import PageShell from "../PageShell";

export default function ProductFormPage() {
  return (
    <PageShell
      area="Admin"
      title="Formulaire produit"
      description="Creation ou modification produit avec prix, location, depot, tailles et couleurs."
      metrics={["Prix", "Location", "Depot", "Variantes"]}
    />
  );
}
