import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, post, postForm, put } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
  setSession: (session: ProfileSession) => void;
};

type ProfileSession = {
  role: "user" | "cashier" | "admin";
  name: string;
  email: string;
};

type AdminProfile = {
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
};

const defaultProfile: AdminProfile = {
  id: 0,
  role: "admin",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  preferred_language: "fr",
  country_code: "AO",
  avatar_url: "",
  status: "active",
};

function initials(profile: AdminProfile) {
  return (
    `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`
      .trim()
      .toUpperCase() || "AK"
  );
}

export default function AdminProfilePage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
  setSession,
}: AdminPageProps) {
  const [profile, setProfile] = useState<AdminProfile>(defaultProfile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      get<AdminProfile>("/users/me")
        .then((data) => {
          if (active) setProfile({ ...defaultProfile, ...data });
        })
        .catch((requestError: Error) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(
    () => () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    },
    [avatarPreview],
  );

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

  const visibleAvatar = avatarPreview || profile.avatar_url || "";

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
        const uploaded = await postForm<AdminProfile>("/users/me/avatar", body);
        avatarUrl = uploaded.avatar_url;
      }

      const updated = await put<AdminProfile>("/users/me", {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        preferred_language: profile.preferred_language,
        country_code: profile.country_code?.trim().toUpperCase() || null,
        avatar_url: avatarUrl?.trim() || null,
      });
      const nextProfile = { ...profile, ...updated };
      const nextSession = {
        role: nextProfile.role || "admin",
        name: `${nextProfile.first_name} ${nextProfile.last_name}`.trim(),
        email: nextProfile.email,
      };
      localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
      setProfile(nextProfile);
      setAvatarFile(null);
      setAvatarPreview("");
      setSession(nextSession);
      setNotice("Profil admin mis a jour.");
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
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-profile-page">
        <section className="admin-hero">
          <div>
            <p>Profil</p>
            <h2>Profil administrateur</h2>
            <span>
              Modifiez vos informations personnelles, votre langue et votre mot
              de passe de connexion.
            </span>
          </div>
          <button onClick={() => go("admin-dashboard")} type="button">
            Retour dashboard
          </button>
        </section>

        {notice ? <div className="admin-success">{notice}</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}

        <section className="admin-profile-overview admin-data-card">
          <div className="admin-profile-identity">
            <div className="admin-profile-avatar">
              {visibleAvatar ? (
                <img alt="Avatar administrateur" src={visibleAvatar} />
              ) : (
                initials(profile)
              )}
            </div>
            <div>
              <p>Compte administrateur</p>
              <h3>
                {loading
                  ? "Chargement..."
                  : `${profile.first_name} ${profile.last_name}`.trim() ||
                    "Administrateur"}
              </h3>
              <span>{profile.email || "Email administrateur"}</span>
            </div>
          </div>
          <div className="admin-profile-meta">
            <article>
              <span>Statut</span>
              <strong>{profile.status}</strong>
            </article>
            <article>
              <span>Role</span>
              <strong>{profile.role}</strong>
            </article>
            <article>
              <span>Profil</span>
              <strong>{completeness}%</strong>
            </article>
          </div>
        </section>

        <section className="admin-profile-grid">
          <form className="admin-data-card admin-profile-form-card" onSubmit={saveProfile}>
            <div className="admin-section-heading">
              <div>
                <p>Informations</p>
                <h3>Identite et preferences</h3>
              </div>
            </div>
            <div className="admin-profile-form-grid">
              <label>
                <span>Prenom</span>
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
                <span>Nom</span>
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
                <span>Email</span>
                <input disabled value={profile.email} />
              </label>
              <label>
                <span>Telephone</span>
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
                <span>Langue preferee</span>
                <select
                  disabled={loading}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      preferred_language: event.target
                        .value as AdminProfile["preferred_language"],
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
                <span>Pays</span>
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
              <div className="admin-avatar-upload wide">
                <div className="admin-avatar-preview">
                  {visibleAvatar ? (
                    <img alt="Avatar actuel" src={visibleAvatar} />
                  ) : (
                    <span>{initials(profile)}</span>
                  )}
                </div>
                <label>
                  <span>Photo de profil</span>
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
            <div className="admin-form-actions">
              <button disabled={loading || savingProfile} type="submit">
                {savingProfile ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>

          <form className="admin-data-card admin-profile-security-card" onSubmit={changePassword}>
            <div className="admin-section-heading">
              <div>
                <p>Securite</p>
                <h3>Mot de passe</h3>
              </div>
            </div>
            <div className="admin-profile-form-grid single">
              <label className="wide">
                <span>Mot de passe actuel</span>
                <input
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label>
                <span>Nouveau mot de passe</span>
                <input
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  value={newPassword}
                />
              </label>
              <label>
                <span>Confirmer</span>
                <input
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                />
              </label>
            </div>
            <div className="admin-form-actions">
              <button disabled={savingPassword} type="submit">
                {savingPassword ? "Mise a jour..." : "Changer le mot de passe"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </AdminLayout>
  );
}
