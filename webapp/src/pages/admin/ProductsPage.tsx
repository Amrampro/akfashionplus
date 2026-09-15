import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { del, get, post, postForm, put } from "../../services/api";

type AdminProductsPageProps = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

type Category = {
  id: number;
  name: string;
  name_fr?: string;
  status: string;
};

type ProductRow = {
  id: number;
  category_id: number;
  sku: string;
  slug: string;
  name: string;
  category_name: string;
  condition_type: "new" | "second_hand";
  sale_enabled: number | boolean;
  rental_enabled: number | boolean;
  sale_price_eur: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number;
  minimum_rental_days: number;
  maximum_rental_days: number | null;
  featured: number | boolean;
  status: "draft" | "active" | "inactive" | "archived";
  image_url: string;
  total_reviews: number;
  average_rating: number;
  default_variant_id?: number | null;
};

type Variant = {
  id: number;
  sku: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  barcode: string | null;
  sale_price_eur: number | null;
  rental_price_per_day_eur: number | null;
  rental_deposit_eur: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  status: string;
};

type ProductImage = {
  id: number;
  image_url: string;
  alt_text: string | null;
  is_primary: number | boolean;
  sort_order: number;
};

type ProductDetails = ProductRow & {
  description: string | null;
  name_fr: string;
  name_en: string;
  name_pt: string;
  description_fr: string | null;
  description_en: string | null;
  description_pt: string | null;
  variants: Variant[];
  images: ProductImage[];
};

type ProductForm = {
  category_id: string;
  sku: string;
  slug: string;
  name_fr: string;
  name_en: string;
  name_pt: string;
  description_fr: string;
  description_en: string;
  description_pt: string;
  condition_type: string;
  sale_enabled: boolean;
  rental_enabled: boolean;
  sale_price_eur: string;
  rental_price_per_day_eur: string;
  rental_deposit_eur: string;
  minimum_rental_days: string;
  maximum_rental_days: string;
  initial_stock_quantity: string;
  featured: boolean;
  status: string;
};

type VariantForm = {
  sku: string;
  size: string;
  color_name: string;
  color_hex: string;
  barcode: string;
  sale_price_eur: string;
  rental_price_per_day_eur: string;
  rental_deposit_eur: string;
  stock_quantity: string;
  reserved_quantity: string;
  status: string;
};

type ImageForm = {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: string;
};

const emptyProductForm: ProductForm = {
  category_id: "",
  sku: "",
  slug: "",
  name_fr: "",
  name_en: "",
  name_pt: "",
  description_fr: "",
  description_en: "",
  description_pt: "",
  condition_type: "new",
  sale_enabled: true,
  rental_enabled: false,
  sale_price_eur: "",
  rental_price_per_day_eur: "",
  rental_deposit_eur: "0",
  minimum_rental_days: "1",
  maximum_rental_days: "",
  initial_stock_quantity: "1",
  featured: false,
  status: "active",
};

const emptyVariantForm: VariantForm = {
  sku: "",
  size: "",
  color_name: "",
  color_hex: "#071846",
  barcode: "",
  sale_price_eur: "",
  rental_price_per_day_eur: "",
  rental_deposit_eur: "",
  stock_quantity: "0",
  reserved_quantity: "0",
  status: "active",
};

const emptyImageForm: ImageForm = {
  image_url: "",
  alt_text: "",
  is_primary: true,
  sort_order: "0",
};

function eur(value: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function boolValue(value: unknown) {
  return value === true || value === 1;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullableNumber(value: string) {
  return value === "" ? null : Number(value);
}

function productFormPayload(form: ProductForm) {
  return {
    category_id: Number(form.category_id),
    sku: form.sku.trim(),
    slug: form.slug.trim(),
    name_fr: form.name_fr.trim(),
    name_en: form.name_en.trim(),
    name_pt: form.name_pt.trim(),
    description_fr: form.description_fr || null,
    description_en: form.description_en || null,
    description_pt: form.description_pt || null,
    condition_type: form.condition_type,
    sale_enabled: form.sale_enabled,
    rental_enabled: form.rental_enabled,
    sale_price_eur: nullableNumber(form.sale_price_eur),
    rental_price_per_day_eur: nullableNumber(form.rental_price_per_day_eur),
    rental_deposit_eur: Number(form.rental_deposit_eur || 0),
    minimum_rental_days: Number(form.minimum_rental_days || 1),
    maximum_rental_days: nullableNumber(form.maximum_rental_days),
    initial_stock_quantity: Number(form.initial_stock_quantity || 1),
    featured: form.featured,
    status: form.status,
  };
}

function variantPayload(form: VariantForm) {
  return {
    sku: form.sku.trim(),
    size: form.size || null,
    color_name: form.color_name || null,
    color_hex: form.color_hex || null,
    barcode: form.barcode || null,
    sale_price_eur: nullableNumber(form.sale_price_eur),
    rental_price_per_day_eur: nullableNumber(form.rental_price_per_day_eur),
    rental_deposit_eur: nullableNumber(form.rental_deposit_eur),
    stock_quantity: Number(form.stock_quantity || 0),
    reserved_quantity: Number(form.reserved_quantity || 0),
    status: form.status,
  };
}

function formFromProduct(product: ProductDetails): ProductForm {
  return {
    ...emptyProductForm,
    category_id: String(product.category_id),
    sku: product.sku,
    slug: product.slug,
    name_fr: product.name_fr || product.name,
    name_en: product.name_en || product.name,
    name_pt: product.name_pt || product.name,
    description_fr: product.description_fr || product.description || "",
    description_en: product.description_en || "",
    description_pt: product.description_pt || "",
    condition_type: product.condition_type,
    sale_enabled: boolValue(product.sale_enabled),
    rental_enabled: boolValue(product.rental_enabled),
    sale_price_eur: product.sale_price_eur
      ? String(product.sale_price_eur)
      : "",
    rental_price_per_day_eur: product.rental_price_per_day_eur
      ? String(product.rental_price_per_day_eur)
      : "",
    rental_deposit_eur: String(product.rental_deposit_eur || 0),
    minimum_rental_days: String(product.minimum_rental_days || 1),
    maximum_rental_days: product.maximum_rental_days
      ? String(product.maximum_rental_days)
      : "",
    featured: boolValue(product.featured),
    status: product.status,
  };
}

export default function ProductsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: AdminProductsPageProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(
    null,
  );
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariantForm);
  const [imageForm, setImageForm] = useState<ImageForm>(emptyImageForm);
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("");
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editorOpen, setEditorOpen] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteRefusal, setDeleteRefusal] = useState<{
    message: string;
    product: ProductRow | ProductDetails;
  } | null>(null);

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ admin: "1", limit: "100" });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (categoryId) params.set("category_id", categoryId);
    if (condition) params.set("condition_type", condition);
    return `/products?${params.toString()}`;
  }, [categoryId, condition, query, status]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([
      get<ProductRow[]>(listPath),
      get<Category[]>("/categories?admin=1"),
    ])
      .then(([productRows, categoryRows]) => {
        if (!active) return;
        setProducts(productRows || []);
        setCategories(categoryRows || []);
        setProductForm((current) =>
          current.category_id || !categoryRows?.[0]?.id
            ? current
            : { ...current, category_id: String(categoryRows[0].id) },
        );
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
  }, [listPath]);

  const totals = useMemo(
    () => ({
      active: products.filter((product) => product.status === "active").length,
      draft: products.filter((product) => product.status === "draft").length,
      rental: products.filter((product) => boolValue(product.rental_enabled))
        .length,
      stockManaged: selectedProduct?.variants.reduce(
        (sum, variant) => sum + Number(variant.stock_quantity || 0),
        0,
      ),
    }),
    [products, selectedProduct],
  );

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          Number(b.id || 0) - Number(a.id || 0),
      ),
    [products],
  );
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const safePage = Math.min(tablePage, totalPages);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function resetToCreate() {
    setMode("create");
    setEditorOpen(true);
    setSelectedProduct(null);
    setProductForm({
      ...emptyProductForm,
      category_id: categories[0]?.id ? String(categories[0].id) : "",
    });
    setVariantForm(emptyVariantForm);
    setImageForm(emptyImageForm);
    setLocalImageFile(null);
    setEditingVariantId(null);
    setEditingImageId(null);
    setSuccess("");
    setError("");
  }

  function loadProduct(productId: number) {
    setMode("edit");
    setEditorOpen(true);
    setDetailsLoading(true);
    setError("");
    setSuccess("");
    get<ProductDetails>(`/products/admin/${productId}`)
      .then((product) => {
        setSelectedProduct(product);
        setProductForm(formFromProduct(product));
        setVariantForm(emptyVariantForm);
        setImageForm(emptyImageForm);
        setLocalImageFile(null);
        setEditingVariantId(null);
        setEditingImageId(null);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setDetailsLoading(false));
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingVariantId(null);
    setEditingImageId(null);
    setDetailsLoading(false);
  }

  function updateProductForm(
    field: keyof ProductForm,
    value: string | boolean,
  ) {
    setProductForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name_fr" && !current.slug) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function updateVariantForm(field: keyof VariantForm, value: string) {
    setVariantForm((current) => ({ ...current, [field]: value }));
  }

  async function refreshProducts(productId?: number) {
    const rows = await get<ProductRow[]>(listPath);
    setProducts(rows || []);
    if (productId) {
      const product = await get<ProductDetails>(`/products/admin/${productId}`);
      setSelectedProduct(product);
      setProductForm(formFromProduct(product));
    }
  }

  async function uploadLocalImage(productId: number) {
    if (!localImageFile) return null;
    const body = new FormData();
    body.append("image", localImageFile);
    body.append("alt_text", imageForm.alt_text || productForm.name_fr);
    body.append("is_primary", String(imageForm.is_primary));
    body.append("sort_order", imageForm.sort_order || "0");
    return postForm(`/products/${productId}/images/upload`, body);
  }

  function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const request =
      mode === "edit" && selectedProduct
        ? put(
            `/products/${selectedProduct.id}`,
            productFormPayload(productForm),
          )
        : post<{ id: number }>("/products", {
            ...productFormPayload(productForm),
            variants: [variantPayload(variantForm)].filter(
              (variant) => variant.sku,
            ),
            images: imageForm.image_url
              ? [
                  {
                    image_url: imageForm.image_url,
                    alt_text: imageForm.alt_text || productForm.name_fr,
                    is_primary: imageForm.is_primary,
                    sort_order: Number(imageForm.sort_order || 0),
                  },
                ]
              : [],
          });

    request
      .then((payload) => {
        const productId =
          mode === "edit" && selectedProduct
            ? selectedProduct.id
            : Number((payload as { id?: number })?.id || 0);
        setSuccess(
          mode === "edit" ? "Produit mis a jour." : "Produit cree avec succes.",
        );
        return uploadLocalImage(productId).then(() =>
          refreshProducts(productId || undefined),
        );
      })
      .then(() => {
        if (mode === "create") setMode("edit");
        setLocalImageFile(null);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function archiveProduct(product: ProductRow | ProductDetails, ask = true) {
    if (ask && !window.confirm(`Archiver le produit ${product.name} ?`)) return;
    setSaving(true);
    setError("");
    setSuccess("");
    put(`/products/${product.id}/archive`, {})
      .then(() => {
        setSuccess("Produit archive.");
        if (selectedProduct?.id === product.id) closeEditor();
        return refreshProducts();
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function unarchiveProduct(product: ProductRow | ProductDetails) {
    setSaving(true);
    setError("");
    setSuccess("");
    put(`/products/${product.id}`, { status: "active" })
      .then(() => {
        setSuccess("Produit desarchive et remis actif.");
        return refreshProducts(product.id);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function activateProduct(product: ProductRow | ProductDetails) {
    setSaving(true);
    setError("");
    setSuccess("");
    put(`/products/${product.id}`, { status: "active" })
      .then(() => {
        setSuccess("Produit active. Il est maintenant eligible au site public.");
        return refreshProducts(product.id);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function deleteProduct(product: ProductRow | ProductDetails) {
    if (
      !window.confirm(`Supprimer definitivement le produit ${product.name} ?`)
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    del(`/products/${product.id}`)
      .then(() => {
        setSuccess("Produit supprime definitivement.");
        if (selectedProduct?.id === product.id) closeEditor();
        return refreshProducts();
      })
      .catch((requestError: Error) => {
        setDeleteRefusal({
          message: requestError.message,
          product,
        });
      })
      .finally(() => setSaving(false));
  }

  function saveVariant(event: FormEvent) {
    event.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const request = editingVariantId
      ? put(
          `/products/variants/${editingVariantId}`,
          variantPayload(variantForm),
        )
      : post(
          `/products/${selectedProduct.id}/variants`,
          variantPayload(variantForm),
        );

    request
      .then(() => {
        setSuccess(
          editingVariantId ? "Variante modifiee." : "Variante ajoutee.",
        );
        setVariantForm(emptyVariantForm);
        setEditingVariantId(null);
        return refreshProducts(selectedProduct.id);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function editVariant(variant: Variant) {
    setEditingVariantId(variant.id);
    setVariantForm({
      sku: variant.sku,
      size: variant.size || "",
      color_name: variant.color_name || "",
      color_hex: variant.color_hex || "#071846",
      barcode: variant.barcode || "",
      sale_price_eur: variant.sale_price_eur
        ? String(variant.sale_price_eur)
        : "",
      rental_price_per_day_eur: variant.rental_price_per_day_eur
        ? String(variant.rental_price_per_day_eur)
        : "",
      rental_deposit_eur: variant.rental_deposit_eur
        ? String(variant.rental_deposit_eur)
        : "",
      stock_quantity: String(variant.stock_quantity || 0),
      reserved_quantity: String(variant.reserved_quantity || 0),
      status: variant.status,
    });
  }

  function deactivateVariant(variant: Variant) {
    if (!selectedProduct) return;
    setSaving(true);
    put(`/products/variants/${variant.id}`, { status: "inactive" })
      .then(() => refreshProducts(selectedProduct.id))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function addImage(event: FormEvent) {
    event.preventDefault();
    if (!selectedProduct || (!imageForm.image_url && !localImageFile)) return;
    setSaving(true);
    setError("");
    const request = editingImageId
      ? put(`/products/images/${editingImageId}`, {
          image_url: imageForm.image_url,
          alt_text: imageForm.alt_text || selectedProduct.name,
          is_primary: imageForm.is_primary,
          sort_order: Number(imageForm.sort_order || 0),
        })
      : localImageFile
        ? uploadLocalImage(selectedProduct.id)
        : post(`/products/${selectedProduct.id}/images`, {
            image_url: imageForm.image_url,
            alt_text: imageForm.alt_text || selectedProduct.name,
            is_primary: imageForm.is_primary,
            sort_order: Number(imageForm.sort_order || 0),
          });

    request
      .then(() => {
        setImageForm(emptyImageForm);
        setLocalImageFile(null);
        setEditingImageId(null);
        return refreshProducts(selectedProduct.id);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function removeImage(imageId: number) {
    if (!selectedProduct) return;
    setSaving(true);
    del(`/products/images/${imageId}`)
      .then(() => refreshProducts(selectedProduct.id))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  function editImage(image: ProductImage) {
    setEditingImageId(image.id);
    setLocalImageFile(null);
    setImageForm({
      image_url: image.image_url,
      alt_text: image.alt_text || "",
      is_primary: boolValue(image.is_primary),
      sort_order: String(image.sort_order || 0),
    });
  }

  function cancelImageEdit() {
    setEditingImageId(null);
    setLocalImageFile(null);
    setImageForm(emptyImageForm);
  }

  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <section className="admin-products-page">
        <section className="admin-hero">
          <div>
            <p>Catalogue</p>
            <h2>Gestion des produits</h2>
            <span>
              Ajoutez, modifiez, archivez et pilotez les produits, variantes,
              stock, achat, location, images et mise en avant.
            </span>
          </div>
          <button onClick={resetToCreate} type="button">
            Nouveau produit
          </button>
        </section>

        <section className="admin-product-kpis">
          <article>
            <span>Produits affiches</span>
            <strong>{loading ? "..." : products.length}</strong>
          </article>
          <article>
            <span>Actifs</span>
            <strong>{loading ? "..." : totals.active}</strong>
          </article>
          <article>
            <span>Brouillons</span>
            <strong>{loading ? "..." : totals.draft}</strong>
          </article>
          <article>
            <span>Disponibles location</span>
            <strong>{loading ? "..." : totals.rental}</strong>
          </article>
        </section>

        <section className="admin-product-toolbar">
          <label>
            Recherche
            <input
              onChange={(event) => {
                setQuery(event.target.value);
                setTablePage(1);
              }}
              placeholder="Nom, SKU, description..."
              type="search"
              value={query}
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
              <option value="">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="archived">Archive</option>
            </select>
          </label>
          <label>
            Categorie
            <select
              onChange={(event) => {
                setCategoryId(event.target.value);
                setTablePage(1);
              }}
              value={categoryId}
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name || category.name_fr}
                </option>
              ))}
            </select>
          </label>
          <label>
            Etat
            <select
              onChange={(event) => {
                setCondition(event.target.value);
                setTablePage(1);
              }}
              value={condition}
            >
              <option value="">Tous</option>
              <option value="new">Produit neuf</option>
              <option value="second_hand">Seconde main</option>
            </select>
          </label>
        </section>

        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success">{success}</p>}

        <section className="admin-products-layout">
          <section className="admin-products-list admin-panel">
            <div className="admin-panel-head">
              <div>
                <p>Catalogue</p>
                <h3>Produits</h3>
              </div>
              <strong>{products.length}</strong>
            </div>
            {loading && <p className="admin-loading">Chargement produits...</p>}
            {!loading && products.length === 0 && (
              <p className="admin-empty">
                Aucun produit ne correspond aux filtres.
              </p>
            )}
            {!loading && products.length > 0 && (
              <div className="admin-products-table">
                <div className="admin-products-row head">
                  <span>#</span>
                  <span>Image</span>
                  <span>Produit</span>
                  <span>Categorie</span>
                  <span>Prix</span>
                  <span>Options</span>
                  <span>Statut</span>
                  <span>Actions</span>
                </div>
                {paginatedProducts.map((product, index) => (
                  <article
                    className={`admin-products-row ${selectedProduct?.id === product.id ? "active" : ""}`}
                    key={product.id}
                  >
                    <span className="admin-row-number">
                      {(safePage - 1) * pageSize + index + 1}
                    </span>
                    <span className="admin-product-cover">
                      {product.image_url ? (
                        <img alt={product.name} src={product.image_url} />
                      ) : (
                        <i>{product.name.slice(0, 2).toUpperCase()}</i>
                      )}
                    </span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </span>
                    <span>{product.category_name}</span>
                    <span>
                      <strong>{eur(product.sale_price_eur)}</strong>
                      {product.rental_price_per_day_eur && (
                        <small>
                          Location {eur(product.rental_price_per_day_eur)} / j
                        </small>
                      )}
                    </span>
                    <span>
                      {boolValue(product.sale_enabled) && <b>Achat</b>}
                      {boolValue(product.rental_enabled) && <b>Location</b>}
                      {boolValue(product.featured) && <b>Selection</b>}
                    </span>
                    <span className={`admin-badge status-${product.status}`}>
                      {product.status}
                    </span>
                    <span className="admin-product-actions">
                      <button
                        onClick={() => loadProduct(product.id)}
                        type="button"
                      >
                        Modifier
                      </button>
                      {product.status !== "archived" &&
                        (product.status !== "active" ||
                          !product.default_variant_id) && (
                          <button
                            onClick={() => activateProduct(product)}
                            type="button"
                          >
                            {product.status === "active"
                              ? "Preparer site"
                              : "Activer"}
                          </button>
                        )}
                      <button
                        onClick={() =>
                          product.status === "archived"
                            ? unarchiveProduct(product)
                            : archiveProduct(product)
                        }
                        type="button"
                      >
                        {product.status === "archived"
                          ? "Desarchiver"
                          : "Archiver"}
                      </button>
                      <button
                        className="danger"
                        onClick={() => deleteProduct(product)}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </span>
                  </article>
                ))}
              </div>
            )}
            {!loading && products.length > 0 && (
              <PaginationControls
                page={safePage}
                pageSize={pageSize}
                total={sortedProducts.length}
                totalPages={totalPages}
                onPageChange={setTablePage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setTablePage(1);
                }}
              />
            )}
          </section>
        </section>

        {editorOpen && (
          <section
            aria-modal="true"
            className="admin-product-modal"
            role="dialog"
          >
            <button
              aria-label="Fermer le formulaire produit"
              className="admin-product-modal-backdrop"
              onClick={closeEditor}
              type="button"
            />
            <aside className="admin-product-editor admin-panel">
              <div className="admin-product-modal-head">
                <div>
                  <p>{mode === "create" ? "Creation" : "Edition"}</p>
                  <h3>
                    {mode === "create"
                      ? "Nouveau produit"
                      : productForm.name_fr}
                  </h3>
                </div>
                <button
                  aria-label="Fermer"
                  className="admin-product-modal-close"
                  onClick={closeEditor}
                  type="button"
                >
                  x
                </button>
              </div>

              {detailsLoading && (
                <p className="admin-loading">Chargement detail...</p>
              )}
              {error && <p className="admin-error">{error}</p>}
              {success && <p className="admin-success">{success}</p>}
              {!detailsLoading && (
                <>
                  <form onSubmit={saveProduct}>
                    <div className="admin-panel-head">
                      <div>
                        <p>Informations</p>
                        <h3>Produit</h3>
                      </div>
                      {mode === "edit" && selectedProduct && (
                        <span className="admin-modal-actions">
                          <button
                            className="admin-secondary-button"
                            onClick={() =>
                              selectedProduct.status === "archived"
                                ? unarchiveProduct(selectedProduct)
                                : archiveProduct(selectedProduct)
                            }
                            type="button"
                          >
                            {selectedProduct.status === "archived"
                              ? "Desarchiver"
                              : "Archiver"}
                          </button>
                          <button
                            className="admin-danger-button"
                            onClick={() => deleteProduct(selectedProduct)}
                            type="button"
                          >
                            Supprimer
                          </button>
                        </span>
                      )}
                    </div>

                    <ProductFormFields
                      categories={categories}
                      form={productForm}
                      imageForm={imageForm}
                      localImageFile={localImageFile}
                      onFileChange={setLocalImageFile}
                      onImageChange={setImageForm}
                      onChange={updateProductForm}
                    />

                    <button
                      className="admin-save-order"
                      disabled={saving}
                      type="submit"
                    >
                      {saving
                        ? "Enregistrement..."
                        : mode === "create"
                          ? "Creer le produit"
                          : "Enregistrer le produit"}
                    </button>
                  </form>

                  {mode === "edit" && selectedProduct && (
                    <ProductManagement
                      imageForm={imageForm}
                      onAddImage={addImage}
                      onDeactivateVariant={deactivateVariant}
                      onEditVariant={editVariant}
                      onEditImage={editImage}
                      onImageChange={setImageForm}
                      onLocalFileChange={setLocalImageFile}
                      onRemoveImage={removeImage}
                      onCancelImageEdit={cancelImageEdit}
                      onSaveVariant={saveVariant}
                      onVariantChange={updateVariantForm}
                      product={selectedProduct}
                      saving={saving}
                      variantForm={variantForm}
                      variantId={editingVariantId}
                      imageId={editingImageId}
                    />
                  )}
                </>
              )}
            </aside>
          </section>
        )}

        {deleteRefusal && (
          <section
            aria-modal="true"
            className="admin-delete-refusal-modal"
            role="dialog"
          >
            <button
              aria-label="Fermer le message"
              className="admin-product-modal-backdrop"
              onClick={() => setDeleteRefusal(null)}
              type="button"
            />
            <article>
              <p>Suppression refusee</p>
              <h3>Ce produit a deja ete utilise.</h3>
              <span>{deleteRefusal.message}</span>
              <div>
                <button
                  onClick={() => {
                    const product = deleteRefusal.product;
                    setDeleteRefusal(null);
                    archiveProduct(product, false);
                  }}
                  type="button"
                >
                  Archiver a la place
                </button>
                <button
                  className="outline"
                  onClick={() => setDeleteRefusal(null)}
                  type="button"
                >
                  Fermer
                </button>
              </div>
            </article>
          </section>
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

function ProductFormFields({
  categories,
  form,
  imageForm,
  localImageFile,
  onChange,
  onFileChange,
  onImageChange,
}: {
  categories: Category[];
  form: ProductForm;
  imageForm: ImageForm;
  localImageFile: File | null;
  onChange: (field: keyof ProductForm, value: string | boolean) => void;
  onFileChange: (file: File | null) => void;
  onImageChange: (form: ImageForm) => void;
}) {
  return (
    <div className="admin-product-form-grid">
      <label>
        Categorie
        <select
          onChange={(event) => onChange("category_id", event.target.value)}
          required
          value={form.category_id}
        >
          <option value="">Selectionner</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name || category.name_fr}
            </option>
          ))}
        </select>
      </label>
      <label>
        SKU
        <input
          onChange={(event) => onChange("sku", event.target.value)}
          required
          value={form.sku}
        />
      </label>
      <label>
        Slug
        <input
          onChange={(event) => onChange("slug", slugify(event.target.value))}
          required
          value={form.slug}
        />
      </label>
      <label>
        Statut
        <select
          onChange={(event) => onChange("status", event.target.value)}
          value={form.status}
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="archived">Archive</option>
        </select>
      </label>
      <label>
        Nom FR
        <input
          onChange={(event) => onChange("name_fr", event.target.value)}
          required
          value={form.name_fr}
        />
      </label>
      <label>
        Nom EN
        <input
          onChange={(event) => onChange("name_en", event.target.value)}
          required
          value={form.name_en}
        />
      </label>
      <label>
        Nom PT
        <input
          onChange={(event) => onChange("name_pt", event.target.value)}
          required
          value={form.name_pt}
        />
      </label>
      <label>
        Etat
        <select
          onChange={(event) => onChange("condition_type", event.target.value)}
          value={form.condition_type}
        >
          <option value="new">Produit neuf</option>
          <option value="second_hand">Seconde main</option>
        </select>
      </label>
      <label className="wide">
        Description FR
        <textarea
          onChange={(event) => onChange("description_fr", event.target.value)}
          value={form.description_fr}
        />
      </label>
      <label className="wide">
        Description EN
        <textarea
          onChange={(event) => onChange("description_en", event.target.value)}
          value={form.description_en}
        />
      </label>
      <label className="wide">
        Description PT
        <textarea
          onChange={(event) => onChange("description_pt", event.target.value)}
          value={form.description_pt}
        />
      </label>
      <label>
        Prix achat EUR
        <input
          min="0"
          onChange={(event) => onChange("sale_price_eur", event.target.value)}
          step="0.01"
          type="number"
          value={form.sale_price_eur}
        />
      </label>
      <label>
        Prix location / jour
        <input
          min="0"
          onChange={(event) =>
            onChange("rental_price_per_day_eur", event.target.value)
          }
          step="0.01"
          type="number"
          value={form.rental_price_per_day_eur}
        />
      </label>
      <label>
        Depot location
        <input
          min="0"
          onChange={(event) =>
            onChange("rental_deposit_eur", event.target.value)
          }
          step="0.01"
          type="number"
          value={form.rental_deposit_eur}
        />
      </label>
      <label>
        Jours minimum
        <input
          min="1"
          onChange={(event) =>
            onChange("minimum_rental_days", event.target.value)
          }
          type="number"
          value={form.minimum_rental_days}
        />
      </label>
      <label>
        Jours maximum
        <input
          min="1"
          onChange={(event) =>
            onChange("maximum_rental_days", event.target.value)
          }
          type="number"
          value={form.maximum_rental_days}
        />
      </label>
      <label>
        Stock initial
        <input
          min="0"
          onChange={(event) =>
            onChange("initial_stock_quantity", event.target.value)
          }
          type="number"
          value={form.initial_stock_quantity}
        />
      </label>
      <div className="admin-product-checks wide">
        <label>
          <input
            checked={form.sale_enabled}
            onChange={(event) => onChange("sale_enabled", event.target.checked)}
            type="checkbox"
          />
          Disponible a l'achat
        </label>
        <label>
          <input
            checked={form.rental_enabled}
            onChange={(event) =>
              onChange("rental_enabled", event.target.checked)
            }
            type="checkbox"
          />
          Disponible en location
        </label>
        <label>
          <input
            checked={form.featured}
            onChange={(event) => onChange("featured", event.target.checked)}
            type="checkbox"
          />
          Selection AK
        </label>
      </div>
      <section className="admin-product-upload wide">
        <div>
          <strong>Image de couverture</strong>
          <span>
            Chargez une image depuis votre appareil. Une URL peut aussi etre
            utilisee si necessaire.
          </span>
        </div>
        <label>
          Fichier local
          <input
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            type="file"
          />
        </label>
        {localImageFile && <small>{localImageFile.name}</small>}
        <label>
          URL image
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, image_url: event.target.value })
            }
            placeholder="https://..."
            type="url"
            value={imageForm.image_url}
          />
        </label>
        <label>
          Texte alternatif
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, alt_text: event.target.value })
            }
            value={imageForm.alt_text}
          />
        </label>
        <label>
          Ordre
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, sort_order: event.target.value })
            }
            type="number"
            value={imageForm.sort_order}
          />
        </label>
        <label className="admin-inline-check">
          <input
            checked={imageForm.is_primary}
            onChange={(event) =>
              onImageChange({ ...imageForm, is_primary: event.target.checked })
            }
            type="checkbox"
          />
          Utiliser comme image principale
        </label>
      </section>
    </div>
  );
}

function ProductManagement({
  imageForm,
  imageId,
  onAddImage,
  onCancelImageEdit,
  onDeactivateVariant,
  onEditImage,
  onEditVariant,
  onImageChange,
  onLocalFileChange,
  onRemoveImage,
  onSaveVariant,
  onVariantChange,
  product,
  saving,
  variantForm,
  variantId,
}: {
  imageForm: ImageForm;
  imageId: number | null;
  onAddImage: (event: FormEvent) => void;
  onCancelImageEdit: () => void;
  onDeactivateVariant: (variant: Variant) => void;
  onEditImage: (image: ProductImage) => void;
  onEditVariant: (variant: Variant) => void;
  onImageChange: (form: ImageForm) => void;
  onLocalFileChange: (file: File | null) => void;
  onRemoveImage: (imageId: number) => void;
  onSaveVariant: (event: FormEvent) => void;
  onVariantChange: (field: keyof VariantForm, value: string) => void;
  product: ProductDetails;
  saving: boolean;
  variantForm: VariantForm;
  variantId: number | null;
}) {
  return (
    <div className="admin-product-subpanels">
      <section>
        <h4>Variantes et stock</h4>
        <form className="admin-variant-form" onSubmit={onSaveVariant}>
          <input
            onChange={(event) => onVariantChange("sku", event.target.value)}
            placeholder="SKU variante"
            required
            value={variantForm.sku}
          />
          <input
            onChange={(event) => onVariantChange("size", event.target.value)}
            placeholder="Taille"
            value={variantForm.size}
          />
          <input
            onChange={(event) =>
              onVariantChange("color_name", event.target.value)
            }
            placeholder="Couleur"
            value={variantForm.color_name}
          />
          <input
            onChange={(event) =>
              onVariantChange("color_hex", event.target.value)
            }
            type="color"
            value={variantForm.color_hex}
          />
          <input
            onChange={(event) =>
              onVariantChange("stock_quantity", event.target.value)
            }
            placeholder="Stock"
            type="number"
            value={variantForm.stock_quantity}
          />
          <input
            onChange={(event) =>
              onVariantChange("reserved_quantity", event.target.value)
            }
            placeholder="Reserve"
            type="number"
            value={variantForm.reserved_quantity}
          />
          <input
            onChange={(event) =>
              onVariantChange("sale_price_eur", event.target.value)
            }
            placeholder="Prix achat"
            step="0.01"
            type="number"
            value={variantForm.sale_price_eur}
          />
          <input
            onChange={(event) =>
              onVariantChange("rental_price_per_day_eur", event.target.value)
            }
            placeholder="Prix location"
            step="0.01"
            type="number"
            value={variantForm.rental_price_per_day_eur}
          />
          <select
            onChange={(event) => onVariantChange("status", event.target.value)}
            value={variantForm.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button disabled={saving} type="submit">
            {variantId ? "Modifier variante" : "Ajouter variante"}
          </button>
        </form>
        <div className="admin-variant-list">
          {product.variants.map((variant) => (
            <article key={variant.id}>
              <span
                className="admin-color-dot"
                style={{ background: variant.color_hex || "#071846" }}
              />
              <div>
                <strong>{variant.sku}</strong>
                <small>
                  {variant.size || "-"} / {variant.color_name || "-"} / stock{" "}
                  {variant.stock_quantity}
                </small>
              </div>
              <b>{variant.status}</b>
              <button onClick={() => onEditVariant(variant)} type="button">
                Editer
              </button>
              <button
                onClick={() => onDeactivateVariant(variant)}
                type="button"
              >
                Desactiver
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h4>Images</h4>
        <form className="admin-image-form" onSubmit={onAddImage}>
          {!imageId && (
            <input
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                onLocalFileChange(event.target.files?.[0] || null)
              }
              type="file"
            />
          )}
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, image_url: event.target.value })
            }
            placeholder="URL image"
            type="url"
            value={imageForm.image_url}
          />
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, alt_text: event.target.value })
            }
            placeholder="Texte alternatif"
            value={imageForm.alt_text}
          />
          <input
            onChange={(event) =>
              onImageChange({ ...imageForm, sort_order: event.target.value })
            }
            placeholder="Ordre"
            type="number"
            value={imageForm.sort_order}
          />
          <label>
            <input
              checked={imageForm.is_primary}
              onChange={(event) =>
                onImageChange({
                  ...imageForm,
                  is_primary: event.target.checked,
                })
              }
              type="checkbox"
            />
            Principale
          </label>
          <button disabled={saving} type="submit">
            {imageId ? "Modifier image" : "Ajouter image"}
          </button>
          {imageId && (
            <button onClick={onCancelImageEdit} type="button">
              Annuler
            </button>
          )}
        </form>
        <div className="admin-image-list">
          {product.images.map((image) => (
            <article key={image.id}>
              <img alt={image.alt_text || product.name} src={image.image_url} />
              <div>
                <strong>{image.alt_text || product.name}</strong>
                <small>
                  {boolValue(image.is_primary) ? "Principale" : "Image"}
                </small>
              </div>
              <button onClick={() => onEditImage(image)} type="button">
                Modifier
              </button>
              <button onClick={() => onRemoveImage(image.id)} type="button">
                Supprimer
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
