import PageShell from "../PageShell";

export default function AddressesPage() {
  return (
    <PageShell
      area="Client"
      title="Adresses"
      description="Carnet d adresses avec adresse par defaut, livraison et beneficiaires."
      metrics={["Adresses", "Defaut", "Villes", "Livraisons"]}
    />
  );
}
