import PageShell from "../PageShell";

export default function RegisterPage() {
  return (
    <PageShell
      area="Public"
      title="Inscription"
      description="Creation de compte client avec informations personnelles, langue preferee et contact."
      metrics={["Nouveaux comptes", "Verification", "Profil", "Langue"]}
    />
  );
}
