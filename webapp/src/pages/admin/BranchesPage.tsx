import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, post, put } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type BranchRow = {
  id: number;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  province: string | null;
  postal_code: string | null;
  country_code: string;
  latitude: string | null;
  longitude: string | null;
  opening_hours: string | null;
  status: "active" | "inactive";
  created_at: string;
  orders_count: number;
  revenue_eur: number;
  ready_pickups_count: number;
  completed_pickups_count: number;
  resales_count: number;
  cashiers_count: number;
  last_order_at: string | null;
};

type BranchForm = {
  name: string;
  code: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  latitude: string;
  longitude: string;
  opening_hours: string;
  status: "active" | "inactive";
};

const emptyForm: BranchForm = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "AO",
  latitude: "",
  longitude: "",
  opening_hours: "",
  status: "active",
};

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formFromBranch(branch: BranchRow): BranchForm {
  return {
    name: branch.name || "",
    code: branch.code || "",
    phone: branch.phone || "",
    email: branch.email || "",
    address_line_1: branch.address_line_1 || "",
    address_line_2: branch.address_line_2 || "",
    city: branch.city || "",
    province: branch.province || "",
    postal_code: branch.postal_code || "",
    country_code: branch.country_code || "AO",
    latitude: branch.latitude || "",
    longitude: branch.longitude || "",
    opening_hours: branch.opening_hours || "",
    status: branch.status || "active",
  };
}

function payloadFromForm(form: BranchForm) {
  return {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    phone: form.phone.trim() || null,
    email: form.email.trim().toLowerCase() || null,
    address_line_1: form.address_line_1.trim(),
    address_line_2: form.address_line_2.trim() || null,
    city: form.city.trim(),
    province: form.province.trim() || null,
    postal_code: form.postal_code.trim() || null,
    country_code: form.country_code.trim().toUpperCase() || "AO",
    latitude: form.latitude.trim() || null,
    longitude: form.longitude.trim() || null,
    opening_hours: form.opening_hours.trim() || null,
    status: form.status,
  };
}

export default function BranchesPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editorOpen, setEditorOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedBranch, setSelectedBranch] = useState<BranchRow | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBranches = useCallback(() => {
    setLoading(true);
    setError("");
    get<BranchRow[]>("/branches?admin=1")
      .then((rows) => setBranches(rows || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadBranches);
  }, [loadBranches]);

  function openCreate() {
    setMode("create");
    setSelectedBranch(null);
    setForm(emptyForm);
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  function openEdit(branch: BranchRow) {
    setMode("edit");
    setSelectedBranch(branch);
    setForm(formFromBranch(branch));
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  async function saveBranch(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        await post("/branches", payloadFromForm(form));
        setNotice("Guichet cree.");
      } else if (selectedBranch) {
        await put(`/branches/${selectedBranch.id}`, payloadFromForm(form));
        setNotice("Guichet mis a jour.");
      }
      setEditorOpen(false);
      loadBranches();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(branch: BranchRow) {
    setError("");
    try {
      if (branch.status === "active") {
        await del(`/branches/${branch.id}`);
        setNotice("Guichet desactive.");
      } else {
        await put(`/branches/${branch.id}`, { status: "active" });
        setNotice("Guichet reactive.");
      }
      loadBranches();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const cities = useMemo(
    () =>
      Array.from(new Set(branches.map((branch) => branch.city).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [branches],
  );

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return branches.filter((branch) => {
      const values = [
        branch.name,
        branch.code,
        branch.city,
        branch.province || "",
        branch.email || "",
        branch.phone || "",
      ];
      const matchesSearch =
        !term || values.some((value) => value.toLowerCase().includes(term));
      const matchesStatus = status === "all" || branch.status === status;
      const matchesCity = city === "all" || branch.city === city;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [branches, city, search, status]);

  const stats = useMemo(
    () => ({
      total: branches.length,
      active: branches.filter((branch) => branch.status === "active").length,
      cashiers: branches.reduce(
        (sum, branch) => sum + Number(branch.cashiers_count || 0),
        0,
      ),
      revenue: branches.reduce(
        (sum, branch) => sum + Number(branch.revenue_eur || 0),
        0,
      ),
    }),
    [branches],
  );

  const totalPages = Math.max(1, Math.ceil(filteredBranches.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedBranches = filteredBranches.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-branches-page">
        <section className="admin-hero">
          <div>
            <p>Guichets</p>
            <h2>Gestion des guichets</h2>
            <span>
              Pilotez les agences, employes guichet, retraits, revenus et
              informations de contact.
            </span>
          </div>
          <button onClick={openCreate} type="button">
            Nouveau guichet
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Guichets</span>
            <strong>{loading ? "..." : stats.total}</strong>
          </article>
          <article>
            <span>Actifs</span>
            <strong>{stats.active}</strong>
          </article>
          <article>
            <span>Employes guichet</span>
            <strong>{stats.cashiers}</strong>
          </article>
          <article>
            <span>Revenu rattache</span>
            <strong>{eur(stats.revenue)}</strong>
          </article>
        </section>

        <section className="admin-product-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Nom, code, ville, contact..."
              type="search"
              value={search}
            />
          </label>
          <label>
            Statut
            <select
              onChange={(event) => {
                setStatus(event.target.value);
                setTablePage(1);
              }}
              value={status}
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </label>
          <label>
            Ville
            <select
              onChange={(event) => {
                setCity(event.target.value);
                setTablePage(1);
              }}
              value={city}
            >
              <option value="all">Toutes</option>
              {cities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </label>
        </section>

        {notice ? <div className="admin-success">{notice}</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Agences</p>
              <h3>Guichets AK Fashion Plus</h3>
            </div>
            <strong>{filteredBranches.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guichet</th>
                  <th>Contact</th>
                  <th>Adresse</th>
                  <th>Performance</th>
                  <th>Equipe</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBranches.map((branch, index) => (
                  <tr key={branch.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <strong>{branch.name}</strong>
                      <small>{branch.code}</small>
                    </td>
                    <td>
                      <strong>{branch.phone || "-"}</strong>
                      <small>{branch.email || "-"}</small>
                    </td>
                    <td>
                      <strong>{branch.city}</strong>
                      <small>
                        {branch.address_line_1}
                        {branch.province ? `, ${branch.province}` : ""}
                      </small>
                    </td>
                    <td>
                      <strong>{eur(branch.revenue_eur)}</strong>
                      <small>
                        {Number(branch.orders_count || 0)} commande(s) -{" "}
                        {Number(branch.ready_pickups_count || 0)} retrait(s)
                        pret(s)
                      </small>
                      <small>Derniere: {dateTime(branch.last_order_at)}</small>
                    </td>
                    <td>
                      <strong>{Number(branch.cashiers_count || 0)}</strong>
                      <small>
                        {Number(branch.completed_pickups_count || 0)} operation(s)
                        terminee(s)
                      </small>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${branch.status}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => openEdit(branch)} type="button">
                          Modifier
                        </button>
                        <button onClick={() => changeStatus(branch)} type="button">
                          {branch.status === "active" ? "Desactiver" : "Reactiver"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!paginatedBranches.length ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="admin-empty-state">
                        <strong>Aucun guichet trouve</strong>
                        <p>Les guichets crees apparaitront ici.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span>
              Page <strong>{safePage}</strong> / {totalPages}
            </span>
            <select
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setTablePage(1);
              }}
              value={pageSize}
            >
              <option value={10}>10 lignes</option>
              <option value={20}>20 lignes</option>
            </select>
            <button
              disabled={safePage <= 1}
              onClick={() => setTablePage((current) => current - 1)}
              type="button"
            >
              Precedent
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setTablePage((current) => current + 1)}
              type="button"
            >
              Suivant
            </button>
          </div>
        </section>

        {editorOpen ? (
          <div className="admin-modal-backdrop" role="presentation">
            <form className="admin-editor-modal" onSubmit={saveBranch}>
              <div className="admin-editor-modal-header">
                <div>
                  <p>Guichet</p>
                  <h3>
                    {mode === "create" ? "Nouveau guichet" : "Modifier le guichet"}
                  </h3>
                </div>
                <button onClick={() => setEditorOpen(false)} type="button">
                  Fermer
                </button>
              </div>
              <div className="admin-form-grid">
                <label>
                  Nom
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                    value={form.name}
                  />
                </label>
                <label>
                  Code
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value }))
                    }
                    required
                    value={form.code}
                  />
                </label>
                <label>
                  Telephone
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    value={form.phone}
                  />
                </label>
                <label>
                  Email
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    type="email"
                    value={form.email}
                  />
                </label>
                <label>
                  Adresse
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address_line_1: event.target.value,
                      }))
                    }
                    required
                    value={form.address_line_1}
                  />
                </label>
                <label>
                  Complement
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address_line_2: event.target.value,
                      }))
                    }
                    value={form.address_line_2}
                  />
                </label>
                <label>
                  Ville
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                    required
                    value={form.city}
                  />
                </label>
                <label>
                  Province
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        province: event.target.value,
                      }))
                    }
                    value={form.province}
                  />
                </label>
                <label>
                  Code postal
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        postal_code: event.target.value,
                      }))
                    }
                    value={form.postal_code}
                  />
                </label>
                <label>
                  Pays
                  <input
                    maxLength={2}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        country_code: event.target.value,
                      }))
                    }
                    value={form.country_code}
                  />
                </label>
                <label>
                  Latitude
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        latitude: event.target.value,
                      }))
                    }
                    value={form.latitude}
                  />
                </label>
                <label>
                  Longitude
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        longitude: event.target.value,
                      }))
                    }
                    value={form.longitude}
                  />
                </label>
                <label>
                  Statut
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as BranchForm["status"],
                      }))
                    }
                    value={form.status}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </label>
              </div>
              <label className="admin-category-form">
                Horaires
                <textarea
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      opening_hours: event.target.value,
                    }))
                  }
                  rows={4}
                  value={form.opening_hours}
                />
              </label>
              <div className="admin-form-actions">
                <button disabled={saving} type="submit">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button onClick={() => setEditorOpen(false)} type="button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
