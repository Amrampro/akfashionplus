import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, post, postForm, put } from "../../services/api";

type AdminCategoriesPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type Category = {
  id: number;
  parent_id: number | null;
  slug: string;
  name: string;
  name_fr: string;
  name_en: string;
  name_pt: string;
  description_fr: string | null;
  description_en: string | null;
  description_pt: string | null;
  image_url: string | null;
  sort_order: number;
  status: "active" | "inactive";
  product_count: number;
  active_product_count: number;
  child_count: number;
};

type CategoryForm = {
  parent_id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  name_pt: string;
  description_fr: string;
  description_en: string;
  description_pt: string;
  image_url: string;
  sort_order: string;
  status: "active" | "inactive";
};

const emptyForm: CategoryForm = {
  parent_id: "",
  slug: "",
  name_fr: "",
  name_en: "",
  name_pt: "",
  description_fr: "",
  description_en: "",
  description_pt: "",
  image_url: "",
  sort_order: "0",
  status: "active",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function numberValue(value: unknown) {
  return Number(value || 0);
}

export default function CategoriesPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminCategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [parent, setParent] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteWarning, setDeleteWarning] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  function loadCategories() {
    setLoading(true);
    setError("");
    get<Category[]>("/categories?admin=1&lang=fr")
      .then((rows) => setCategories(rows || []))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter((category) => {
        const matchesSearch =
          !term ||
          [
            category.name,
            category.name_fr,
            category.name_en,
            category.name_pt,
            category.slug,
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term));
        const matchesStatus = status === "all" || category.status === status;
        const matchesParent =
          parent === "all" ||
          (parent === "root" && !category.parent_id) ||
          String(category.parent_id) === parent;

        return matchesSearch && matchesStatus && matchesParent;
      })
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [categories, parent, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedCategories = filteredCategories.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const activeCount = categories.filter((item) => item.status === "active").length;
  const inactiveCount = categories.length - activeCount;
  const productsCount = categories.reduce(
    (total, item) => total + numberValue(item.product_count),
    0,
  );
  const rootCount = categories.filter((item) => !item.parent_id).length;
  const protectedCount = categories.filter(
    (item) =>
      numberValue(item.product_count) > 0 || numberValue(item.child_count) > 0,
  ).length;

  function openCreateModal() {
    setEditingCategory(null);
    setImageFile(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setIsEditorOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setImageFile(null);
    setForm({
      parent_id: category.parent_id ? String(category.parent_id) : "",
      slug: category.slug,
      name_fr: category.name_fr || "",
      name_en: category.name_en || "",
      name_pt: category.name_pt || "",
      description_fr: category.description_fr || "",
      description_en: category.description_en || "",
      description_pt: category.description_pt || "",
      image_url: category.image_url || "",
      sort_order: String(category.sort_order || 0),
      status: category.status,
    });
    setError("");
    setNotice("");
    setIsEditorOpen(true);
  }

  function closeModal() {
    setIsEditorOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setImageFile(null);
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      slug: form.slug || slugify(form.name_fr),
      name_fr: form.name_fr,
      name_en: form.name_en || form.name_fr,
      name_pt: form.name_pt || form.name_fr,
      description_fr: form.description_fr || null,
      description_en: form.description_en || null,
      description_pt: form.description_pt || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order || 0),
      status: form.status,
    };

    const request = editingCategory
      ? put(`/categories/${editingCategory.id}`, body).then(() => ({
          id: editingCategory.id,
        }))
      : post<{ id: number }>("/categories", body);

    request
      .then(async (result) => {
        if (imageFile) {
          const uploadBody = new FormData();
          uploadBody.append("category", imageFile);
          await postForm(`/categories/${result.id}/image`, uploadBody);
        }
        setNotice(
          editingCategory
            ? "Categorie mise a jour."
            : "Categorie creee avec succes.",
        );
        closeModal();
        loadCategories();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function toggleStatus(category: Category) {
    const nextStatus = category.status === "active" ? "inactive" : "active";
    setSaving(true);
    setError("");
    put(`/categories/${category.id}`, { status: nextStatus })
      .then(() => {
        setNotice(
          nextStatus === "active"
            ? "Categorie reactivee."
            : "Categorie desactivee.",
        );
        loadCategories();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function removeCategory(category: Category) {
    setSaving(true);
    setError("");
    setDeleteWarning("");
    del(`/categories/${category.id}`)
      .then(() => {
        setNotice("Categorie supprimee.");
        loadCategories();
      })
      .catch((requestError: Error) => setDeleteWarning(requestError.message))
      .finally(() => setSaving(false));
  }

  function parentName(category: Category) {
    if (!category.parent_id) return "Categorie principale";
    return (
      categories.find((item) => item.id === category.parent_id)?.name ||
      "Parent inconnu"
    );
  }

  function updateFrenchName(name: string) {
    setForm({
      ...form,
      name_fr: name,
      slug: slugify(name),
    });
  }

  const currentImagePreview = form.image_url || "";

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-categories-page">
        <section className="admin-hero">
          <div>
            <p>Catalogue</p>
            <h2>Gestion des categories</h2>
            <span>
              Organisez les rayons, traductions, images, ordre d'affichage et
              disponibilite publique.
            </span>
          </div>
          <button onClick={openCreateModal} type="button">
            Nouvelle categorie
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Categories</span>
            <strong>{loading ? "..." : categories.length}</strong>
          </article>
          <article>
            <span>Actives</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Inactives</span>
            <strong>{inactiveCount}</strong>
          </article>
          <article>
            <span>Produits rattaches</span>
            <strong>{productsCount}</strong>
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
              placeholder="Nom, slug, traduction..."
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
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </label>
          <label>
            Niveau
            <select
              onChange={(event) => {
                setParent(event.target.value);
                setTablePage(1);
              }}
              value={parent}
            >
              <option value="all">Toutes</option>
              <option value="root">Categories principales</option>
              {categories
                .filter((category) => !category.parent_id)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    Sous-categories de {category.name}
                  </option>
                ))}
            </select>
          </label>
        </section>

        {notice && <p className="admin-success-message">{notice}</p>}
        {error && <p className="admin-error-message">{error}</p>}

        <section className="admin-data-card admin-category-table-card">
          <div className="admin-section-heading">
            <div>
              <p>Rayons</p>
              <h3>Categories</h3>
            </div>
            <strong>{filteredCategories.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-category-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Categorie</th>
                  <th>Parent</th>
                  <th>Produits</th>
                  <th>Tri</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      {category.image_url ? (
                        <img
                          alt={category.name}
                          className="admin-category-thumb"
                          src={category.image_url}
                        />
                      ) : (
                        <span className="admin-category-placeholder">
                          {category.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{category.name_fr}</strong>
                      <small>{category.slug}</small>
                      <span>
                        EN: {category.name_en} / PT: {category.name_pt}
                      </span>
                    </td>
                    <td>{parentName(category)}</td>
                    <td>
                      <strong>{numberValue(category.product_count)}</strong>
                      <small>
                        {numberValue(category.active_product_count)} actif(s)
                      </small>
                    </td>
                    <td>{category.sort_order}</td>
                    <td>
                      <span className={`admin-status-pill ${category.status}`}>
                        {category.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => openEditModal(category)}
                          type="button"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => toggleStatus(category)}
                          type="button"
                        >
                          {category.status === "active"
                            ? "Desactiver"
                            : "Reactiver"}
                        </button>
                        <button
                          className="danger"
                          onClick={() => removeCategory(category)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredCategories.length && (
              <div className="admin-empty-state">
                <strong>Aucune categorie trouvee</strong>
                <p>
                  Ajustez les filtres ou creez une nouvelle categorie catalogue.
                </p>
              </div>
            )}
            {filteredCategories.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={filteredCategories.length}
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

        <section className="admin-category-insights">
          <article>
            <span>Structure</span>
            <strong>{rootCount}</strong>
            <p>categories principales</p>
          </article>
          <article>
            <span>Protection suppression</span>
            <strong>{protectedCount}</strong>
            <p>categories liees a des donnees</p>
          </article>
        </section>

        {isEditorOpen && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Catalogue</p>
                  <h3>
                    {editingCategory
                      ? "Modifier la categorie"
                      : "Nouvelle categorie"}
                  </h3>
                </div>
                <button onClick={closeModal} type="button">
                  Fermer
                </button>
              </div>
              <form className="admin-category-form" onSubmit={submitCategory}>
                <div className="admin-form-grid">
                  <label>
                    Nom FR
                    <input
                      onChange={(event) => updateFrenchName(event.target.value)}
                      required
                      value={form.name_fr}
                    />
                  </label>
                  <label>
                    Slug
                    <input
                      readOnly
                      required
                      value={form.slug}
                    />
                  </label>
                  <label>
                    Nom EN
                    <input
                      onChange={(event) =>
                        setForm({ ...form, name_en: event.target.value })
                      }
                      required
                      value={form.name_en}
                    />
                  </label>
                  <label>
                    Nom PT
                    <input
                      onChange={(event) =>
                        setForm({ ...form, name_pt: event.target.value })
                      }
                      required
                      value={form.name_pt}
                    />
                  </label>
                  <label>
                    Parent
                    <select
                      onChange={(event) =>
                        setForm({ ...form, parent_id: event.target.value })
                      }
                      value={form.parent_id}
                    >
                      <option value="">Categorie principale</option>
                      {categories
                        .filter(
                          (category) => category.id !== editingCategory?.id,
                        )
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
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
                          status: event.target.value as CategoryForm["status"],
                        })
                      }
                      value={form.status}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label>
                    Ordre
                    <input
                      onChange={(event) =>
                        setForm({ ...form, sort_order: event.target.value })
                      }
                      type="number"
                      value={form.sort_order}
                    />
                  </label>
                  <label>
                    Image URL
                    <input
                      onChange={(event) =>
                        setForm({ ...form, image_url: event.target.value })
                      }
                      placeholder="https://..."
                      type="url"
                      value={form.image_url}
                    />
                  </label>
                  <label>
                    Image depuis l'appareil
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        setImageFile(event.target.files?.[0] || null)
                      }
                      type="file"
                    />
                  </label>
                </div>
                {currentImagePreview && (
                  <div className="admin-category-image-preview">
                    <img alt={form.name_fr || "Categorie"} src={currentImagePreview} />
                    <div>
                      <strong>Image actuelle</strong>
                      <span>
                        Cette image sera visible dans la liste et pourra etre
                        remplacee par un nouveau fichier ou une nouvelle URL.
                      </span>
                    </div>
                  </div>
                )}
                <label>
                  Description FR
                  <textarea
                    onChange={(event) =>
                      setForm({ ...form, description_fr: event.target.value })
                    }
                    value={form.description_fr}
                  />
                </label>
                <label>
                  Description EN
                  <textarea
                    onChange={(event) =>
                      setForm({ ...form, description_en: event.target.value })
                    }
                    value={form.description_en}
                  />
                </label>
                <label>
                  Description PT
                  <textarea
                    onChange={(event) =>
                      setForm({ ...form, description_pt: event.target.value })
                    }
                    value={form.description_pt}
                  />
                </label>
                <div className="admin-form-actions">
                  <button disabled={saving} type="submit">
                    {editingCategory ? "Enregistrer" : "Creer la categorie"}
                  </button>
                  <button onClick={closeModal} type="button">
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {deleteWarning && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal compact" role="dialog">
              <div className="admin-delete-warning">
                <strong>Suppression refusee</strong>
                <p>{deleteWarning}</p>
                <button onClick={() => setDeleteWarning("")} type="button">
                  Compris
                </button>
              </div>
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
