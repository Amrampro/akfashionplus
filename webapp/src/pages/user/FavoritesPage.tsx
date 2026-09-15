import { useEffect, useMemo, useState } from "react";
import { del, get } from "../../services/api";

type FavoriteProduct = {
  id: number;
  product_id: number;
  slug: string;
  name: string;
  category_name: string;
  sale_enabled: boolean;
  sale_price_eur: number | null;
  rental_enabled: boolean;
  rental_price_per_day_eur: number | null;
  condition_type: "new" | "second_hand";
  image_url: string;
  average_rating: number;
  total_reviews: number;
  created_at: string;
};

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function date(value: string) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "-";
}

export default function FavoritesPage({ go }: { go: (page: string) => void }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });

    get<FavoriteProduct[]>("/favorites")
      .then((data) => {
        if (active) setFavorites(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger vos favoris.",
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

  const stats = useMemo(() => {
    return {
      rental: favorites.filter((item) => item.rental_enabled).length,
      secondHand: favorites.filter(
        (item) => item.condition_type === "second_hand",
      ).length,
      sale: favorites.filter((item) => item.sale_enabled).length,
    };
  }, [favorites]);

  async function removeFavorite(productId: number) {
    await del(`/favorites/${productId}`);
    setFavorites((current) =>
      current.filter((item) => item.product_id !== productId),
    );
  }

  return (
    <section className="user-favorites-page">
      <section className="user-page-head">
        <div>
          <p className="eyebrow">Favoris</p>
          <h2>Mes favoris</h2>
          <p>
            Retrouvez les articles sauvegardes pour achat, location ou
            comparaison.
          </p>
        </div>
        <button onClick={() => go("shop")} type="button">
          Explorer la boutique
        </button>
      </section>

      <section className="user-stat-grid">
        <article>
          <span>Favoris</span>
          <strong>{loading ? "..." : favorites.length}</strong>
          <small>Articles sauvegardes</small>
        </article>
        <article>
          <span>Achat</span>
          <strong>{loading ? "..." : stats.sale}</strong>
          <small>Disponibles a l'achat</small>
        </article>
        <article>
          <span>Location</span>
          <strong>{loading ? "..." : stats.rental}</strong>
          <small>Disponibles en location</small>
        </article>
        <article>
          <span>Seconde main</span>
          <strong>{loading ? "..." : stats.secondHand}</strong>
          <small>Selection occasion</small>
        </article>
      </section>

      <section className="user-panel">
        <div className="user-panel-head">
          <h2>Selection sauvegardee</h2>
        </div>

        {error && <div className="user-alert">{error}</div>}
        {loading && <p className="user-muted">Chargement des favoris...</p>}
        {!loading && favorites.length === 0 && (
          <div className="user-empty-state">
            <h3>Aucun favori sauvegarde</h3>
            <p>
              Cliquez sur le coeur d'un produit dans la boutique pour le
              retrouver ici.
            </p>
            <button onClick={() => go("shop")} type="button">
              Voir la boutique
            </button>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="favorite-product-grid">
            {favorites.map((item) => (
              <article className="favorite-product-card" key={item.id}>
                <button
                  aria-label="Retirer des favoris"
                  className="favorite-remove"
                  onClick={() => void removeFavorite(item.product_id)}
                  type="button"
                >
                  coeur
                </button>
                <div
                  className="favorite-product-media"
                  onClick={() => go(`product-${item.slug}`)}
                  role="presentation"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <span>{item.name.slice(0, 2)}</span>
                  )}
                </div>
                <div>
                  <small>
                    {item.category_name} - ajoute le {date(item.created_at)}
                  </small>
                  <h3>{item.name}</h3>
                  <p>{Number(item.average_rating || 0).toFixed(1)} / 5</p>
                  <div className="favorite-product-prices">
                    {item.sale_enabled && item.sale_price_eur ? (
                      <strong>{eur(item.sale_price_eur)}</strong>
                    ) : null}
                    {item.rental_enabled && item.rental_price_per_day_eur ? (
                      <span>
                        Location {eur(item.rental_price_per_day_eur)} / jour
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => go(`product-${item.slug}`)}
                    type="button"
                  >
                    Voir le produit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
