import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useFavorites } from "../../hooks/useFavorites";
import { useLanguage } from "../../hooks/useLanguage";
import { get } from "../../services/api";
import { absoluteImageUrl } from "../../utils/images";

type Product = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  condition_type?: string | null;
  sale_enabled?: boolean | number;
  rental_enabled?: boolean | number;
  sale_price_eur?: number | string | null;
  sale_price_aoa?: number | string | null;
  rental_price_per_day_eur?: number | string | null;
  image_url?: string | null;
  average_rating?: number | string | null;
  featured?: boolean | number;
  created_at?: string | null;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  active_product_count?: number | string | null;
};

export type ShopInitialFilters = {
  categorySlug?: string;
  condition?: ConditionFilter;
  availability?: AvailabilityFilter;
  sort?: SortMode;
  query?: string;
};

type SettingsPayload = {
  settings?: Array<{ setting_key: string; setting_value: string | null }> | Record<string, string | number | null>;
};

type Props = {
  onOpenProduct?: (slug: string) => void;
  initialFilters?: ShopInitialFilters;
};

type AvailabilityFilter = "all" | "sale" | "rental" | "both";
type ConditionFilter = "all" | "new" | "second_hand";
type SortMode = "featured" | "newest" | "price_asc" | "price_desc" | "rating";

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function flag(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function settingValue(settings: SettingsPayload["settings"], key: string) {
  if (!settings) return undefined;
  if (Array.isArray(settings)) {
    return settings.find((item) => item.setting_key === key)?.setting_value || undefined;
  }
  const value = settings[key];
  return value === null || value === undefined ? undefined : String(value);
}

function formatSecondary(value: number, label: string, locale: string) {
  return `${Math.round(value).toLocaleString(locale)} ${label}`;
}

function ProductImage({ product }: { product: Product }) {
  const uri = absoluteImageUrl(product.image_url);
  if (uri) {
    return <Image source={{ uri }} style={styles.productImage} />;
  }
  return (
    <View style={styles.productPlaceholder}>
      <Text style={styles.productPlaceholderText}>
        {product.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </Text>
    </View>
  );
}

function ToolbarIcon({
  type,
  active,
}: {
  type: "filters" | "category" | "sort";
  active?: boolean;
}) {
  const tint = active ? "#FFF" : "#071846";

  if (type === "filters") {
    return (
      <View style={styles.toolbarIconCanvas}>
        <View style={[styles.filterLine, { backgroundColor: tint, width: 14 }]} />
        <View style={[styles.filterLine, { backgroundColor: tint, width: 10 }]} />
        <View style={[styles.filterLine, { backgroundColor: tint, width: 6 }]} />
      </View>
    );
  }

  if (type === "category") {
    return (
      <View style={styles.toolbarGridIcon}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.toolbarGridDot, { backgroundColor: tint }]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.toolbarIconCanvas}>
      <View style={[styles.sortLine, { borderColor: tint }]} />
      <View style={[styles.sortLineShort, { borderColor: tint }]} />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.searchIconCanvas}>
      <View style={styles.searchIconCircle} />
      <View style={styles.searchIconHandle} />
    </View>
  );
}

function ProductCard({
  product,
  currencyLabel,
  isFavorite,
  onPress,
  onToggleFavorite,
  locale,
  labels,
}: {
  product: Product;
  currencyLabel: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  locale: string;
  labels: {
    purchase: string;
    rental: string;
    day: string;
    secondHand: string;
    selection: string;
    catalogue: string;
  };
}) {
  const salePrice = numeric(product.sale_price_eur);
  const secondaryPrice = numeric(product.sale_price_aoa);
  const rentalPrice = numeric(product.rental_price_per_day_eur);
  const isRental = flag(product.rental_enabled) && rentalPrice > 0;
  const isSecondHand = product.condition_type === "second_hand";
  const rating = numeric(product.average_rating);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.productVisual}>
        <ProductImage product={product} />
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            isFavorite ? styles.favoriteButtonActive : null,
          ]}
          onPress={onToggleFavorite}
        >
          <Text
            style={[
              styles.favoriteText,
              isFavorite ? styles.favoriteTextActive : null,
            ]}
          >
            {isFavorite ? "♥" : "♡"}
          </Text>
        </TouchableOpacity>
        {isSecondHand || flag(product.featured) ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isSecondHand ? labels.secondHand : labels.selection}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productBody}>
        <View style={styles.productTopLine}>
          <Text numberOfLines={1} style={styles.productCategory}>
            {product.category_name || labels.catalogue}
          </Text>
          <Text style={styles.rating}>{rating.toFixed(1)} / 5</Text>
        </View>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatEur(salePrice, locale)}</Text>
        <Text style={styles.secondaryPrice}>
          {formatSecondary(secondaryPrice, currencyLabel, locale)}
        </Text>
        {isRental ? (
          <Text style={styles.rentalPrice}>
            {labels.rental} {formatEur(rentalPrice, locale)} / {labels.day}
          </Text>
        ) : null}
        <View style={styles.cardActions}>
          {flag(product.sale_enabled) ? (
            <Text style={styles.actionPill}>{labels.purchase}</Text>
          ) : null}
          {isRental ? <Text style={styles.actionPill}>{labels.rental}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ShopScreen({ onOpenProduct, initialFilters }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { locale, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [condition, setCondition] = useState<ConditionFilter>("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortOptions: Array<{ value: SortMode; label: string }> = useMemo(
    () => [
      { value: "featured", label: t("shop.sortFeatured") },
      { value: "newest", label: t("shop.sortNewest") },
      { value: "price_asc", label: t("shop.sortPriceAsc") },
      { value: "price_desc", label: t("shop.sortPriceDesc") },
      { value: "rating", label: t("shop.sortRating") },
    ],
    [t],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [settingsResult, productsResult, categoriesResult] =
          await Promise.allSettled([
            get<SettingsPayload>("/settings"),
            get<Product[]>("/products?limit=80"),
            get<Category[]>("/categories"),
          ]);

        if (!mounted) return;
        if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
        if (productsResult.status === "fulfilled") setProducts(productsResult.value || []);
        if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value || []);
        if (
          settingsResult.status === "rejected" ||
          productsResult.status === "rejected" ||
          categoriesResult.status === "rejected"
        ) {
          setError(t("shop.partialError"));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : t("home.loadImpossible"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialFilters) return;

    setCondition(initialFilters.condition || "all");
    setAvailability(initialFilters.availability || "all");
    setSort(initialFilters.sort || "featured");
    setQuery(initialFilters.query || "");

    if (!initialFilters.categorySlug) {
      setCategoryId("all");
      return;
    }

    const matchedCategory = categories.find(
      (category) => category.slug === initialFilters.categorySlug,
    );
    setCategoryId(matchedCategory?.id || "all");
  }, [categories, initialFilters]);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";

  const selectedCategoryName =
    categoryId === "all"
      ? t("common.category")
      : categories.find((category) => category.id === categoryId)?.name || t("common.category");
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sort)?.label || t("common.sort");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      if (categoryId !== "all" && product.category_id !== categoryId) return false;
      if (condition !== "all" && product.condition_type !== condition) return false;
      if (availability === "sale" && !flag(product.sale_enabled)) return false;
      if (availability === "rental" && !flag(product.rental_enabled)) return false;
      if (
        availability === "both" &&
        (!flag(product.sale_enabled) || !flag(product.rental_enabled))
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [product.name, product.description, product.category_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });

    return rows.sort((a, b) => {
      if (sort === "newest") {
        const left = a.created_at ? new Date(a.created_at).getTime() : 0;
        const right = b.created_at ? new Date(b.created_at).getTime() : 0;
        return right - left;
      }
      if (sort === "price_asc") return numeric(a.sale_price_eur) - numeric(b.sale_price_eur);
      if (sort === "price_desc") return numeric(b.sale_price_eur) - numeric(a.sale_price_eur);
      if (sort === "rating") return numeric(b.average_rating) - numeric(a.average_rating);
      return Number(flag(b.featured)) - Number(flag(a.featured));
    });
  }, [availability, categoryId, condition, products, query, sort]);

  const handleToggleFavorite = async (productId: number) => {
    setError("");
    try {
      await toggleFavorite(productId);
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : t("shop.favoriteError"),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>{t("shop.title")}</Text>
          <TouchableOpacity style={styles.gridButton}>
            <View style={styles.gridIcon}>
              {[0, 1, 2, 3].map((item) => (
                <View key={item} style={styles.gridDot} />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("shop.searchPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchIconButton}>
              <SearchIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.toolbarButton, filtersOpen ? styles.toolbarButtonActive : null]}
              onPress={() => {
                setFiltersOpen((value) => !value);
                setCategoryDropdownOpen(false);
                setSortDropdownOpen(false);
              }}
            >
              <View style={styles.toolbarButtonContent}>
                <ToolbarIcon type="filters" active={filtersOpen} />
                <Text style={[styles.toolbarButtonText, filtersOpen ? styles.toolbarButtonTextActive : null]}>
                  {t("common.filters")}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolbarButton, categoryDropdownOpen ? styles.toolbarButtonActive : null]}
              onPress={() => {
                setCategoryDropdownOpen((value) => !value);
                setSortDropdownOpen(false);
                setFiltersOpen(false);
              }}
            >
              <View style={styles.toolbarButtonContent}>
                <ToolbarIcon type="category" active={categoryDropdownOpen} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.toolbarButtonText,
                    categoryDropdownOpen ? styles.toolbarButtonTextActive : null,
                  ]}
                >
                  {selectedCategoryName}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolbarButton, sortDropdownOpen ? styles.toolbarButtonActive : null]}
              onPress={() => {
                setSortDropdownOpen((value) => !value);
                setCategoryDropdownOpen(false);
                setFiltersOpen(false);
              }}
            >
              <View style={styles.toolbarButtonContent}>
                <ToolbarIcon type="sort" active={sortDropdownOpen} />
                <Text style={[styles.toolbarButtonText, sortDropdownOpen ? styles.toolbarButtonTextActive : null]}>
                  {sort === "featured" ? t("common.sort") : selectedSortLabel}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {categoryDropdownOpen ? (
            <View style={styles.dropdownPanel}>
              <TouchableOpacity
                style={[styles.dropdownOption, categoryId === "all" ? styles.dropdownOptionActive : null]}
                onPress={() => {
                  setCategoryId("all");
                  setCategoryDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownText, categoryId === "all" ? styles.dropdownTextActive : null]}>
                  {t("shop.allCategories")}
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.dropdownOption,
                    categoryId === category.id ? styles.dropdownOptionActive : null,
                  ]}
                  onPress={() => {
                    setCategoryId(category.id);
                    setCategoryDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      categoryId === category.id ? styles.dropdownTextActive : null,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {sortDropdownOpen ? (
            <View style={styles.dropdownPanel}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownOption, sort === option.value ? styles.dropdownOptionActive : null]}
                  onPress={() => {
                    setSort(option.value);
                    setSortDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownText, sort === option.value ? styles.dropdownTextActive : null]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {filtersOpen ? (
            <View style={styles.filtersPanel}>
              <Text style={styles.filterGroupTitle}>{t("common.categories")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, categoryId === "all" ? styles.chipActive : null]}
                  onPress={() => setCategoryId("all")}
                >
                    <Text style={[styles.chipText, categoryId === "all" ? styles.chipTextActive : null]}>
                      {t("common.all")}
                    </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.chip, categoryId === category.id ? styles.chipActive : null]}
                    onPress={() => setCategoryId(category.id)}
                  >
                    <Text style={[styles.chipText, categoryId === category.id ? styles.chipTextActive : null]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterGroupTitle}>{t("shop.condition")}</Text>
              <View style={styles.segmentRow}>
                {[
                  ["all", t("shop.allStates")],
                  ["new", t("shop.newState")],
                  ["second_hand", t("common.secondHand")],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.segment, condition === value ? styles.segmentActive : null]}
                    onPress={() => setCondition(value as ConditionFilter)}
                  >
                    <Text style={[styles.segmentText, condition === value ? styles.segmentTextActive : null]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterGroupTitle}>{t("shop.availability")}</Text>
              <View style={styles.segmentRow}>
                {[
                  ["all", t("common.all")],
                  ["sale", t("common.purchase")],
                  ["rental", t("common.rental")],
                  ["both", t("shop.both")],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.segment, availability === value ? styles.segmentActive : null]}
                    onPress={() => setAvailability(value as AvailabilityFilter)}
                  >
                    <Text style={[styles.segmentText, availability === value ? styles.segmentTextActive : null]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {loading ? `${t("common.loading")}...` : t("shop.resultCount", { count: filteredProducts.length })}
            </Text>
            <Text style={styles.resultsSubtitle}>
              {t("shop.synced")}
            </Text>
          </View>

          {filteredProducts.length ? (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencyLabel={currencyLabel}
                  locale={locale}
                  labels={{
                    purchase: t("common.purchase"),
                    rental: t("common.rental"),
                    day: t("common.day"),
                    secondHand: t("common.secondHand"),
                    selection: t("common.selection"),
                    catalogue: t("common.catalogue"),
                  }}
                  isFavorite={isFavorite(product.id)}
                  onPress={() => onOpenProduct?.(product.slug)}
                  onToggleFavorite={() => void handleToggleFavorite(product.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {loading ? t("shop.loadingProducts") : t("shop.emptyTitle")}
              </Text>
              <Text style={styles.emptyText}>
                {t("shop.emptyText")}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.soft,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  topbar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    paddingHorizontal: 14,
  },
  topbarTitle: {
    color: "#071846",
    fontSize: 22,
    fontWeight: "900",
  },
  gridButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8",
  },
  gridIcon: {
    width: 18,
    height: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  gridDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#071846",
  },
  content: {
    gap: 14,
    padding: 12,
    paddingBottom: 28,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    color: "#071846",
    paddingHorizontal: 12,
    fontSize: 13,
  },
  searchIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconCanvas: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconCircle: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#071846",
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  searchIconHandle: {
    position: "absolute",
    width: 10,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#071846",
    transform: [{ translateX: 5 }, { translateY: 6 }, { rotate: "45deg" }],
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
  },
  toolbarButton: {
    minHeight: 46,
    maxWidth: 168,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toolbarButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toolbarButtonActive: {
    backgroundColor: "#071846",
    borderColor: "#071846",
  },
  toolbarButtonText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  toolbarButtonTextActive: {
    color: "#FFF",
  },
  toolbarIconCanvas: {
    width: 16,
    height: 16,
    justifyContent: "center",
    gap: 3,
  },
  filterLine: {
    height: 2,
    borderRadius: 999,
  },
  toolbarGridIcon: {
    width: 16,
    height: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  toolbarGridDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  sortLine: {
    width: 14,
    height: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  sortLineShort: {
    width: 14,
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  dropdownPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF",
    padding: 8,
    gap: 5,
    shadowColor: "#071846",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  dropdownOption: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFDF8",
  },
  dropdownOptionActive: {
    backgroundColor: "#071846",
  },
  dropdownText: {
    color: "#071846",
    fontSize: 13,
    fontWeight: "900",
  },
  dropdownTextActive: {
    color: "#FFF",
  },
  filtersPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 12,
    gap: 10,
  },
  filterGroupTitle: {
    color: "#071846",
    fontSize: 13,
    fontWeight: "900",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFDF8",
  },
  chipActive: {
    backgroundColor: "#071846",
    borderColor: "#071846",
  },
  chipText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  chipTextActive: {
    color: "#FFF",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFDF8",
  },
  segmentActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  segmentText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#071846",
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0A21B",
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  errorText: {
    color: "#755300",
    fontWeight: "800",
  },
  resultsHeader: {
    gap: 3,
  },
  resultsCount: {
    color: "#071846",
    fontSize: 20,
    fontWeight: "900",
  },
  resultsSubtitle: {
    color: "#6B665A",
    fontSize: 12,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    width: "48%",
    minWidth: 160,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  productVisual: {
    height: 160,
    backgroundColor: "#DDD5CB",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  productPlaceholderText: {
    color: "#909090",
    fontSize: 26,
    fontWeight: "900",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  favoriteButtonActive: {
    backgroundColor: "#071846",
  },
  favoriteText: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  favoriteTextActive: {
    color: theme.colors.gold,
  },
  badge: {
    position: "absolute",
    left: 8,
    top: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#071846",
    fontSize: 10,
    fontWeight: "900",
  },
  productBody: {
    gap: 5,
    padding: 10,
  },
  productTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  productCategory: {
    flex: 1,
    color: "#70695D",
    fontSize: 11,
    fontWeight: "800",
  },
  rating: {
    color: "#B07800",
    fontSize: 10,
    fontWeight: "900",
  },
  productName: {
    color: "#071846",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  price: {
    color: "#071846",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryPrice: {
    color: "#70695D",
    fontSize: 11,
    fontStyle: "italic",
  },
  rentalPrice: {
    color: "#5F564B",
    fontSize: 11,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 2,
  },
  actionPill: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#F4EDDF",
    color: "#6F4F00",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFFDF8",
    padding: 16,
    gap: 5,
  },
  emptyTitle: {
    color: "#071846",
    fontWeight: "900",
    fontSize: 16,
  },
  emptyText: {
    color: "#6B665A",
    lineHeight: 20,
  },
});
