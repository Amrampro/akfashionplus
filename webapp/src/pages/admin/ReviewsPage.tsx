import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { get, put } from "../../services/api";

type AdminPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type ReviewRow = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: number | boolean;
  status: "pending" | "published" | "rejected" | "hidden";
  admin_reply: string | null;
  created_at: string;
  product_sku: string;
  product_name: string;
  image_url: string | null;
  customer_name: string;
  customer_email: string;
  order_number: string | null;
};

const statuses = [
  ["all", "Tous les statuts"],
  ["pending", "En attente"],
  ["published", "Publies"],
  ["rejected", "Rejetes"],
  ["hidden", "Masques"],
];

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function verified(value: unknown) {
  return value === true || value === 1;
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    hidden: "Masque",
    pending: "En attente",
    published: "Publie",
    rejected: "Rejete",
  };
  return labels[value] || value;
}

function stars(value: number) {
  return `${"*".repeat(value)}${"-".repeat(Math.max(0, 5 - value))}`;
}

export default function ReviewsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminPageProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewRow | null>(null);
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] =
    useState<ReviewRow["status"]>("published");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReviews = useCallback(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    if (rating !== "all") params.set("rating", rating);

    get<ReviewRow[]>(`/reviews/admin?${params.toString()}`)
      .then((rows) => {
        if (active) setReviews(rows || []);
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
  }, [rating, search, status]);

  useEffect(() => loadReviews(), [loadReviews]);

  const totals = useMemo(
    () => ({
      count: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      published: reviews.filter((review) => review.status === "published")
        .length,
      rejected: reviews.filter((review) =>
        ["rejected", "hidden"].includes(review.status),
      ).length,
      average:
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        Math.max(reviews.length, 1),
    }),
    [reviews],
  );

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((score) => ({
        score,
        total: reviews.filter((review) => Number(review.rating) === score)
          .length,
      })),
    [reviews],
  );

  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedReviews = reviews.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function openReview(review: ReviewRow) {
    setSelectedReview(review);
    setReply(review.admin_reply || "");
    setNextStatus(review.status === "pending" ? "published" : review.status);
    setError("");
    setNotice("");
  }

  function moderate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedReview) return;
    setSaving(true);
    setError("");
    put(`/reviews/${selectedReview.id}/moderate`, {
      status: nextStatus,
      admin_reply: reply || null,
    })
      .then(() => {
        setNotice("Avis mis a jour.");
        setSelectedReview(null);
        loadReviews();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-reviews-page">
        <section className="admin-hero">
          <div>
            <p>Avis</p>
            <h2>Avis clients</h2>
            <span>
              Moderez les avis produits, publiez les retours valides, masquez
              les contenus non conformes et repondez aux clients.
            </span>
          </div>
          <button onClick={() => go("shop")} type="button">
            Voir le site
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Avis</span>
            <strong>{loading ? "..." : totals.count}</strong>
          </article>
          <article>
            <span>Publies</span>
            <strong>{totals.published}</strong>
          </article>
          <article>
            <span>En attente</span>
            <strong>{totals.pending}</strong>
          </article>
          <article>
            <span>Note moyenne</span>
            <strong>{totals.average.toFixed(1)} / 5</strong>
          </article>
        </section>

        <section className="admin-reviews-layout">
          <section className="admin-data-card">
            <div className="admin-section-heading">
              <div>
                <p>Classement</p>
                <h3>Repartition des notes</h3>
              </div>
            </div>
            <div className="admin-rating-bars">
              {distribution.map((item) => (
                <div key={item.score}>
                  <span>{item.score}</span>
                  <strong>{item.total}</strong>
                  <i
                    style={{
                      width: `${
                        totals.count ? (item.total / totals.count) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-data-card">
            <div className="admin-section-heading">
              <div>
                <p>Synthese</p>
                <h3>Moderation</h3>
              </div>
            </div>
            <div className="admin-giftcard-summary-list">
              <div>
                <span>Avis rejetes/masques</span>
                <strong>{totals.rejected}</strong>
              </div>
              <div>
                <span>Achats verifies</span>
                <strong>
                  {
                    reviews.filter((review) =>
                      verified(review.verified_purchase),
                    ).length
                  }
                </strong>
              </div>
              <div>
                <span>Reponses admin</span>
                <strong>
                  {reviews.filter((review) => review.admin_reply).length}
                </strong>
              </div>
            </div>
          </section>
        </section>

        <section className="admin-product-filters">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setTablePage(1);
              }}
              placeholder="Produit, client, titre, commentaire..."
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
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Note
            <select
              onChange={(event) => {
                setRating(event.target.value);
                setTablePage(1);
              }}
              value={rating}
            >
              <option value="all">Toutes les notes</option>
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score} etoile(s)
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
              <p>Donnees</p>
              <h3>Avis recents</h3>
            </div>
            <strong>{reviews.length}</strong>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-management-table admin-reviews-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produit</th>
                  <th>Client</th>
                  <th>Note</th>
                  <th>Avis</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.map((review, index) => (
                  <tr key={review.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="admin-line-with-image">
                        {review.image_url ? (
                          <img alt={review.product_name} src={review.image_url} />
                        ) : (
                          <i>{review.product_name.slice(0, 2).toUpperCase()}</i>
                        )}
                        <span>
                          <strong>{review.product_name}</strong>
                          <small>{review.product_sku}</small>
                          <small>{review.order_number || "Sans commande"}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{review.customer_name}</strong>
                      <small>{review.customer_email}</small>
                      <span>
                        {verified(review.verified_purchase)
                          ? "Achat verifie"
                          : "Non verifie"}
                      </span>
                    </td>
                    <td>
                      <strong>{review.rating} / 5</strong>
                      <span className="admin-stars">{stars(review.rating)}</span>
                    </td>
                    <td>
                      <strong>{review.title || "Sans titre"}</strong>
                      <small>{review.comment || "Aucun commentaire"}</small>
                      <span>{dateTime(review.created_at)}</span>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${review.status}`}>
                        {statusLabel(review.status)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => openReview(review)} type="button">
                          Moderer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!reviews.length && (
              <div className="admin-empty-state">
                <strong>Aucun avis trouve</strong>
                <p>Les avis clients apparaitront ici apres publication.</p>
              </div>
            )}
            {reviews.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={reviews.length}
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

        {selectedReview && (
          <div className="admin-modal-backdrop" role="presentation">
            <section className="admin-editor-modal" role="dialog">
              <div className="admin-editor-modal-header">
                <div>
                  <p>Moderation</p>
                  <h3>Avis client</h3>
                </div>
                <button onClick={() => setSelectedReview(null)} type="button">
                  Fermer
                </button>
              </div>
              <form className="admin-category-form" onSubmit={moderate}>
                <section className="admin-review-detail">
                  <div className="admin-line-with-image">
                    {selectedReview.image_url ? (
                      <img
                        alt={selectedReview.product_name}
                        src={selectedReview.image_url}
                      />
                    ) : (
                      <i>
                        {selectedReview.product_name.slice(0, 2).toUpperCase()}
                      </i>
                    )}
                    <span>
                      <strong>{selectedReview.product_name}</strong>
                      <small>{selectedReview.product_sku}</small>
                    </span>
                  </div>
                  <article>
                    <span>{selectedReview.customer_name}</span>
                    <strong>{stars(selectedReview.rating)}</strong>
                    <h4>{selectedReview.title || "Sans titre"}</h4>
                    <p>{selectedReview.comment || "Aucun commentaire"}</p>
                  </article>
                </section>
                <div className="admin-form-grid">
                  <label>
                    Statut
                    <select
                      onChange={(event) =>
                        setNextStatus(event.target.value as ReviewRow["status"])
                      }
                      value={nextStatus}
                    >
                      <option value="published">Publier</option>
                      <option value="pending">Remettre en attente</option>
                      <option value="hidden">Masquer</option>
                      <option value="rejected">Rejeter</option>
                    </select>
                  </label>
                </div>
                <label>
                  Reponse admin
                  <textarea
                    onChange={(event) => setReply(event.target.value)}
                    value={reply}
                  />
                </label>
                <div className="admin-form-actions">
                  <button disabled={saving} type="submit">
                    Enregistrer la moderation
                  </button>
                  <button onClick={() => setSelectedReview(null)} type="button">
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
