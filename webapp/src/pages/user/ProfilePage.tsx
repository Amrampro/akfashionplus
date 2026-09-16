import { useEffect, useMemo, useState } from "react";
import { get, put } from "../../services/api";

type UserProfile = {
  id: number;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_language: "fr" | "en" | "pt";
  country_code: string | null;
  avatar_url: string | null;
  status: string;
};

type ProfileSession = {
  role: "user" | "cashier" | "admin";
  name: string;
  email: string;
};

const defaultProfile: UserProfile = {
  id: 0,
  role: "user",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  preferred_language: "pt",
  country_code: "AO",
  avatar_url: "",
  status: "active",
};

function initials(profile: UserProfile) {
  return (
    `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`
      .trim()
      .toUpperCase() || "AK"
  );
}

export default function ProfilePage({
  setSession,
}: {
  setSession: (session: ProfileSession) => void;
}) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    get<UserProfile>("/users/me")
      .then((data) => {
        if (active) setProfile({ ...defaultProfile, ...data });
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger le profil.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  async function saveProfile() {
    setMessage("");
    setError("");

    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setError("Le prenom et le nom sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const updated = await put<UserProfile>("/users/me", {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        preferred_language: profile.preferred_language,
        country_code: profile.country_code?.trim().toUpperCase() || null,
        avatar_url: profile.avatar_url?.trim() || null,
      });
      const nextProfile = { ...profile, ...updated };
      const nextSession = {
        role: (nextProfile.role as ProfileSession["role"]) || "user",
        name: `${nextProfile.first_name} ${nextProfile.last_name}`.trim(),
        email: nextProfile.email,
      };
      localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
      setProfile(nextProfile);
      setSession(nextSession);
      setMessage("Profil mis a jour.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de sauvegarder le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="user-profile-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Profil</p>
          <h2>Mes informations</h2>
          <p>
            Modifiez vos informations personnelles, votre telephone, votre pays
            et votre langue preferee.
          </p>
        </div>
        <div className="profile-completion">
          <span>{completeness}%</span>
          <small>Profil complete</small>
        </div>
      </section>

      <section className="user-profile-grid">
        <aside className="profile-card-preview">
          <div className="profile-avatar">{initials(profile)}</div>
          <h3>
            {loading
              ? "Chargement..."
              : `${profile.first_name} ${profile.last_name}`.trim() ||
                "Client AK"}
          </h3>
          <p>{profile.email || "Email du compte"}</p>
          <span>{profile.status}</span>
        </aside>

        <form
          className="user-panel profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <div className="profile-form-grid">
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
                placeholder="+244 912 345 678"
                value={profile.phone || ""}
              />
            </label>
            <label>
              Langue preferee
              <select
                disabled={loading}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    preferred_language: event.target
                      .value as UserProfile["preferred_language"],
                  }))
                }
                value={profile.preferred_language}
              >
                <option value="fr">Francais</option>
                <option value="en">English</option>
                <option value="pt">Portugues</option>
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
            <label className="profile-wide-field">
              Avatar URL
              <input
                disabled={loading}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    avatar_url: event.target.value,
                  }))
                }
                placeholder="https://..."
                value={profile.avatar_url || ""}
              />
            </label>
          </div>

          {error && <p className="user-alert">{error}</p>}
          {message && <p className="profile-success">{message}</p>}

          <div className="profile-actions">
            <button disabled={loading || saving} type="submit">
              {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
