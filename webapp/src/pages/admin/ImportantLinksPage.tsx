import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, postForm, putForm } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type ImportantLink = {
  id: number;
  title: string;
  slug: string;
  pdf_url: string;
  pdf_filename: string;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type LinkForm = {
  title: string;
  status: "active" | "inactive";
  sort_order: string;
  file: File | null;
};

const emptyForm: LinkForm = {
  title: "",
  status: "active",
  sort_order: "0",
  file: null,
};

function dateTime(value: string) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
}

function formDataFromForm(form: LinkForm) {
  const data = new FormData();
  data.append("title", form.title.trim());
  data.append("status", form.status);
  data.append("sort_order", form.sort_order || "0");
  if (form.file) data.append("important_link_pdf", form.file);
  return data;
}

export default function ImportantLinksPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<LinkForm>(emptyForm);
  const [selected, setSelected] = useState<ImportantLink | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLinks = useCallback(() => {
    setLoading(true);
    setError("");
    const timeout = window.setTimeout(() => {
      setLoading(false);
      setError(
        "Chargement trop long. Verifiez que l'API est relancee et que la migration SQL est appliquee.",
      );
    }, 10000);
    get<ImportantLink[]>("/important-links/admin")
      .then((rows) => {
        window.clearTimeout(timeout);
        setLinks(rows || []);
      })
      .catch((requestError: Error) => {
        window.clearTimeout(timeout);
        setLinks([]);
        setError(requestError.message);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    queueMicrotask(loadLinks);
  }, [loadLinks]);

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return links.filter((link) => {
      const matchesSearch =
        !term ||
        [link.title, link.slug, link.pdf_filename].some((value) =>
          String(value || "").toLowerCase().includes(term),
        );
      const matchesStatus = status === "all" || link.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [links, search, status]);

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  function openEdit(link: ImportantLink) {
    setSelected(link);
    setForm({
      title: link.title,
      status: link.status,
      sort_order: String(link.sort_order || 0),
      file: null,
    });
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  async function saveLink(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.title.trim()) throw new Error("Le nom du lien est obligatoire.");
      if (!selected && !form.file) throw new Error("Le fichier PDF est obligatoire.");
      if (form.file && form.file.type !== "application/pdf") {
        throw new Error("Seuls les fichiers PDF sont acceptes.");
      }

      if (selected) {
        await putForm(`/important-links/${selected.id}`, formDataFromForm(form));
        setNotice("Lien important mis a jour.");
      } else {
        await postForm("/important-links", formDataFromForm(form));
        setNotice("Lien important cree.");
      }
      setEditorOpen(false);
      loadLinks();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeLink(link: ImportantLink) {
    if (!window.confirm(`Supprimer "${link.title}" ?`)) return;
    setError("");
    try {
      await del(`/important-links/${link.id}`);
      setNotice("Lien important supprime.");
      loadLinks();
    } catch (requestError) {
      setError((requestError as Error).message);
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
      <section className="admin-page important-links-admin">
        <div className="admin-hero">
          <div>
            <p className="eyebrow">Footer</p>
            <h1>Liens importants</h1>
            <p>
              Ajoutez les documents PDF qui doivent apparaitre dans le footer du
              site public.
            </p>
          </div>
          <button onClick={openCreate} type="button">
            Ajouter un lien
          </button>
        </div>

        <div className="admin-filters">
          <label>
            Recherche
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, slug, fichier..."
              value={search}
            />
          </label>
          <label>
            Statut
            <select
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </label>
        </div>

        {notice && <div className="admin-alert success">{notice}</div>}
        {error && <div className="admin-alert error">{error}</div>}

        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Liste</p>
              <h2>Documents publics</h2>
            </div>
            <div className="important-links-panel-actions">
              <strong>{loading ? "..." : filteredLinks.length}</strong>
              <button onClick={loadLinks} type="button">
                Actualiser
              </button>
            </div>
          </div>
          {loading ? (
            <div className="important-links-state">
              <strong>Chargement des liens...</strong>
              <span>Recuperation des documents PDF configures pour le footer.</span>
            </div>
          ) : error ? (
            <div className="important-links-state error">
              <strong>Impossible de charger les liens.</strong>
              <span>{error}</span>
              <button onClick={loadLinks} type="button">
                Reessayer
              </button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="important-links-state empty">
              <strong>Aucun lien important trouve.</strong>
              <span>
                Ajoutez un premier PDF pour faire apparaitre la rubrique dans le
                footer du site public.
              </span>
              <button onClick={openCreate} type="button">
                Ajouter un lien
              </button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>PDF</th>
                    <th>Ordre</th>
                    <th>Statut</th>
                    <th>Mise a jour</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <strong>{link.title}</strong>
                        <small>{link.slug}</small>
                      </td>
                      <td>
                        <a href={link.pdf_url} rel="noreferrer" target="_blank">
                          Ouvrir le PDF
                        </a>
                      </td>
                      <td>{link.sort_order}</td>
                      <td>
                        <span className={`admin-status-pill ${link.status}`}>
                          {link.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>{dateTime(link.updated_at || link.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => openEdit(link)} type="button">
                            Modifier
                          </button>
                          <button
                            className="danger"
                            onClick={() => void removeLink(link)}
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
            </div>
          )}
        </section>

        {editorOpen && (
          <div className="admin-modal-backdrop">
            <form
              className="admin-editor-modal compact important-link-form"
              onSubmit={saveLink}
            >
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Document PDF</p>
                  <h2>{selected ? "Modifier le lien" : "Nouveau lien"}</h2>
                </div>
                <button onClick={() => setEditorOpen(false)} type="button">
                  Fermer
                </button>
              </div>
              <label>
                Nom affiche dans le footer
                <input
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  value={form.title}
                />
              </label>
              <label>
                Fichier PDF
                <input
                  accept="application/pdf"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      file: event.target.files?.[0] || null,
                    }))
                  }
                  required={!selected}
                  type="file"
                />
                {selected ? <small>Laissez vide pour garder le PDF actuel.</small> : null}
              </label>
              <div className="form-grid">
                <label>
                  Ordre
                  <input
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sort_order: event.target.value,
                      }))
                    }
                    type="number"
                    value={form.sort_order}
                  />
                </label>
                <label>
                  Statut
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as LinkForm["status"],
                      }))
                    }
                    value={form.status}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </label>
              </div>
              <button disabled={saving} type="submit">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
