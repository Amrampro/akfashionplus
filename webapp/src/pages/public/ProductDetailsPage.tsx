import { useEffect, useMemo, useState } from "react";
import { appConfig } from "../../config/app";
import { useLanguage } from "../../hooks/useLanguage";

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
type Variant = {
  id: number;
  sku: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  sale_price_eur: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  status: "active" | "inactive";
};
type ProductImage = {
  id: number;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
};
type Review = {
  rating: number;
  title: string | null;
  comment: string | null;
  first_name: string;
  created_at: string;
};
type ProductDetails = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category_name: string;
  condition_type: "new" | "second_hand";
  sale_enabled: boolean;
  rental_enabled: boolean;
  sale_price_eur: number | null;
  sale_price_aoa: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number | null;
  minimum_rental_days: number;
  maximum_rental_days: number | null;
  image_url: string;
  average_rating: number;
  total_reviews: number;
  default_variant_id?: number | null;
  variants: Variant[];
  images: ProductImage[];
  reviews: Review[];
};

const API_URL = appConfig.apiUrl;

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function secondaryAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value)} ${currency || "AOA"}`;
}

function toCartProduct(
  product: ProductDetails,
  variant: Variant | null,
): CartProduct {
  const salePrice = Number(
    variant?.sale_price_eur || product.sale_price_eur || 0,
  );
  const rentalPrice = Number(
    variant?.rental_price_per_day_eur || product.rental_price_per_day_eur || 0,
  );

  return {
    id: product.id,
    variantId: variant?.id || product.default_variant_id || null,
    slug: product.slug,
    name: product.name,
    category: product.category_name,
    condition: product.condition_type,
    price: salePrice || rentalPrice,
    rentPrice: rentalPrice > 0 ? rentalPrice : undefined,
    rentalDeposit: Number(
      variant?.rental_deposit_eur || product.rental_deposit_eur || 0,
    ),
    rating: Number(product.average_rating || 0),
    color: variant?.color_hex || "#082c8f",
    sizes: product.variants
      .map((item) => item.size || "Unique")
      .filter(Boolean),
    tag: product.condition_type === "second_hand" ? "Seconde main" : "Nouveau",
  };
}

export default function ProductDetailsPage({
  displayCurrency,
  exchangeRate,
  go,
  onAddToCart,
  slug,
}: {
  displayCurrency: string;
  exchangeRate: number;
  go: (page: string) => void;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
  slug: string;
}) {
  const { language } = useLanguage();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });

    fetch(`${API_URL}/products/${slug}?lang=${language}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success === false)
          throw new Error(payload.message || "Produit introuvable");
        const data = payload.data as ProductDetails;
        setProduct(data);
        setSelectedImage(data.images?.[0]?.image_url || data.image_url || "");
        setSelectedVariantId(
          data.variants?.find((variant) => variant.status === "active")?.id ||
            data.variants?.[0]?.id ||
            null,
        );
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setProduct(null);
        setError(
          "Impossible de charger ce produit depuis la base de donnees. Verifiez que l'API est lancee.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [language, slug]);

  useEffect(() => {
    if (!product) return;
    const token = localStorage.getItem("ak_auth_token");
    if (!token) return;

    fetch(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success !== false) {
          setIsFavorite(
            (payload.data || []).some(
              (item: { product_id: number }) =>
                Number(item.product_id) === product.id,
            ),
          );
        }
      })
      .catch(() => undefined);
  }, [product]);

  async function toggleFavorite() {
    if (!product) return;
    const token = localStorage.getItem("ak_auth_token");
    if (!token) {
      go("login");
      return;
    }

    const response = await fetch(`${API_URL}/favorites/${product.id}`, {
      method: isFavorite ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      setError(payload.message || "Impossible de modifier les favoris.");
      return;
    }
    setIsFavorite((current) => !current);
  }

  const selectedVariant = useMemo(
    () =>
      product?.variants?.find((variant) => variant.id === selectedVariantId) ||
      null,
    [product, selectedVariantId],
  );

  if (loading) return <ProductDetailsSkeleton />;

  if (error || !product) {
    return (
      <section className="product-details-page">
        <div className="shop-message error">
          {error || "Produit introuvable."}
        </div>
        <button
          className="details-back-button"
          onClick={() => go("shop")}
          type="button"
        >
          Retour boutique
        </button>
      </section>
    );
  }

  const salePrice = Number(
    selectedVariant?.sale_price_eur || product.sale_price_eur || 0,
  );
  const saleAoa = salePrice * Number(exchangeRate || 0);
  const rentalPrice = Number(
    selectedVariant?.rental_price_per_day_eur ||
      product.rental_price_per_day_eur ||
      0,
  );
  const rentalDeposit = Number(
    selectedVariant?.rental_deposit_eur || product.rental_deposit_eur || 0,
  );
  const saleAvailable = Boolean(product.sale_enabled && salePrice > 0);
  const rentalAvailable = Boolean(product.rental_enabled && rentalPrice > 0);
  const availableStock = Math.max(
    Number(selectedVariant?.stock_quantity || 0) -
      Number(selectedVariant?.reserved_quantity || 0),
    0,
  );
  const gallery = product.images?.length
    ? product.images
    : selectedImage
      ? [
          {
            id: 0,
            image_url: selectedImage,
            alt_text: product.name,
            is_primary: true,
          },
        ]
      : [];

  return (
    <section className="product-details-page">
      <button
        className="details-back-button"
        onClick={() => go("shop")}
        type="button"
      >
        Retour boutique
      </button>

      <div className="product-details-shell">
        <div className="details-gallery-panel">
          <div className="details-main-image">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} />
            ) : (
              <ProductVisual tone={product.slug} />
            )}
          </div>
          <div className="details-thumbs">
            {gallery.map((image) => (
              <button
                className={selectedImage === image.image_url ? "active" : ""}
                key={image.id}
                onClick={() => setSelectedImage(image.image_url)}
                type="button"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || product.name}
                />
              </button>
            ))}
          </div>
        </div>

        <aside className="details-info-panel">
          <p className="eyebrow">{product.category_name}</p>
          <h1>{product.name}</h1>
          <div className="details-rating">
            <span>{Number(product.average_rating || 0).toFixed(1)} / 5</span>
            <small>
              {product.total_reviews || product.reviews?.length || 0} avis
            </small>
          </div>
          <p className="details-description">
            {product.description ||
              "Article AK Fashion Plus avec informations issues du catalogue et variantes de stock."}
          </p>

          <div className="details-price-box">
            {saleAvailable ? (
              <>
                <strong>{eur(salePrice)}</strong>
                {saleAoa > 0 && (
                  <small>{secondaryAmount(saleAoa, displayCurrency)}</small>
                )}
              </>
            ) : rentalAvailable ? (
              <strong>Location uniquement</strong>
            ) : (
              <strong>Prix indisponible</strong>
            )}
            {rentalAvailable && <span>Location {eur(rentalPrice)} / jour</span>}
            {rentalAvailable && rentalDeposit > 0 && (
              <span>Depot {eur(rentalDeposit)}</span>
            )}
          </div>

          <VariantSelector
            selectedVariantId={selectedVariantId}
            setSelectedVariantId={setSelectedVariantId}
            variants={product.variants || []}
          />

          <div className="details-stock">
            <span>Stock disponible</span>
            <strong>
              {selectedVariant ? availableStock : "Selectionnez une variante"}
            </strong>
          </div>

          <div className="purchase-actions">
            <button
              disabled={!saleAvailable}
              onClick={() =>
                onAddToCart(toCartProduct(product, selectedVariant), "purchase")
              }
              type="button"
            >
              Acheter
            </button>
            <button
              className="gold"
              disabled={!rentalAvailable}
              onClick={() =>
                onAddToCart(toCartProduct(product, selectedVariant), "rental")
              }
              type="button"
            >
              Louer
            </button>
            <button
              className={`favorite-action ${isFavorite ? "active" : ""}`}
              onClick={() => void toggleFavorite()}
              type="button"
            >
              {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </button>
          </div>

          <ul className="trust-list">
            <li>Retrait boutique securise avec code de retrait.</li>
            <li>
              Location minimum {product.minimum_rental_days || 1} jour(s).
            </li>
            <li>
              Prix et devise {displayCurrency || "AOA"} proviennent de la base
              au moment du chargement.
            </li>
          </ul>
        </aside>
      </div>

      <section className="details-reviews">
        <div className="panel-head">
          <h2>Avis clients</h2>
          <span>{product.reviews?.length || 0} avis publies</span>
        </div>
        {product.reviews?.length ? (
          <div className="reviews-grid">
            {product.reviews.map((review, index) => (
              <article
                key={`${review.first_name}-${review.created_at}-${index}`}
              >
                <strong>
                  {review.title ||
                    `${Number(review.rating || 0).toFixed(1)} / 5`}
                </strong>
                <p>{review.comment || "Avis sans commentaire."}</p>
                <small>{review.first_name}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="shop-message">
            Aucun avis publie pour ce produit dans la base de donnees.
          </div>
        )}
      </section>
    </section>
  );
}

function VariantSelector({
  selectedVariantId,
  setSelectedVariantId,
  variants,
}: {
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number) => void;
  variants: Variant[];
}) {
  if (!variants.length) {
    return (
      <div className="shop-message">
        Aucune variante active n'est enregistree pour ce produit.
      </div>
    );
  }

  return (
    <div className="details-variants">
      <h2>Tailles et couleurs</h2>
      <div>
        {variants.map((variant) => (
          <button
            className={selectedVariantId === variant.id ? "active" : ""}
            disabled={variant.status !== "active"}
            key={variant.id}
            onClick={() => setSelectedVariantId(variant.id)}
            type="button"
          >
            <span style={{ background: variant.color_hex || "#071846" }} />
            <strong>{variant.size || "Unique"}</strong>
            <small>{variant.color_name || variant.sku}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <section className="product-details-page">
      <div className="product-details-shell">
        <div className="shop-skeleton">
          <span />
          <strong />
          <i />
        </div>
        <div className="shop-skeleton">
          <span />
          <strong />
          <i />
        </div>
      </div>
    </section>
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
