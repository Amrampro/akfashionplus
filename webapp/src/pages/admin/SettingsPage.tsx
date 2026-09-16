import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, post, put } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

type ExchangeHistoryRow = {
  id: number;
  base_currency: string;
  quote_currency: string;
  rate: number;
  is_current: boolean | number;
  created_by: number | null;
  created_at: string;
};

type DeliveryCountry = {
  id: number;
  country_code: string;
  country_name: string;
  delivery_price_eur: number | string;
  status: "active" | "inactive";
  sort_order: number;
};

type SettingsResponse = {
  settings: SettingRow[];
  exchange_rate_eur_to_aoa: number;
  exchange_history: ExchangeHistoryRow[];
  delivery_countries: DeliveryCountry[];
};

type SettingForm = Record<string, string>;

const labels: Record<string, string> = {
  company_name: "Nom de la plateforme",
  default_currency: "Devise principale",
  default_language: "Langue par defaut",
  display_currency: "Devise affichee",
  gift_card_expiration_enabled: "Expiration cartes cadeaux",
  rental_late_fee_per_day_eur: "Penalite retard location / jour",
};

const groupKeys = {
  general: ["company_name", "default_language", "default_currency", "display_currency"],
  business: ["rental_late_fee_per_day_eur", "gift_card_expiration_enabled"],
};

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function eurToAoa(rate: unknown) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(rate || 0))} ${
    localStorage.getItem("ak_display_currency") || "AOA"
  }`;
}

function formFromSettings(settings: SettingRow[]): SettingForm {
  return settings.reduce<SettingForm>((form, setting) => {
    form[setting.setting_key] = setting.setting_value || "";
    return form;
  }, {});
}

function countryCodeFromName(countryName: string) {
  const normalized = countryName.trim().toLowerCase();
  const knownCodes: Record<string, string> = {
    angola: "AO",
    belgique: "BE",
    belgium: "BE",
    france: "FR",
    portugal: "PT",
    congo: "CG",
    "republique democratique du congo": "CD",
    "république démocratique du congo": "CD",
    rdc: "CD",
    canada: "CA",
    suisse: "CH",
    luxembourg: "LU",
  };

  return (
    knownCodes[normalized] ||
    normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "")
      .slice(0, 2)
      .toUpperCase() ||
    "AO"
  );
}

export default function SettingsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [form, setForm] = useState<SettingForm>({});
  const [exchangeRate, setExchangeRate] = useState(0);
  const [newExchangeRate, setNewExchangeRate] = useState("");
  const [exchangeHistory, setExchangeHistory] = useState<ExchangeHistoryRow[]>(
    [],
  );
  const [deliveryCountries, setDeliveryCountries] = useState<DeliveryCountry[]>(
    [],
  );
  const [deliveryForm, setDeliveryForm] = useState({
    country_name: "",
    delivery_price_eur: "",
  });
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function loadSettings() {
    setLoading(true);
    setError("");
    get<SettingsResponse>("/settings")
      .then((payload) => {
        setSettings(payload.settings || []);
        setForm(formFromSettings(payload.settings || []));
        setExchangeRate(Number(payload.exchange_rate_eur_to_aoa || 0));
        setNewExchangeRate(String(Number(payload.exchange_rate_eur_to_aoa || 0)));
        setExchangeHistory(payload.exchange_history || []);
        setDeliveryCountries(payload.delivery_countries || []);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    queueMicrotask(loadSettings);
  }, []);

  async function saveSetting(settingKey: string) {
    const setting = settings.find((item) => item.setting_key === settingKey);
    setSavingKey(settingKey);
    setError("");
    try {
      await put("/settings", {
        setting_key: settingKey,
        setting_value: form[settingKey] ?? "",
        description: setting?.description || labels[settingKey] || settingKey,
      });
      setNotice("Parametre enregistre.");
      loadSettings();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingKey("");
    }
  }

  async function saveExchangeRate(event: FormEvent) {
    event.preventDefault();
    setSavingRate(true);
    setError("");
    try {
      await post("/settings/exchange-rate", {
        rate: Number(newExchangeRate),
      });
      setNotice("Taux de change mis a jour.");
      loadSettings();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingRate(false);
    }
  }

  async function saveDeliveryCountry(event: FormEvent) {
    event.preventDefault();
    setSavingDelivery(true);
    setError("");
    try {
      await post("/settings/delivery-countries", {
        country_code: countryCodeFromName(deliveryForm.country_name),
        country_name: deliveryForm.country_name,
        delivery_price_eur: Number(deliveryForm.delivery_price_eur),
        status: "active",
        sort_order: deliveryCountries.length + 1,
      });
      setDeliveryForm({ country_name: "", delivery_price_eur: "" });
      setNotice("Pays de livraison ajoute.");
      loadSettings();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingDelivery(false);
    }
  }

  async function updateDeliveryCountry(country: DeliveryCountry) {
    setSavingDelivery(true);
    setError("");
    try {
      await put(`/settings/delivery-countries/${country.id}`, {
        country_code: country.country_code,
        country_name: country.country_name,
        delivery_price_eur: Number(country.delivery_price_eur),
        status: country.status,
        sort_order: country.sort_order || 0,
      });
      setNotice("Frais de livraison mis a jour.");
      loadSettings();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingDelivery(false);
    }
  }

  async function removeDeliveryCountry(id: number) {
    setSavingDelivery(true);
    setError("");
    try {
      await del(`/settings/delivery-countries/${id}`);
      setNotice("Pays de livraison retire.");
      loadSettings();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingDelivery(false);
    }
  }

  const stats = useMemo(
    () => ({
      count: settings.length,
      languages: form.default_language?.toUpperCase() || "FR",
      currency: `${form.default_currency || "EUR"} / ${form.display_currency || "AOA"}`,
      lateFee: Number(form.rental_late_fee_per_day_eur || 0),
    }),
    [form, settings.length],
  );

  const generalSettings = groupKeys.general.filter((key) =>
    settings.some((setting) => setting.setting_key === key),
  );
  const businessSettings = groupKeys.business.filter((key) =>
    settings.some((setting) => setting.setting_key === key),
  );
  const otherSettings = settings
    .map((setting) => setting.setting_key)
    .filter(
      (key) =>
        !groupKeys.general.includes(key) && !groupKeys.business.includes(key),
    );

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-settings-page">
        <section className="admin-hero">
          <div>
            <p>Parametres</p>
            <h2>Configuration admin</h2>
            <span>
              Controlez les informations globales, les devises, les langues et
              les regles commerciales de la plateforme.
            </span>
          </div>
          <button onClick={() => go("home")} type="button">
            Voir le site
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Parametres</span>
            <strong>{loading ? "..." : stats.count}</strong>
          </article>
          <article>
            <span>Langue</span>
            <strong>{stats.languages}</strong>
          </article>
          <article>
            <span>Devises</span>
            <strong>{stats.currency}</strong>
          </article>
          <article>
            <span>Retard location</span>
            <strong>{stats.lateFee.toFixed(2)} EUR</strong>
          </article>
        </section>

        {notice ? <div className="admin-success">{notice}</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}

        <section className="admin-settings-grid">
          <SettingsGroup
            form={form}
            keys={generalSettings}
            onChange={setForm}
            onSave={saveSetting}
            savingKey={savingKey}
            title="Configuration generale"
          />
          <SettingsGroup
            form={form}
            keys={businessSettings}
            onChange={setForm}
            onSave={saveSetting}
            savingKey={savingKey}
            title="Regles metier"
          />
        </section>

        <section className="admin-settings-grid">
          <form className="admin-data-card" onSubmit={saveExchangeRate}>
            <div className="admin-section-heading">
              <div>
                <p>Change</p>
                <h3>Taux EUR vers {form.display_currency || "AOA"}</h3>
              </div>
              <strong>{eurToAoa(exchangeRate)}</strong>
            </div>
            <div className="admin-form-grid">
              <label>
                Nouveau taux
                <input
                  min="1"
                  onChange={(event) => setNewExchangeRate(event.target.value)}
                  step="0.000001"
                  type="number"
                  value={newExchangeRate}
                />
              </label>
            </div>
            <div className="admin-form-actions">
              <button disabled={savingRate} type="submit">
                {savingRate ? "Enregistrement..." : "Mettre a jour le taux"}
              </button>
            </div>
          </form>

          <section className="admin-data-card">
            <div className="admin-section-heading">
              <div>
                <p>Historique</p>
                <h3>Derniers taux</h3>
              </div>
              <strong>{exchangeHistory.length}</strong>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-management-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Taux</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeHistory.slice(0, 10).map((rate, index) => (
                    <tr key={rate.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{eurToAoa(rate.rate)}</strong>
                        <small>
                          {rate.base_currency} vers {rate.quote_currency}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`admin-status-pill ${
                            rate.is_current ? "active" : "inactive"
                          }`}
                        >
                          {rate.is_current ? "Courant" : "Ancien"}
                        </span>
                      </td>
                      <td>{dateTime(rate.created_at)}</td>
                    </tr>
                  ))}
                  {!exchangeHistory.length ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="admin-empty-state">
                          <strong>Aucun historique</strong>
                          <p>Les changements de taux apparaitront ici.</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Livraison</p>
              <h3>Frais de livraison par pays</h3>
            </div>
            <strong>{deliveryCountries.length}</strong>
          </div>
          <form className="admin-form-grid" onSubmit={saveDeliveryCountry}>
            <label>
              Pays
              <input
                onChange={(event) =>
                  setDeliveryForm({
                    ...deliveryForm,
                    country_name: event.target.value,
                  })
                }
                placeholder="Ex: Angola"
                value={deliveryForm.country_name}
              />
            </label>
            <label>
              Prix
              <input
                min="0"
                onChange={(event) =>
                  setDeliveryForm({
                    ...deliveryForm,
                    delivery_price_eur: event.target.value,
                  })
                }
                placeholder="Ex: 5"
                step="0.01"
                type="number"
                value={deliveryForm.delivery_price_eur}
              />
            </label>
            <div className="admin-form-actions">
              <button disabled={savingDelivery} type="submit">
                {savingDelivery ? "..." : "Ajouter"}
              </button>
            </div>
          </form>
          <div className="admin-table-scroll">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>Pays</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryCountries.map((country) => (
                  <tr key={country.id}>
                    <td>
                      <input
                        onChange={(event) =>
                          setDeliveryCountries((current) =>
                            current.map((item) =>
                              item.id === country.id
                                ? {
                                    ...item,
                                    country_name: event.target.value,
                                    country_code: countryCodeFromName(
                                      event.target.value,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        value={country.country_name}
                      />
                      <small>{country.country_code}</small>
                    </td>
                    <td>
                      <input
                        min="0"
                        onChange={(event) =>
                          setDeliveryCountries((current) =>
                            current.map((item) =>
                              item.id === country.id
                                ? {
                                    ...item,
                                    delivery_price_eur: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                        step="0.01"
                        type="number"
                        value={country.delivery_price_eur}
                      />
                    </td>
                    <td>
                      <select
                        onChange={(event) =>
                          setDeliveryCountries((current) =>
                            current.map((item) =>
                              item.id === country.id
                                ? {
                                    ...item,
                                    status: event.target.value as
                                      | "active"
                                      | "inactive",
                                  }
                                : item,
                            ),
                          )
                        }
                        value={country.status}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </td>
                    <td>
                      <button
                        disabled={savingDelivery}
                        onClick={() => updateDeliveryCountry(country)}
                        type="button"
                      >
                        Enregistrer
                      </button>
                      <button
                        disabled={savingDelivery}
                        onClick={() => removeDeliveryCountry(country.id)}
                        type="button"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
                {!deliveryCountries.length ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty-state">
                        <strong>Aucun pays</strong>
                        <p>Ajoutez les pays disponibles a la livraison.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {otherSettings.length ? (
          <SettingsGroup
            form={form}
            keys={otherSettings}
            onChange={setForm}
            onSave={saveSetting}
            savingKey={savingKey}
            title="Autres parametres"
          />
        ) : null}
      </section>
    </AdminLayout>
  );
}

function SettingsGroup({
  form,
  keys,
  onChange,
  onSave,
  savingKey,
  title,
}: {
  form: SettingForm;
  keys: string[];
  onChange: (form: SettingForm) => void;
  onSave: (key: string) => void;
  savingKey: string;
  title: string;
}) {
  return (
    <section className="admin-data-card">
      <div className="admin-section-heading">
        <div>
          <p>Configuration</p>
          <h3>{title}</h3>
        </div>
        <strong>{keys.length}</strong>
      </div>
      <div className="admin-settings-list">
        {keys.map((key) => (
          <article key={key}>
            <label>
              <span>{labels[key] || key}</span>
              {key === "gift_card_expiration_enabled" ? (
                <select
                  onChange={(event) =>
                    onChange({ ...form, [key]: event.target.value })
                  }
                  value={form[key] || "false"}
                >
                  <option value="false">Non</option>
                  <option value="true">Oui</option>
                </select>
              ) : key === "default_language" ? (
                <select
                  onChange={(event) =>
                    onChange({ ...form, [key]: event.target.value })
                  }
                  value={form[key] || "pt"}
                >
                  <option value="fr">FR - Francais</option>
                  <option value="en">EN - English</option>
                  <option value="pt">PT - Portugues</option>
                </select>
              ) : (
                <input
                  onChange={(event) =>
                    onChange({ ...form, [key]: event.target.value })
                  }
                  type={key.includes("fee") ? "number" : "text"}
                  value={form[key] || ""}
                />
              )}
            </label>
            <button
              disabled={savingKey === key}
              onClick={() => onSave(key)}
              type="button"
            >
              {savingKey === key ? "..." : "Enregistrer"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
