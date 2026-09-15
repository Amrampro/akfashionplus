import PageShell from "../PageShell";

export default function LoginPage() {
  return (
    <PageShell
      area="Public"
      title="Connexion"
      description="Acces securise aux espaces client, caissier et administrateur selon le role du compte."
      metrics={["Clients", "Caissiers", "Admins", "Sessions"]}
    />
  );
}
