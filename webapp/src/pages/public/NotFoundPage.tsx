import PageShell from "../PageShell";

export default function NotFoundPage() {
  return (
    <PageShell
      area="Public"
      title="Page introuvable"
      description="Etat propre pour rediriger vers la boutique, l accueil ou les espaces connectes."
      metrics={["Navigation", "Boutique", "Accueil", "Aide"]}
    />
  );
}
