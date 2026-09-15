import PageShell from "../PageShell";

export default function CartPage() {
  return (
    <PageShell
      area="Public"
      title="Panier"
      description="Resume des articles, quantites, location, revente a AK Fashion Plus et total avant paiement."
      metrics={["Articles", "Total", "Location", "Revente"]}
    />
  );
}
