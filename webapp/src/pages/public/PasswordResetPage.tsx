import { useState, type FormEvent } from "react";
import { post } from "../../services/api";

const copy = {
  fr: { forgot: "Mot de passe oublie", reset: "Nouveau mot de passe", email: "Adresse e-mail", password: "Mot de passe (8 caracteres minimum)", confirm: "Confirmer le mot de passe", send: "Envoyer le lien", save: "Modifier le mot de passe", sent: "Si ce compte existe, un lien vous sera envoye par e-mail. Verifiez aussi les courriers indesirables.", saved: "Votre mot de passe a ete modifie.", login: "Connexion", mismatch: "Les mots de passe ne correspondent pas.", error: "Impossible de traiter la demande. Verifiez le lien ou reessayez plus tard." },
  en: { forgot: "Forgot password", reset: "New password", email: "Email address", password: "Password (at least 8 characters)", confirm: "Confirm password", send: "Send reset link", save: "Change password", sent: "If this account exists, a reset link will be emailed to you. Please also check your spam folder.", saved: "Your password has been changed.", login: "Sign in", mismatch: "Passwords do not match.", error: "Unable to process this request. Check the link or try again later." },
  pt: { forgot: "Esqueceu a palavra-passe", reset: "Nova palavra-passe", email: "Endereco de email", password: "Palavra-passe (minimo 8 caracteres)", confirm: "Confirmar palavra-passe", send: "Enviar link", save: "Alterar palavra-passe", sent: "Se esta conta existir, recebera um link por email. Verifique tambem a pasta de spam.", saved: "A sua palavra-passe foi alterada.", login: "Iniciar sessao", mismatch: "As palavras-passe nao coincidem.", error: "Nao foi possivel processar o pedido. Verifique o link ou tente mais tarde." },
};

export default function PasswordResetPage({ reset, language }: { reset: boolean; language: "fr" | "en" | "pt" }) {
  const c = copy[language];
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    if (reset && data.get("password") !== data.get("password_confirmation")) { setError(c.mismatch); return; }
    setBusy(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await post(`/auth/${reset ? "reset-password" : "forgot-password"}`, reset ? {
        email: params.get("email"), token: params.get("token"),
        password: data.get("password"), password_confirmation: data.get("password_confirmation"),
      } : { email: data.get("email") });
      setDone(true);
      if (reset) window.history.replaceState(null, "", "/reset-password");
    } catch { setError(c.error); } finally { setBusy(false); }
  }
  return <section className="info-page" style={{ maxWidth: 600, margin: "32px auto", padding: 20 }}>
    <h1 style={{ fontSize: 32 }}>{reset ? c.reset : c.forgot}</h1>
    {done ? <p role="status">{reset ? c.saved : c.sent}</p> : <form className="contact-form" onSubmit={submit}>
      {reset ? <>
        <label htmlFor="new-password">{c.password}</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={256} required />
        <label htmlFor="confirm-password">{c.confirm}</label>
        <input id="confirm-password" name="password_confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={256} required />
      </> : <><label htmlFor="reset-email">{c.email}</label><input id="reset-email" name="email" type="email" autoComplete="email" maxLength={255} required /></>}
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? "..." : reset ? c.save : c.send}</button>
    </form>}
    <a href="/login">{c.login}</a>
  </section>;
}
