import PageShell from "../PageShell";

export default function RentalPage() {
  return (
    <PageShell
      area="Public"
      title="Location"
      description="Parcours de location avec calendrier, depot, prix journalier, retrait et retour au guichet."
      metrics={["Locations", "Disponibles", "Retours", "Depots"]}
    />
  );
}
