import PageShell from "../PageShell";

export default function NewProductsPage() {
  return (
    <PageShell
      area="Public"
      title="Nouveautes"
      description="Selection des nouvelles robes, vestes, chaussures et accessoires disponibles en achat ou location."
      metrics={["Nouveaux produits", "Tailles", "Couleurs", "Ventes"]}
    />
  );
}
