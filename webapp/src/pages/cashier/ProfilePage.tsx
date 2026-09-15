import { useEffect, useMemo, useState, type FormEvent } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get, post, postForm, put } from "../../services/api";
import {
  initials,
  type CashierPageProps,
  type CashierProfileSession,
} from "./cashierUtils";

type CashierProfileProps = CashierPageProps & {
  setSession: (session: CashierProfileSession) => void;
};

type Profile = {
  id: number;
  role: "user" | "cashier" | "admin";
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_language: "fr" | "en" | "pt";
  country_code: string | null;
  avatar_url: string | null;
  status: string;
  branch_name?: string | null;
  branch_city?: string | null;
};

const defaultProfile: Profile = {
  id: 0,
  role: "cashier",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  preferred_language: "fr",
  country_code: "AO",
  avatar_url: "",
  status: "active",
};

export default function ProfilePage(props: CashierProfileProps) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    get<Profile>("/users/me")
      .then((data) => {
        if (active) setProfile({ ...defaultProfile, ...data });
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "Employe guichet";
  const visibleAvatar = avatarPreview || profile.avatar_url || "";

  const completeness = useMemo(() => {
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.phone,
      profile.preferred_language,
      profile.country_code,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile]);

  function selectAvatar(file?: File) {
    setNotice("");
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Veuillez choisir une image valide.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas depasser 5 Mo.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setError("Le prenom et le nom sont obligatoires.");
      return;
    }

    setSavingProfile(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const body = new FormData();
        body.append("avatar", avatarFile);
        const uploaded = await postForm<Profile>("/users/me/avatar", body);
        avatarUrl = uploaded.avatar_url;
      }
      const updated = await put<Profile>("/users/me", {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        preferred_language: profile.preferred_language,
        country_code: profile.country_code?.trim().toUpperCase() || null,
        avatar_url: avatarUrl || null,
      });
      const nextProfile = { ...profile, ...updated };
      const nextSession = {
        role: nextProfile.role,
        name: `${nextProfile.first_name} ${nextProfile.last_name}`.trim(),
        email: nextProfile.email,
      };
      localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
      props.setSession(nextSession);
      setProfile(nextProfile);
      setAvatarFile(null);
      setAvatarPreview("");
      setNotice("Profil guichet mis a jour.");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setSavingPassword(true);
    try {
      await post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Mot de passe mis a jour.");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Profil</p>
            <h2>Profil guichet</h2>
            <span>
              Modifiez vos informations personnelles, votre avatar, votre langue
              et votre mot de passe.
            </span>
          </div>
          <button onClick={() => props.go("cashier-dashboard")} type="button">
            Retour dashboard
          </button>
        </section>

        {notice ? <div className="cashier-success">{notice}</div> : null}
        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-profile-grid">
          <aside className="cashier-panel cashier-profile-card">
            <div className="cashier-profile-avatar">
              {visibleAvatar ? (
                <img alt="Avatar guichet" src={visibleAvatar} />
              ) : (
                initials(fullName)
              )}
            </div>
            <h3>{loading ? "Chargement..." : fullName}</h3>
            <p>{profile.email || "Email guichet"}</p>
            <span>{profile.status}</span>
            <strong>{completeness}%</strong>
            <small>Profil complete</small>
          </aside>

          <form className="cashier-panel cashier-profile-form" onSubmit={saveProfile}>
            <div className="cashier-panel-head">
              <div>
                <p>Informations</p>
                <h3>Identite et preferences</h3>
              </div>
            </div>
            <div className="cashier-form-grid">
              <label>
                Prenom
                <input
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  value={profile.first_name}
                />
              </label>
              <label>
                Nom
                <input
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  value={profile.last_name}
                />
              </label>
              <label>
                Email
                <input disabled value={profile.email} />
              </label>
              <label>
                Telephone
                <input
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  value={profile.phone || ""}
                />
              </label>
              <label>
                Langue
                <select
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      preferred_language: event.target
                        .value as Profile["preferred_language"],
                    }))
                  }
                  value={profile.preferred_language}
                >
                  <option value="fr">FR - Francais</option>
                  <option value="en">EN - English</option>
                  <option value="pt">PT - Portugues</option>
                </select>
              </label>
              <label>
                Pays
                <select
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      country_code: event.target.value,
                    }))
                  }
                  value={profile.country_code || "AO"}
                >
                  <option value="AO">Angola</option>
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="PT">Portugal</option>
                </select>
              </label>
              <div className="cashier-avatar-upload wide">
                <div className="cashier-avatar-preview">
                  {visibleAvatar ? (
                    <img alt="Avatar actuel" src={visibleAvatar} />
                  ) : (
                    <span>{initials(fullName)}</span>
                  )}
                </div>
                <label>
                  Photo de profil
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    disabled={loading}
                    onChange={(event) => selectAvatar(event.target.files?.[0])}
                    type="file"
                  />
                  <small>
                    {avatarFile
                      ? avatarFile.name
                      : "PNG, JPG ou WebP depuis votre appareil."}
                  </small>
                </label>
              </div>
            </div>
            <button disabled={loading || savingProfile} type="submit">
              {savingProfile ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </form>

          <form className="cashier-panel cashier-security-card" onSubmit={changePassword}>
            <div className="cashier-panel-head">
              <div>
                <p>Securite</p>
                <h3>Mot de passe</h3>
              </div>
            </div>
            <div className="cashier-form-grid">
              <label className="wide">
                Mot de passe actuel
                <input
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label>
                Nouveau mot de passe
                <input
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  value={newPassword}
                />
              </label>
              <label>
                Confirmer
                <input
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                />
              </label>
            </div>
            <button disabled={savingPassword} type="submit">
              {savingPassword ? "Mise a jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </section>
      </section>
    </CashierLayout>
  );
}
