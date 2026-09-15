import { useEffect, useState } from "react";
import { appConfig } from "../../config/app";
import { useLanguage } from "../../hooks/useLanguage";

type ShopMode = "shop" | "new" | "second-hand" | "rental";
type CartProduct = {
  id: number;
  variantId?: number | null;
  slug: string;
  name: string;
  category: string;
  condition: "new" | "second_hand";
  price: number;
  rentPrice?: number;
  rating: number;
  color: string;
  sizes: string[];
  tag: string;
  rentalDeposit?: number;
};
type ShopProduct = {
  id: number;
  slug: string;
  name: string;
  category_id: number;
  category_name: string;
  condition_type: "new" | "second_hand";
  sale_enabled: boolean;
  rental_enabled: boolean;
  sale_price_eur: number | null;
  sale_price_aoa: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number | null;
  image_url: string;
  average_rating: number;
  total_reviews: number;
  featured: boolean;
  default_variant_id?: number | null;
};
type Category = {
  id: number;
  name: string;
  slug: string;
};

const API_URL = appConfig.apiUrl;

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function aoaAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value)} ${currency || "AOA"}`;
}

function toCartProduct(product: ShopProduct): CartProduct {
  const salePrice = Number(product.sale_price_eur || 0);
  const rentalPrice = Number(product.rental_price_per_day_eur || 0);

  return {
    id: product.id,
    variantId: product.default_variant_id || null,
    slug: product.slug,
    name: product.name,
    category: product.category_name,
    condition: product.condition_type,
    price: salePrice || rentalPrice,
    rentPrice: rentalPrice > 0 ? rentalPrice : undefined,
    rentalDeposit: Number(product.rental_deposit_eur || 0),
    rating: Number(product.average_rating || 0),
    color: "#082c8f",
    sizes: ["S", "M", "L"],
    tag: product.featured
      ? "Selection"
      : product.condition_type === "second_hand"
        ? "Seconde main"
        : "Nouveau",
  };
}

function handleProductNav(
  event: React.MouseEvent<HTMLAnchorElement>,
  slug: string,
  go: (page: string) => void,
) {
  event.preventDefault();
  go(`product-${slug}`);
}

export default function ShopPage({
  exchangeRate,
  go,
  initialMode,
  onAddToCart,
}: {
  exchangeRate: number;
  go: (page: string) => void;
  initialMode: ShopMode;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
}) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState(
    initialMode === "new"
      ? "new"
      : initialMode === "second-hand"
        ? "second_hand"
        : "",
  );
  const [availability, setAvailability] = useState(
    initialMode === "rental" ? "rental" : "",
  );
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState("AOA");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "48", lang: language });
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category_id", category);
    if (condition) params.set("condition_type", condition);
    if (availability === "rental") params.set("rental", "1");
    if (availability === "sale") params.set("sale", "1");

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([
      fetch(`${API_URL}/products?${params.toString()}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
      fetch(`${API_URL}/categories?lang=${language}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
    ])
      .then(([productPayload, categoryPayload]) => {
        if (productPayload.success === false)
          throw new Error(productPayload.message || "Produits indisponibles");
        if (categoryPayload.success === false)
          throw new Error(
            categoryPayload.message || "Categories indisponibles",
          );
        setProducts(productPayload.data || []);
        setTotal(
          productPayload.meta?.total || productPayload.data?.length || 0,
        );
        setCategories(categoryPayload.data || []);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setProducts([]);
        setTotal(0);
        setError(
          "Impossible de charger les produits depuis la base de donnees. Verifiez que l'API est lancee et que database.sql est importee.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [availability, category, condition, language, query]);

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((response) => response.json())
      .then((payload) => {
        const settings = Array.isArray(payload?.data?.settings)
          ? payload.data.settings
          : [];
        const display = settings.find(
          (item: { setting_key?: string }) =>
            item.setting_key === "display_currency",
        )?.setting_value;
        if (display) {
          const value = String(display);
          localStorage.setItem("ak_display_currency", value);
          setDisplayCurrency(value);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ak_auth_token");
    if (!token) return;

    fetch(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success !== false) {
          setFavoriteIds(
            (payload.data || []).map((item: { product_id: number }) =>
              Number(item.product_id),
            ),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  async function toggleFavorite(productId: number) {
    const token = localStorage.getItem("ak_auth_token");
    if (!token) {
      go("login");
      return;
    }

    const isFavorite = favoriteIds.includes(productId);
    const response = await fetch(`${API_URL}/favorites/${productId}`, {
      method: isFavorite ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      setError(payload.message || "Impossible de modifier les favoris.");
      return;
    }

    setFavoriteIds((current) =>
      isFavorite
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  const activeCategory = categories.find(
    (item) => String(item.id) === category,
  );

  return (
    <section className="shop-page">
      <div className="shop-hero">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1>Catalogue AK Fashion Plus</h1>
          <p>
            Produits charges depuis la base de donnees avec filtres par
            categorie, etat neuf/seconde main, achat et disponibilite location.
          </p>
        </div>
        <div className="shop-search-card">
          <label htmlFor="shop-search">Recherche</label>
          <div>
            <input
              id="shop-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Robe, veste, sac, sku..."
            />
            <button type="button" onClick={() => setQuery("")}>
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div className="shop-shell">
        <aside
          className={`filter-panel shop-filter-panel ${filtersOpen ? "open" : ""}`}
        >
          <button
            className="mobile-filter-toggle"
            onClick={() => setFiltersOpen((open) => !open)}
            type="button"
          >
            <span>Filtres</span>
            <strong>{filtersOpen ? "Fermer" : "Ouvrir"}</strong>
          </button>
          <div className="filter-content">
            <div className="filter-section">
              <h2>Categories</h2>
              <button
                className={category === "" ? "active" : ""}
                onClick={() => setCategory("")}
                type="button"
              >
                Toutes les categories
              </button>
              {categories.map((item) => (
                <button
                  className={category === String(item.id) ? "active" : ""}
                  key={item.id}
                  onClick={() => setCategory(String(item.id))}
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="filter-section">
              <h2>Etat du produit</h2>
              {[
                ["", "Tous les etats"],
                ["new", "Produit neuf"],
                ["second_hand", "Seconde main"],
              ].map(([value, label]) => (
                <button
                  className={condition === value ? "active" : ""}
                  key={value}
                  onClick={() => setCondition(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="filter-section">
              <h2>Disponibilite</h2>
              {[
                ["", "Achat et location"],
                ["sale", "Disponible a l'achat"],
                ["rental", "Disponible en location"],
              ].map(([value, label]) => (
                <button
                  className={availability === value ? "active" : ""}
                  key={value}
                  onClick={() => setAvailability(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="shop-content">
          <div className="shop-toolbar">
            <div>
              <p className="eyebrow">Resultats</p>
              <h2>
                {loading
                  ? "Chargement du catalogue..."
                  : `${total} produits trouves`}
              </h2>
              <span>
                {activeCategory?.name || "Toutes categories"} -{" "}
                {condition === "new"
                  ? "Neuf"
                  : condition === "second_hand"
                    ? "Seconde main"
                    : "Tous les etats"}{" "}
                -{" "}
                {availability === "rental"
                  ? "Location"
                  : availability === "sale"
                    ? "Achat"
                    : "Achat & location"}
              </span>
            </div>
            <div className="shop-sort">
              <span>Tri</span>
              <strong>Recents / featured</strong>
            </div>
          </div>

          {error && <div className="shop-message error">{error}</div>}
          {loading && <ShopSkeleton />}
          {!loading && !error && products.length === 0 && (
            <div className="shop-message">
              Aucun produit actif ne correspond a ces filtres dans la base de
              donnees.
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="shop-product-grid">
              {products.map((product, index) => (
                <ShopProductCard
                  go={go}
                  isFavorite={favoriteIds.includes(product.id)}
                  key={product.id}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={toggleFavorite}
                  product={product}
                  displayCurrency={displayCurrency}
                  exchangeRate={exchangeRate}
                  styleDelay={index * 45}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ShopProductCard({
  go,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
  product,
  displayCurrency,
  exchangeRate,
  styleDelay,
}: {
  go: (page: string) => void;
  isFavorite: boolean;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
  onToggleFavorite: (productId: number) => void;
  product: ShopProduct;
  displayCurrency: string;
  exchangeRate: number;
  styleDelay: number;
}) {
  const salePrice = Number(product.sale_price_eur || 0);
  const saleAoa = salePrice * Number(exchangeRate || 0);
  const rentalPrice = Number(product.rental_price_per_day_eur || 0);
  const saleAvailable = Boolean(product.sale_enabled && salePrice > 0);
  const rentalAvailable = Boolean(product.rental_enabled && rentalPrice > 0);

  return (
    <article
      className="shop-product-card"
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <a
        className="shop-product-media"
        href={`/products/${product.slug}`}
        onClick={(event) => handleProductNav(event, product.slug, go)}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <ProductVisual tone={product.slug} />
        )}
        <span>
          {product.featured
            ? "Selection"
            : product.condition_type === "new"
              ? "Neuf"
              : "Seconde main"}
        </span>
      </a>
      <button
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={`favorite-pill ${isFavorite ? "active" : ""}`}
        onClick={() => onToggleFavorite(product.id)}
        type="button"
      >
        coeur
      </button>
      <div className="shop-product-body">
        <div className="shop-card-top">
          <p>{product.category_name}</p>
          <small>{Number(product.average_rating || 0).toFixed(1)} / 5</small>
        </div>
        <h2>{product.name}</h2>
        <div className="shop-badges">
          {saleAvailable && <span>Achat</span>}
          {rentalAvailable && <span>Location</span>}
          {product.condition_type === "second_hand" && (
            <span>Seconde main</span>
          )}
        </div>
        <div className="shop-price-row">
          {saleAvailable ? (
            <>
              <strong>{eur(salePrice)}</strong>
              {saleAoa > 0 && (
                <small>{aoaAmount(saleAoa, displayCurrency)}</small>
              )}
            </>
          ) : rentalAvailable ? (
            <strong>Location uniquement</strong>
          ) : (
            <strong>Prix indisponible</strong>
          )}
        </div>
        {rentalAvailable && (
          <p className="rental-price">Location {eur(rentalPrice)} / jour</p>
        )}
        <div className="shop-card-actions">
          <button
            disabled={!saleAvailable}
            onClick={() => onAddToCart(toCartProduct(product), "purchase")}
            type="button"
          >
            Acheter
          </button>
          {rentalAvailable && (
            <button
              className="gold"
              onClick={() => onAddToCart(toCartProduct(product), "rental")}
              type="button"
            >
              Louer
            </button>
          )}
          <a
            href={`/products/${product.slug}`}
            onClick={(event) => handleProductNav(event, product.slug, go)}
          >
            Details
          </a>
        </div>
      </div>
    </article>
  );
}

function ShopSkeleton() {
  return (
    <div className="shop-product-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="shop-skeleton" key={index}>
          <span />
          <strong />
          <i />
        </div>
      ))}
    </div>
  );
}

function ProductVisual({ tone }: { tone: string }) {
  return (
    <div className={`visual visual-${Math.abs(hashCode(tone)) % 5}`}>
      <span />
      <i />
    </div>
  );
}

function hashCode(value: string) {
  return value.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);
}
