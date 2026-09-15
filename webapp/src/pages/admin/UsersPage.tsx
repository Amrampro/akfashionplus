import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, post, put } from "../../services/api";

type AdminUsersPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type UserRole = "user" | "cashier" | "admin";
type UserStatus = "active" | "inactive" | "blocked" | "pending";

type Branch = {
  id: number;
  name: string;
  city: string;
  status: string;
};

type UserRow = {
  id: number;
  role: UserRole;
  branch_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_language: "fr" | "en" | "pt";
  country_code: string | null;
  avatar_url: string | null;
  status: UserStatus;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  branch_name: string | null;
  branch_city: string | null;
  order_count: number;
  rental_count: number;
  gift_card_count: number;
  total_spent_eur: number;
  last_order_at: string | null;
};

type UserForm = {
  role: UserRole;
  branch_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  preferred_language: "fr" | "en" | "pt";
  country_code: string;
  avatar_url: string;
  status: UserStatus;
};

const emptyForm: UserForm = {
  role: "user",
  branch_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  preferred_language: "fr",
  country_code: "",
  avatar_url: "",
  status: "active",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrateur",
  cashier: "Employe guichet",
  user: "Utilisateur",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  blocked: "Bloque",
  pending: "En attente",
};

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function initials(user: Pick<UserRow, "first_name" | "last_name" | "email">) {
  const base = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;
  return (base || user.email.slice(0, 2)).toUpperCase();
}

function formFromUser(user: UserRow): UserForm {
  return {
    role: user.role,
    branch_id: user.branch_id ? String(user.branch_id) : "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    password: "",
    preferred_language: user.preferred_language || "fr",
    country_code: user.country_code || "",
    avatar_url: user.avatar_url || "",
    status: user.status,
  };
}

function userPayload(form: UserForm, mode: "create" | "edit") {
  return {
    role: form.role,
    branch_id: form.branch_id ? Number(form.branch_id) : null,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    ...(mode === "create" ? { email: form.email.trim().toLowerCase() } : {}),
    ...(mode === "create" ? { password: form.password } : {}),
    phone: form.phone.trim() || null,
    preferred_language: form.preferred_language,
    country_code: form.country_code.trim() || null,
    avatar_url: form.avatar_url.trim() || null,
    status: form.status,
  };
}

export default function UsersPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminUsersPageProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editorOpen, setEditorOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadUsers();
    get<Branch[]>("/branches?admin=1")
      .then((rows) => setBranches(rows || []))
      .catch(() => setBranches([]));
  }, []);

  function loadUsers() {
    setLoading(true);
    setError("");
    get<UserRow[]>("/users?limit=100")
      .then((rows) => setUsers(rows || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const matchesSearch =
          !term ||
          [fullName, user.email, user.phone || "", user.branch_name || ""].some(
            (value) => value.toLowerCase().includes(term),
          );
        const matchesRole = role === "all" || user.role === role;
        const matchesStatus = status === "all" || user.status === status;
        const matchesBranch =
          branchId === "all" ||
          (branchId === "none" && !user.branch_id) ||
          String(user.branch_id) === branchId;

        return matchesSearch && matchesRole && matchesStatus && matchesBranch;
      })
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [branchId, role, search, status, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => ({
      users: users.filter((user) => user.role === "user").length,
      cashiers: users.filter((user) => user.role === "cashier").length,
      admins: users.filter((user) => user.role === "admin").length,
      blocked: users.filter((user) => user.status === "blocked").length,
      spent: users.reduce(
        (total, user) => total + Number(user.total_spent_eur || 0),
        0,
      ),
    }),
    [users],
  );

  function openCreateModal() {
    setMode("create");
    setSelectedUser(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function openEditModal(user: UserRow) {
    setMode("edit");
    setSelectedUser(user);
    setForm(formFromUser(user));
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function closeModal() {
    setEditorOpen(false);
    setSelectedUser(null);
    setForm(emptyForm);
  }

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const request =
      mode === "edit" && selectedUser
        ? put(`/users/${selectedUser.id}`, userPayload(form, mode))
        : post("/users", userPayload(form, mode));

    request
      .then(() => {
        setNotice(
          mode === "edit"
            ? "Utilisateur mis a jour."
            : "Utilisateur cree avec succes.",
        );
        closeModal();
        loadUsers();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function updateStatus(user: UserRow, nextStatus: UserStatus) {
    setSaving(true);
    setError("");
    setNotice("");
    put(`/users/${user.id}/status`, { status: nextStatus })
      .then(() => {
        setNotice(`Statut de ${user.first_name} mis a jour.`);
        loadUsers();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function branchName(user: UserRow) {
    if (!user.branch_id) return "-";
    return [user.branch_name, user.branch_city].filter(Boolean).join(" - ");
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-users-page">
        <section className="admin-hero">
          <div>
            <p>Utilisateurs</p>
            <h2>Gestion des utilisateurs</h2>
            <span>
              Consultez les clients, employes guichet et administrateurs avec
              leurs statuts, activite et rattachement agence.
            </span>
          </div>
          <button onClick={openCreateModal} type="button">
            Nouvel utilisateur
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Utilisateurs</span>
            <strong>{loading ? "..." : stats.users}</strong>
          </article>
          <article>
            <span>Employes guichet</span>
            <strong>{stats.cashiers}</strong>
          </article>
          <article>
            <span>Administrateurs</span>
            <strong>{stats.admins}</strong>
          </article>
          <article>
            <span>Depense totale</span>
            <strong>{eur(stats.spent)}</strong>
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
              placeholder="Nom, email, telephone, guichet..."
              value={search}
            />
          </label>
          <label>
            Role
            <select
              onChange={(event) => {
                setRole(event.target.value);
                setTablePage(1);
              }}
              value={role}
            >
              <option value="all">Tous les roles</option>
              <option value="user">Utilisateurs</option>
              <option value="cashier">Employes guichet</option>
              <option value="admin">Administrateurs</option>
            </select>
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
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="inactive">Inactifs</option>
              <option value="blocked">Bloques</option>
            </select>
          </label>
          <label>
            Guichet
            <select
              onChange={(event) => {
                setBranchId(event.target.value);
                setTablePage(1);
              }}
              value={branchId}
            >
              <option value="all">Tous les guichets</option>
              <option value="none">Sans guichet</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </option>
              ))}
            </select>
          </label>
        </section>

        {notice && <p className="admin-success-message">{notice}</p>}
        {error && <p className="admin-error-message">{error}</p>}

        <section className="admin-data-card">
          <div className="admin-section-heading">
            <div>
              <p>Comptes</p>
              <h3>Utilisateurs</h3>
            </div>
            <strong>{filteredUsers.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Utilisateur</th>
                  <th>Role</th>
                  <th>Guichet</th>
                  <th>Activite</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="admin-user-cell">
                        {user.avatar_url ? (
                          <img
                            alt={`${user.first_name} ${user.last_name}`}
                            src={user.avatar_url}
                          />
                        ) : (
                          <i>{initials(user)}</i>
                        )}
                        <span>
                          <strong>
                            {user.first_name} {user.last_name}
                          </strong>
                          <small>{user.email}</small>
                          <small>{user.phone || "Telephone non renseigne"}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-role-pill ${user.role}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>
                      <strong>{branchName(user)}</strong>
                      <small>
                        {user.role === "cashier"
                          ? "Employe rattache"
                          : "Non requis"}
                      </small>
                    </td>
                    <td>
                      <strong>{Number(user.order_count || 0)} commande(s)</strong>
                      <small>
                        {Number(user.rental_count || 0)} location(s) -{" "}
                        {Number(user.gift_card_count || 0)} carte(s)
                      </small>
                      <span>{eur(user.total_spent_eur)}</span>
                      <small>Derniere: {formatDate(user.last_order_at)}</small>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${user.status}`}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => openEditModal(user)} type="button">
                          Modifier
                        </button>
                        {user.status !== "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(user, "active")}
                            type="button"
                          >
                            Activer
                          </button>
                        )}
                        {user.status === "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(user, "inactive")}
                            type="button"
                          >
                            Desactiver
                          </button>
                        )}
                        {user.status !== "blocked" && (
                          <button
                            className="danger"
                            disabled={saving}
                            onClick={() => updateStatus(user, "blocked")}
                            type="button"
                          >
                            Bloquer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length && (
              <div className="admin-empty-state">
                <strong>Aucun utilisateur trouve</strong>
                <p>Changez les filtres ou ajoutez un nouveau compte.</p>
              </div>
            )}
            {filteredUsers.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={filteredUsers.length}
                totalPages={totalPages}
                onPageChange={setTablePage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setTablePage(1);
                }}
              />
            )}
          </div>
        </section>

        {editorOpen && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Utilisateurs</p>
                  <h3>
                    {mode === "edit"
                      ? "Modifier l'utilisateur"
                      : "Nouvel utilisateur"}
                  </h3>
                </div>
                <button onClick={closeModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="admin-category-form" onSubmit={saveUser}>
                <div className="admin-form-grid">
                  <label>
                    Prenom
                    <input
                      onChange={(event) =>
                        setForm({ ...form, first_name: event.target.value })
                      }
                      required
                      value={form.first_name}
                    />
                  </label>
                  <label>
                    Nom
                    <input
                      onChange={(event) =>
                        setForm({ ...form, last_name: event.target.value })
                      }
                      required
                      value={form.last_name}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      readOnly={mode === "edit"}
                      required
                      type="email"
                      value={form.email}
                    />
                  </label>
                  {mode === "create" && (
                    <label>
                      Mot de passe
                      <input
                        minLength={8}
                        onChange={(event) =>
                          setForm({ ...form, password: event.target.value })
                        }
                        required
                        type="password"
                        value={form.password}
                      />
                    </label>
                  )}
                  <label>
                    Telephone
                    <input
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      value={form.phone}
                    />
                  </label>
                  <label>
                    Role
                    <select
                      onChange={(event) =>
                        setForm({
                          ...form,
                          role: event.target.value as UserRole,
                          branch_id:
                            event.target.value === "cashier"
                              ? form.branch_id
                              : "",
                        })
                      }
                      value={form.role}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="cashier">Employe guichet</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </label>
                  <label>
                    Guichet
                    <select
                      disabled={form.role !== "cashier"}
                      onChange={(event) =>
                        setForm({ ...form, branch_id: event.target.value })
                      }
                      value={form.branch_id}
                    >
                      <option value="">Sans guichet</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} - {branch.city}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Statut
                    <select
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as UserStatus,
                        })
                      }
                      value={form.status}
                    >
                      <option value="active">Actif</option>
                      <option value="pending">En attente</option>
                      <option value="inactive">Inactif</option>
                      <option value="blocked">Bloque</option>
                    </select>
                  </label>
                  <label>
                    Langue
                    <select
                      onChange={(event) =>
                        setForm({
                          ...form,
                          preferred_language: event.target
                            .value as UserForm["preferred_language"],
                        })
                      }
                      value={form.preferred_language}
                    >
                      <option value="fr">FR - Francais</option>
                      <option value="en">EN - English</option>
                      <option value="pt">PT - Portugues</option>
                    </select>
                  </label>
                  <label>
                    Pays
                    <input
                      maxLength={2}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          country_code: event.target.value.toUpperCase(),
                        })
                      }
                      placeholder="AO"
                      value={form.country_code}
                    />
                  </label>
                  <label>
                    Avatar URL
                    <input
                      onChange={(event) =>
                        setForm({ ...form, avatar_url: event.target.value })
                      }
                      placeholder="https://..."
                      type="url"
                      value={form.avatar_url}
                    />
                  </label>
                </div>

                {selectedUser && (
                  <section className="admin-user-modal-summary">
                    <article>
                      <span>Commandes</span>
                      <strong>{Number(selectedUser.order_count || 0)}</strong>
                    </article>
                    <article>
                      <span>Locations</span>
                      <strong>{Number(selectedUser.rental_count || 0)}</strong>
                    </article>
                    <article>
                      <span>Cartes cadeaux</span>
                      <strong>
                        {Number(selectedUser.gift_card_count || 0)}
                      </strong>
                    </article>
                    <article>
                      <span>Total paye</span>
                      <strong>{eur(selectedUser.total_spent_eur)}</strong>
                    </article>
                  </section>
                )}

                <div className="admin-form-actions">
                  <button disabled={saving} type="submit">
                    {saving
                      ? "Enregistrement..."
                      : mode === "edit"
                        ? "Enregistrer"
                        : "Creer l'utilisateur"}
                  </button>
                  <button onClick={closeModal} type="button">
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

function PaginationControls({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  total,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="admin-pagination">
      <span>
        {start}-{end} sur {total}
      </span>
      <select
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        value={pageSize}
      >
        <option value={10}>10 par page</option>
        <option value={20}>20 par page</option>
      </select>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        type="button"
      >
        Precedent
      </button>
      <strong>
        Page {page} / {totalPages}
      </strong>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        type="button"
      >
        Suivant
      </button>
    </div>
  );
}
