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
type HomeProduct = {
  id: number;
  slug: string;
  name: string;
  category_name: string;
  condition_type: "new" | "second_hand";
  sale_enabled: boolean;
  rental_enabled: boolean;
  sale_price_eur: number | null;
  sale_price_aoa: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur?: number | null;
  image_url: string;
  average_rating: number;
  total_reviews: number;
  featured: boolean;
  default_variant_id?: number | null;
};
type GiftCardType = {
  id: number;
  name: string;
  code: string;
  value_eur: number;
  image_url?: string;
};
type Review = {
  rating: number;
  title: string | null;
  comment: string | null;
  first_name: string;
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

function toCartProduct(product: HomeProduct): CartProduct {
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
      ? "Selection AK"
      : product.condition_type === "second_hand"
        ? "Seconde main"
        : "Nouveau",
  };
}

function handleNav(
  event: React.MouseEvent<HTMLAnchorElement>,
  page: string,
  go: (page: string) => void,
) {
  event.preventDefault();
  go(page);
}

export default function HomePage({
  displayCurrency,
  exchangeRate,
  go,
  onAddToCart,
}: {
  displayCurrency: string;
  exchangeRate: number;
  go: (page: string) => void;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
}) {
  const { language } = useLanguage();
  const [latestProducts, setLatestProducts] = useState<HomeProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<HomeProduct[]>([]);
  const [rentalProducts, setRentalProducts] = useState<HomeProduct[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCardType[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [reviews, setReviews] = useState<Array<Review & { product: string }>>(
    [],
  );
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

    Promise.all([
      fetch(`${API_URL}/products?limit=8&lang=${language}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
      fetch(`${API_URL}/products?limit=8&featured=1&lang=${language}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
      fetch(`${API_URL}/products?limit=4&rental=1&lang=${language}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
      fetch(`${API_URL}/gift-card-types`, { signal: controller.signal }).then(
        (response) => response.json(),
      ),
    ])
      .then(
        async ([
          latestPayload,
          featuredPayload,
          rentalPayload,
          giftCardPayload,
        ]) => {
          if (latestPayload.success === false)
            throw new Error(latestPayload.message || "Catalogue indisponible");
          const latest = latestPayload.data || [];
          const featured =
            featuredPayload.success === false ? [] : featuredPayload.data || [];
          const rentals =
            rentalPayload.success === false ? [] : rentalPayload.data || [];
          setLatestProducts(latest);
          setFeaturedProducts(
            featured.length
              ? featured
              : latest.filter((product: HomeProduct) => product.featured),
          );
          setRentalProducts(rentals);
          setGiftCards(
            giftCardPayload.success === false ? [] : giftCardPayload.data || [],
          );

          const reviewSources = latest.slice(0, 3);
          const loadedReviews = await Promise.all(
            reviewSources.map((product: HomeProduct) =>
              fetch(`${API_URL}/products/${product.slug}?lang=${language}`, {
                signal: controller.signal,
              })
                .then((response) => response.json())
                .then((payload) =>
                  (payload.data?.reviews || [])
                    .slice(0, 1)
                    .map((review: Review) => ({
                      ...review,
                      product: product.name,
                    })),
                )
                .catch(() => []),
            ),
          );
          setReviews(loadedReviews.flat());
        },
      )
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setError(
          "Impossible de charger les donnees de la Home depuis la base. Verifiez que l'API est lancee.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [language]);

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

  const bestSellers = useMemo(() => {
    return [...latestProducts]
      .sort(
        (a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0),
      )
      .slice(0, 4);
  }, [latestProducts]);

  return (
    <section className="home-page">
      <HeroBanner displayCurrency={displayCurrency} go={go} />
      <CategoryShowcase go={go} />
      <ProductSection
        emptyText="Aucune nouveaute active n'est disponible dans la base."
        go={go}
        loading={loading}
        onAddToCart={onAddToCart}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        products={latestProducts.slice(0, 8)}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        title="Nouveautes"
        subtitle="Les derniers articles ajoutes au catalogue AK Fashion Plus."
      />
      <ProductSection
        emptyText="Aucun best seller disponible pour le moment."
        go={go}
        loading={loading}
        onAddToCart={onAddToCart}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        products={bestSellers}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        title="Produits populaires"
        subtitle="Les pieces les mieux notees et les plus rassurantes pour vos clientes."
      />
      <PromoBanner go={go} />
      <RentalSpotlight
        go={go}
        loading={loading}
        onAddToCart={onAddToCart}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        products={rentalProducts}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
      />
      <CollectionHighlights go={go} />
      <ProductSection
        emptyText="Aucun produit featured n'est marque dans la base."
        go={go}
        loading={loading}
        onAddToCart={onAddToCart}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        products={featuredProducts.slice(0, 8)}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        title="Selection AK Fashion"
        subtitle="Articles mis en avant grace au champ featured du catalogue."
      />
      <HowItWorks />
      <ResaleBanner displayCurrency={displayCurrency} go={go} />
      <GiftCardsHome giftCards={giftCards} go={go} loading={loading} />
      <ReviewsHome reviews={reviews} />
      <AdvantagesBand />
      <NewsletterSection />
      {error && <div className="home-error">{error}</div>}
    </section>
  );
}

function HeroBanner({
  displayCurrency,
  go,
}: {
  displayCurrency: string;
  go: (page: string) => void;
}) {
  return (
    <section className="home-hero-banner">
      <div className="home-hero-copy">
        <p className="eyebrow">Nouvelle collection</p>
        <h1>Decouvrez la nouvelle collection</h1>
        <p>
          Robes, costumes, accessoires, location premium et cartes cadeaux pour
          connecter votre style entre l'Europe et l'Angola.
        </p>
        <div className="home-hero-proof">
          <span>
            <strong>EUR/{displayCurrency || "AOA"}</strong>
            Prix transparents
          </span>
          <span>
            <strong>Retrait</strong>
            Guichet securise
          </span>
          <span>
            <strong>Premium</strong>
            Achat ou location
          </span>
        </div>
        <div className="home-actions">
          <button onClick={() => go("shop")} type="button">
            Acheter maintenant
          </button>
          <button className="ghost" onClick={() => go("new")} type="button">
            Decouvrir la collection
          </button>
        </div>
      </div>
      <div className="home-hero-visual" aria-label="Collection AK Fashion Plus">
        <ProductVisual tone="hero-main-dress" />
        <div>
          <span>AK</span>
          <strong>Printemps / Ete</strong>
          <small>Shopping. Location. Revente.</small>
        </div>
        <aside>
          <strong>Selection du jour</strong>
          <span>Robe satin bleu royal</span>
          <small>Disponible achat et location</small>
        </aside>
      </div>
    </section>
  );
}

function CategoryShowcase({ go }: { go: (page: string) => void }) {
  const categories = [
    ["Femmes", "Robes, ensembles, sacs et soiree", "shop", "cat-women"],
    ["Hommes", "Costumes, chemises et elegance", "shop", "cat-men"],
    ["Robes", "Satin, gala, mariage, ceremonies", "shop", "cat-dresses"],
    ["Costumes", "Professionnel et evenementiel", "rental", "cat-suits"],
    ["Accessoires", "Sacs, bijoux, chaussures", "shop", "cat-accessories"],
  ];

  return (
    <section className="home-section">
      <HomeTitle
        eyebrow="Categories principales"
        title="Accedez directement a vos univers"
      />
      <div className="home-category-grid">
        {categories.map(([title, text, page, tone]) => (
          <button key={title} onClick={() => go(page)} type="button">
            <ProductVisual tone={tone} />
            <strong>{title}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductSection({
  displayCurrency,
  emptyText,
  exchangeRate,
  go,
  loading,
  onAddToCart,
  favoriteIds,
  onToggleFavorite,
  products,
  subtitle,
  title,
}: {
  displayCurrency: string;
  emptyText: string;
  exchangeRate: number;
  go: (page: string) => void;
  loading: boolean;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
  favoriteIds: number[];
  onToggleFavorite: (productId: number) => void;
  products: HomeProduct[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="home-section home-catalog-section">
      <HomeTitle eyebrow="Catalogue" title={title} subtitle={subtitle} />
      {loading && <HomeProductSkeleton />}
      {!loading && !products.length && (
        <div className="home-empty">{emptyText}</div>
      )}
      {!loading && products.length > 0 && (
        <div className="home-product-grid">
          {products.map((product, index) => (
            <HomeProductCard
              go={go}
              isFavorite={favoriteIds.includes(product.id)}
              key={product.id}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              product={product}
              displayCurrency={displayCurrency}
              exchangeRate={exchangeRate}
              styleDelay={index * 45}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeProductCard({
  displayCurrency,
  exchangeRate,
  go,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  product,
  styleDelay,
}: {
  displayCurrency: string;
  exchangeRate: number;
  go: (page: string) => void;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: number) => void;
  product: HomeProduct;
  styleDelay: number;
}) {
  const salePrice = Number(product.sale_price_eur || 0);
  const saleAoa = salePrice * Number(exchangeRate || 0);
  const rentalPrice = Number(product.rental_price_per_day_eur || 0);
  const saleAvailable = Boolean(product.sale_enabled && salePrice > 0);
  const rentalAvailable = Boolean(product.rental_enabled && rentalPrice > 0);

  return (
    <article
      className="home-product-card"
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <a
        href={`/products/${product.slug}`}
        onClick={(event) => handleNav(event, `product-${product.slug}`, go)}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <ProductVisual tone={product.slug} />
        )}
        <button
          aria-label={
            isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          className={isFavorite ? "active" : ""}
          onClick={(event) => {
            event.preventDefault();
            onToggleFavorite(product.id);
          }}
          type="button"
        >
          coeur
        </button>
        <span>{product.featured ? "Selection" : "Nouveau"}</span>
      </a>
      <div>
        <p>{product.category_name}</p>
        <h2>{product.name}</h2>
        <small>{Number(product.average_rating || 0).toFixed(1)} / 5</small>
        {saleAvailable && (
          <strong>
            {eur(salePrice)}
            {saleAoa > 0 && (
              <em>{secondaryAmount(saleAoa, displayCurrency)}</em>
            )}
          </strong>
        )}
        {rentalAvailable && <small>Location {eur(rentalPrice)} / jour</small>}
        <button
          disabled={!saleAvailable}
          onClick={() => onAddToCart(toCartProduct(product), "purchase")}
          type="button"
        >
          Ajouter au panier
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
      </div>
    </article>
  );
}

function PromoBanner({ go }: { go: (page: string) => void }) {
  return (
    <section className="home-promo-banner">
      <div>
        <p className="eyebrow">Campagne saisonniere</p>
        <h2>Elegance de saison, retrait boutique facilite</h2>
        <p>
          Une selection preparee pour ceremonies, travail, soirees et cadeaux,
          avec paiement securise.
        </p>
      </div>
      <div className="home-promo-card">
        <span>Nouvelle capsule</span>
        <strong>-15%</strong>
        <small>Sur les looks selectionnes</small>
      </div>
      <button onClick={() => go("shop")} type="button">
        Voir la campagne
      </button>
    </section>
  );
}

function RentalSpotlight({
  displayCurrency,
  exchangeRate,
  favoriteIds,
  go,
  loading,
  onAddToCart,
  onToggleFavorite,
  products,
}: {
  displayCurrency: string;
  exchangeRate: number;
  favoriteIds: number[];
  go: (page: string) => void;
  loading: boolean;
  onAddToCart: (product: CartProduct, mode?: "purchase" | "rental") => void;
  onToggleFavorite: (productId: number) => void;
  products: HomeProduct[];
}) {
  return (
    <section className="home-rental-section">
      <div className="home-rental-copy">
        <p className="eyebrow">Location de vetements</p>
        <h2>Portez l'exceptionnel sans forcement l'acheter</h2>
        <p>
          Robes de gala, costumes et accessoires premium avec dates, depot et
          retour controles.
        </p>
        <button onClick={() => go("rental")} type="button">
          Voir les articles a louer
        </button>
      </div>
      <div>
        {loading && <HomeProductSkeleton compact />}
        {!loading && products.length > 0 && (
          <div className="home-rental-grid">
            {products.slice(0, 3).map((product, index) => (
              <HomeProductCard
                go={go}
                isFavorite={favoriteIds.includes(product.id)}
                key={product.id}
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                product={product}
                displayCurrency={displayCurrency}
                exchangeRate={exchangeRate}
                styleDelay={index * 45}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CollectionHighlights({ go }: { go: (page: string) => void }) {
  const collections = [
    [
      "Collection Mariage",
      "Robes, costumes et accessoires ceremonie",
      "rental",
    ],
    ["Soiree & Gala", "Satin, noir, bleu royal et details or", "shop"],
    [
      "Elegance professionnelle",
      "Blazers, chemises, sacs et chaussures",
      "shop",
    ],
    [
      "Tenues traditionnelles",
      "Pieces selectionnees pour evenements familiaux",
      "second-hand",
    ],
  ];

  return (
    <section className="home-section">
      <HomeTitle eyebrow="Collections" title="Selections mises en avant" />
      <div className="home-collection-grid">
        {collections.map(([title, text, page]) => (
          <button key={title} onClick={() => go(page)} type="button">
            <span>AK</span>
            <strong>{title}</strong>
            <small>{text}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="home-section">
      <HomeTitle
        eyebrow="Comment ca marche ?"
        title="Un parcours simple, adapte a AK Fashion Plus"
      />
      <div className="home-steps">
        {[
          [
            "1",
            "Choisissez votre article",
            "Parcourez le catalogue, les tailles et les couleurs.",
          ],
          [
            "2",
            "Achetez ou louez",
            "Selectionnez achat, location ou revente selon l'article.",
          ],
          ["3", "Payez en ligne", "Stripe et cartes cadeaux AK Fashion Plus."],
          [
            "4",
            "Livraison ou retrait",
            "Livraison ou recuperation au guichet securise.",
          ],
        ].map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResaleBanner({
  displayCurrency,
  go,
}: {
  displayCurrency: string;
  go: (page: string) => void;
}) {
  return (
    <section className="home-resale-banner">
      <div>
        <p className="eyebrow">Revendre a AK Fashion Plus</p>
        <h2>
          Achetez en Europe, votre beneficiaire recupere l'equivalent en Angola, Europe ou ailleurs
        </h2>
        <p>
          La plateforme gere les commandes, la valorisation, le taux EUR/
          {displayCurrency || "KWANZA"} et
          le paiement au guichet pour differencier AK Fashion Plus d'une
          boutique classique.
        </p>
      </div>
      <button onClick={() => go("user-dashboard")} type="button">
        Decouvrir la revente
      </button>
    </section>
  );
}

function GiftCardsHome({
  giftCards,
  go,
  loading,
}: {
  giftCards: GiftCardType[];
  go: (page: string) => void;
  loading: boolean;
}) {
  const fallback = [
    { id: 1, name: "Kavula", code: "KAVULA", value_eur: 1000 },
    { id: 2, name: "Leticia", code: "LETICIA", value_eur: 500 },
    { id: 3, name: "Senga", code: "SENGA", value_eur: 300 },
    { id: 4, name: "Kimolo", code: "KIMOLO", value_eur: 200 },
    { id: 5, name: "Mwanza", code: "MWANZA", value_eur: 100 },
  ];
  const cards = giftCards.length ? giftCards : fallback;

  return (
    <section className="home-section">
      <HomeTitle
        eyebrow="Cartes cadeaux"
        title="Offrez une carte AK Fashion Plus"
      />
      <div className="home-gift-grid">
        {(loading ? fallback : cards).map((card, index) => (
          <GiftCardPreview
            key={card.id}
            name={card.name}
            referenceSeed={`${card.code}-${card.id}`}
            tone={["gold", "silver", "black"][index % 3]}
            value={Number(card.value_eur || 0)}
          />
        ))}
      </div>
      <button
        className="home-center-button"
        onClick={() => go("gift-cards")}
        type="button"
      >
        Offrir une carte cadeau
      </button>
    </section>
  );
}

function GiftCardPreview({
  name,
  referenceSeed,
  tone,
  value,
}: {
  name: string;
  referenceSeed: string;
  tone: string;
  value: number;
}) {
  const reference = buildGiftCardReference(referenceSeed);

  return (
    <article className={`giftcard-visual home-gift-preview ${tone}`}>
      <div className="giftcard-brand-row">
        <div>
          <span>AK</span>
          <small>Fashion Plus</small>
        </div>
        <div className="giftcard-badge">Carte cadeau</div>
      </div>
      <div className="giftcard-chip-row">
        <i className="giftcard-contactless" />
        <i className="giftcard-chip" />
      </div>
      <div className="giftcard-number">{reference}</div>
      <div className="giftcard-meta-row">
        <div>
          <small>Titulaire</small>
          <strong>Ana Kiala</strong>
        </div>
        <div>
          <small>Expire le</small>
          <strong>00/00</strong>
        </div>
      </div>
      <div className="giftcard-bottom-row">
        <h3>{name}</h3>
        <div>
          <small>Solde</small>
          <strong>{eur(value)}</strong>
        </div>
      </div>
    </article>
  );
}

function buildGiftCardReference(seed: string) {
  const digits = Array.from(seed).reduce(
    (value, char) => value + char.charCodeAt(0),
    4609000000000000,
  );
  return String(digits)
    .padEnd(16, "0")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function ReviewsHome({
  reviews,
}: {
  reviews: Array<Review & { product: string }>;
}) {
  return (
    <section className="home-section">
      <HomeTitle eyebrow="Avis clients" title="Ce que disent les clientes" />
      {reviews.length ? (
        <div className="home-review-grid">
          {reviews.map((review, index) => (
            <article key={`${review.first_name}-${review.product}-${index}`}>
              <strong>{Number(review.rating || 0).toFixed(1)} / 5</strong>
              <p>
                {review.comment ||
                  review.title ||
                  "Experience AK Fashion Plus validee."}
              </p>
              <small>
                {review.first_name} - {review.product}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="home-empty">
          Aucun avis publie disponible pour la Home.
        </div>
      )}
    </section>
  );
}

function AdvantagesBand() {
  return (
    <section className="home-advantages">
      {[
        ["Paiement securise", "Stripe et cartes cadeaux"],
        ["Livraison & retrait", "Guichet et beneficiaire"],
        ["Qualite controlee", "Articles authentiques"],
        ["Service client", "Suivi commande et location"],
      ].map(([title, text]) => (
        <article key={title}>
          <strong>{title}</strong>
          <span>{text}</span>
        </article>
      ))}
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="home-newsletter">
      <div>
        <p className="eyebrow">Newsletter</p>
        <h2>Recevez nos nouveautes et offres exclusives</h2>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <input placeholder="Votre adresse email" type="email" />
        <button type="submit">S'inscrire</button>
      </form>
    </section>
  );
}

function HomeTitle({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="home-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}

function HomeProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "home-rental-grid" : "home-product-grid"}>
      {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
        <div className="home-skeleton-card" key={index}>
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
