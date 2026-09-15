import PageShell from "../PageShell";

export default function ForgotPasswordPage() {
  return (
    <PageShell
      area="Public"
      title="Mot de passe oublie"
      description="Demande de reinitialisation pour recuperer un acces au compte AK Fashion Plus."
      metrics={["Demandes", "Emails", "Securite", "Comptes"]}
    />
  );
}
