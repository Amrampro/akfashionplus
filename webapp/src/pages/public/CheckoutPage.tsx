import PageShell from "../PageShell";

export default function CheckoutPage() {
  return (
    <PageShell
      area="Public"
      title="Checkout"
      description="Paiement Stripe ou carte cadeau, livraison/retrait, beneficiaire et confirmation de commande."
      metrics={["Paiement", "Retrait", "Livraison", "Total"]}
    />
  );
}
