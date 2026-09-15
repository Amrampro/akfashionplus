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
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { get } from "../../services/api";
import { getNotifications } from "../../services/notification.service";
import { absoluteImageUrl } from "../../utils/images";
import type { ShopInitialFilters } from "./ShopScreen";

type BottomTab = "home" | "products" | "cart" | "favorites" | "account";

type Props = {
  onOpenCart?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenProduct?: (slug: string) => void;
  onOpenShop?: (filters?: ShopInitialFilters) => void;
  onOpenCategories?: () => void;
  onOpenGiftCards?: () => void;
};

type Product = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
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
  slug: string;
  name: string;
  image_url?: string | null;
  active_product_count?: number | string | null;
};

type GiftCardType = {
  id: number;
  name: string;
  value_eur?: number | string | null;
};

type SettingRow = {
  setting_key: string;
  setting_value: string | null;
};

type NotificationRow = {
  id: number;
  is_read?: boolean | number | null;
};

type SettingsPayload = {
  settings?: SettingRow[] | Record<string, string | number | null>;
  exchange_rate_eur_to_aoa?: number | string | null;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function flag(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function settingValue(
  settings: SettingsPayload["settings"],
  key: string,
): string | undefined {
  if (!settings) return undefined;
  if (Array.isArray(settings)) {
    return (
      settings.find((item) => item.setting_key === key)?.setting_value ||
      undefined
    );
  }
  const value = settings[key];
  return value === null || value === undefined ? undefined : String(value);
}

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatSecondary(value: number, label: string, locale: string) {
  return `${Math.round(value).toLocaleString(locale)} ${label}`;
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function fullName(user: { first_name?: string | null; last_name?: string | null; name?: string | null; email?: string | null } | null) {
  if (!user) return "";
  const composed = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return user.name || composed || user.email || "";
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AK"
  );
}

function normalizeNotifications(payload: unknown): NotificationRow[] {
  if (Array.isArray(payload)) return payload as NotificationRow[];
  if (payload && typeof payload === "object" && "rows" in payload) {
    const rows = (payload as { rows?: unknown }).rows;
    return Array.isArray(rows) ? (rows as NotificationRow[]) : [];
  }
  return [];
}

function HeaderIcon({ type }: { type: "bell" | "cart" }) {
  return (
    <View style={styles.headerIconShape}>
      {type === "bell" ? (
        <>
          <View style={styles.bellDome} />
          <View style={styles.bellBody} />
          <View style={styles.bellClapper} />
        </>
      ) : (
        <>
          <View style={styles.cartHandle} />
          <View style={styles.cartBasket} />
          <View style={styles.cartWheels}>
            <View style={styles.cartWheel} />
            <View style={styles.cartWheel} />
          </View>
        </>
      )}
    </View>
  );
}

function TabIcon({ tab, active }: { tab: BottomTab; active: boolean }) {
  const tint = active ? theme.colors.gold : "#071846";
  if (tab === "home") {
    return (
      <View style={styles.tabIconCanvas}>
        <View style={[styles.homeRoof, { borderBottomColor: tint }]} />
        <View style={[styles.homeBase, { borderColor: tint }]} />
      </View>
    );
  }
  if (tab === "products") {
    return (
      <View style={styles.productsIcon}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.productsDot, { borderColor: tint }]} />
        ))}
      </View>
    );
  }
  if (tab === "cart") {
    return (
      <View style={styles.tabIconCanvas}>
        <View style={[styles.tabCartHandle, { borderColor: tint }]} />
        <View style={[styles.tabCartBasket, { borderColor: tint }]} />
        <View style={styles.tabCartWheels}>
          <View style={[styles.tabCartWheel, { backgroundColor: tint }]} />
          <View style={[styles.tabCartWheel, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }
  if (tab === "favorites") {
    return (
      <View style={styles.tabIconCanvas}>
        <View style={[styles.heartLeft, { backgroundColor: tint }]} />
        <View style={[styles.heartRight, { backgroundColor: tint }]} />
        <View style={[styles.heartBottom, { backgroundColor: tint }]} />
      </View>
    );
  }
  return (
    <View style={styles.tabIconCanvas}>
      <View style={[styles.userHead, { borderColor: tint }]} />
      <View style={[styles.userBody, { borderColor: tint }]} />
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} disabled={!onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProductImage({ product }: { product: Product }) {
  const imageUrl = absoluteImageUrl(product.image_url);
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.productImage} />;
  }
  return (
    <View style={styles.productPlaceholder}>
      <Text style={styles.productInitials}>
        {product.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </Text>
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
  locale,
  labels,
  compact = false,
  onPress,
}: {
  product: Product;
  currencyLabel: string;
  locale: string;
  labels: {
    catalogue: string;
    day: string;
    rental: string;
    secondHand: string;
    selection: string;
  };
  compact?: boolean;
  onPress?: () => void;
}) {
  const salePrice = numeric(product.sale_price_eur);
  const secondary = numeric(product.sale_price_aoa);
  const rentalPrice = numeric(product.rental_price_per_day_eur);
  const rating = numeric(product.average_rating);
  const isSecondHand = product.condition_type === "second_hand";

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[styles.productCard, compact ? styles.productCardCompact : null]}
      onPress={onPress}
    >
      <View style={styles.productVisual}>
        <ProductImage product={product} />
        {product.featured || isSecondHand ? (
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>
              {isSecondHand ? labels.secondHand : labels.selection}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productCategory}>
          {product.category_name || labels.catalogue}
        </Text>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>
        <View style={styles.productMetaRow}>
          <Text style={styles.productPrice}>{formatEur(salePrice, locale)}</Text>
          <Text style={styles.productRating}>{rating.toFixed(1)} / 5</Text>
        </View>
        <Text style={styles.productAoa}>
          {formatSecondary(secondary, currencyLabel, locale)}
        </Text>
        {flag(product.rental_enabled) && rentalPrice > 0 ? (
          <Text style={styles.productRental}>
            {labels.rental} {formatEur(rentalPrice, locale)} / {labels.day}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({
  onOpenCart,
  onOpenNotifications,
  onOpenProfile,
  onOpenProduct,
  onOpenShop,
  onOpenCategories,
  onOpenGiftCards,
}: Props) {
  const { user } = useAuth();
  const { count } = useCart();
  const { locale, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [giftCardTypes, setGiftCardTypes] = useState<GiftCardType[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      setLoading(true);
      setLoadError("");
      try {
        const [settingsResult, productsResult, categoriesResult, giftCardsResult] =
          await Promise.allSettled([
            get<SettingsPayload>("/settings"),
            get<Product[]>("/products?limit=30"),
            get<Category[]>("/categories"),
            get<GiftCardType[]>("/gift-cards/types"),
          ]);

        if (!mounted) return;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value);
        }
        if (productsResult.status === "fulfilled") {
          setProducts(productsResult.value || []);
        }
        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value || []);
        }
        if (giftCardsResult.status === "fulfilled") {
          setGiftCardTypes(giftCardsResult.value || []);
        }

        const failed = [
          settingsResult,
          productsResult,
          categoriesResult,
          giftCardsResult,
        ].some((result) => result.status === "rejected");
        if (failed) {
          setLoadError(t("home.loadPartialError"));
        }
      } catch (error) {
        if (mounted) {
          setLoadError(
            error instanceof Error ? error.message : t("home.loadImpossible"),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      mounted = false;
    };
  }, [t]);

  useEffect(() => {
    let mounted = true;

    async function loadUnreadCount() {
      if (!user) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const result = await getNotifications<unknown>();
        if (!mounted) return;
        const rows = normalizeNotifications(result);
        setUnreadNotifications(
          rows.filter((item) => item.is_read !== true && item.is_read !== 1).length,
        );
      } catch {
        if (mounted) setUnreadNotifications(0);
      }
    }

    loadUnreadCount();
    return () => {
      mounted = false;
    };
  }, [user]);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";

  const exchangeRate =
    numeric(settings.exchange_rate_eur_to_aoa) ||
    numeric(settingValue(settings.settings, "exchange_rate_eur_to_aoa"));
  const effectiveExchangeRate = exchangeRate || 1000;

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => flag(product.featured));
    return (featured.length ? featured : products).slice(0, 6);
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const left = a.created_at ? new Date(a.created_at).getTime() : 0;
        const right = b.created_at ? new Date(b.created_at).getTime() : 0;
        return right - left;
      })
      .slice(0, 4);
  }, [products]);

  const rentalProducts = products
    .filter((product) => flag(product.rental_enabled))
    .slice(0, 4);
  const secondHandProducts = products
    .filter((product) => product.condition_type === "second_hand")
    .slice(0, 3);
  const heroProduct = featuredProducts[0] || products[0];
  const profileName = fullName(user);
  const profileAvatar = absoluteImageUrl(user?.avatar_url);

  const openSearchResults = () => {
    const query = searchQuery.trim();
    onOpenShop?.(query ? { query } : undefined);
  };

  const quickUnivers: Array<{
    title: string;
    subtitle: string;
    tone: string;
    filters?: ShopInitialFilters;
    giftCards?: boolean;
  }> = [
    {
      title: t("common.new"),
      subtitle: t("home.articleCount", { count: recentProducts.length }),
      tone: "#4A3207",
      filters: { sort: "newest" as const },
    },
    {
      title: t("common.secondHand"),
      subtitle: t("home.articleCount", { count: secondHandProducts.length }),
      tone: "#1B2A43",
      filters: { condition: "second_hand" as const },
    },
    {
      title: t("common.rental"),
      subtitle: t("home.articleCount", { count: rentalProducts.length }),
      tone: "#071846",
      filters: { availability: "rental" as const },
    },
    {
      title: t("common.giftCards"),
      subtitle: t("home.modelCount", { count: giftCardTypes.length }),
      tone: "#161616",
      giftCards: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.appTopbar}>
          <View style={styles.brandBlock}>
            <Text style={styles.logoAk}>AK</Text>
            <View>
              <Text style={styles.brandName}>AK Fashion Plus</Text>
              <Text style={styles.brandTagline}>Style. Quality. You.</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
              <HeaderIcon type="bell" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onOpenCart}>
              <HeaderIcon type="cart" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={onOpenProfile}>
              {profileAvatar ? (
                <Image source={{ uri: profileAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials(profileName)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loadError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{loadError}</Text>
            </View>
          ) : null}

          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={openSearchResults}
              returnKeyType="search"
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.searchInput}
            />
            <TouchableOpacity
              accessibilityLabel={t("home.searchPlaceholder")}
              style={styles.filterButton}
              onPress={openSearchResults}
            >
              <SearchIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>
                {heroProduct?.category_name || t("home.heroFallbackBrand")}
              </Text>
              <Text style={styles.heroTitle}>
                {heroProduct?.name || t("home.heroFallbackCatalogue")}
              </Text>
              <Text numberOfLines={3} style={styles.heroText}>
                {heroProduct?.description ||
                  t("home.productsFromBackend")}
              </Text>
              {heroProduct ? (
                <Text style={styles.heroPrice}>
                  {formatEur(numeric(heroProduct.sale_price_eur), locale)}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => heroProduct?.slug && onOpenProduct?.(heroProduct.slug)}
              >
                <Text style={styles.heroButtonText}>{t("home.discover")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroModel}>
              {heroProduct?.image_url ? (
                <Image
                  source={{ uri: absoluteImageUrl(heroProduct.image_url) }}
                  style={styles.heroImage}
                />
              ) : (
                <Text style={styles.heroModelText}>AK</Text>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickList}
          >
            {quickUnivers.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.quickCard, { backgroundColor: item.tone }]}
                onPress={() =>
                  item.giftCards
                    ? onOpenGiftCards?.()
                    : onOpenShop?.(item.filters)
                }
              >
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View>
            <SectionHeader
              title={t("home.categories")}
              action={t("home.allCategories")}
              onAction={onOpenCategories}
            />
            {categories.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => onOpenShop?.({ categorySlug: category.slug })}
                  >
                    <View style={styles.categoryAvatar}>
                      {category.image_url ? (
                        <Image
                          source={{ uri: absoluteImageUrl(category.image_url) }}
                          style={styles.categoryImage}
                        />
                      ) : (
                        <Text style={styles.categoryInitial}>
                          {category.name[0]}
                        </Text>
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.categoryLabel}>
                      {category.name}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {numeric(category.active_product_count)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                text={
                  loading
                    ? t("home.loadingCategories")
                    : t("home.emptyCategories")
                }
              />
            )}
          </View>

          <View>
            <SectionHeader
              title={t("common.new")}
              action={t("common.viewAll")}
              onAction={() => onOpenShop?.({ sort: "newest" })}
            />
            {recentProducts.length ? (
              <View style={styles.productGrid}>
                {recentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currencyLabel={currencyLabel}
                    locale={locale}
                    labels={{
                      catalogue: t("common.catalogue"),
                      day: t("common.day"),
                      rental: t("common.rental"),
                      secondHand: t("common.secondHand"),
                      selection: t("common.selection"),
                    }}
                    onPress={() => onOpenProduct?.(product.slug)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                text={
                  loading
                    ? t("home.loadingProducts")
                    : t("home.emptyRecentProducts")
                }
              />
            )}
          </View>

          <View>
            <SectionHeader title={t("home.featuredTitle")} />
            {featuredProducts.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProducts}
              >
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    compact
                    product={product}
                    currencyLabel={currencyLabel}
                    locale={locale}
                    labels={{
                      catalogue: t("common.catalogue"),
                      day: t("common.day"),
                      rental: t("common.rental"),
                      secondHand: t("common.secondHand"),
                      selection: t("common.selection"),
                    }}
                    onPress={() => onOpenProduct?.(product.slug)}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState text={t("home.emptyFeatured")} />
            )}
          </View>

          <View style={styles.rentalSection}>
            <View>
              <Text style={styles.darkEyebrow}>{t("common.rental")}</Text>
              <Text style={styles.darkTitle}>{t("home.rentalTitle")}</Text>
              <Text style={styles.darkText}>
                {t("home.rentalBackendText")}
              </Text>
            </View>
            {rentalProducts.length ? (
              rentalProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.rentalRow}
                  onPress={() => onOpenProduct?.(product.slug)}
                >
                  <Text numberOfLines={1} style={styles.rentalRowName}>
                    {product.name}
                  </Text>
                  <Text style={styles.rentalRowPrice}>
                    {formatEur(numeric(product.rental_price_per_day_eur), locale)} / {t("common.day")}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.darkEmpty}>{t("home.emptyRental")}</Text>
            )}
          </View>

          <View>
            <SectionHeader
              title={t("home.secondHandTitle")}
              action={t("common.viewAll")}
              onAction={() => onOpenShop?.({ condition: "second_hand" })}
            />
            {secondHandProducts.length ? (
              secondHandProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.secondHandCard}
                  onPress={() => onOpenProduct?.(product.slug)}
                >
                  <View style={styles.secondHandVisual}>
                    <ProductImage product={product} />
                  </View>
                  <View style={styles.secondHandBody}>
                    <Text style={styles.secondHandBadge}>{t("common.secondHand")}</Text>
                    <Text numberOfLines={2} style={styles.secondHandTitle}>
                      {product.name}
                    </Text>
                    <Text style={styles.secondHandPrice}>
                      {formatEur(numeric(product.sale_price_eur), locale)}
                    </Text>
                    <Text style={styles.productAoa}>
                      {formatSecondary(
                        numeric(product.sale_price_aoa),
                        currencyLabel,
                        locale,
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState text={t("home.emptySecondHand")} />
            )}
          </View>

          <View>
            <SectionHeader
              title={t("home.giftCardsTitle")}
              action={t("home.giftCardsAction")}
              onAction={onOpenGiftCards}
            />
            {giftCardTypes.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.giftList}
              >
                {giftCardTypes.map((card) => (
                  <View key={card.id} style={styles.giftCard}>
                    <View style={styles.giftTop}>
                      <Text style={styles.giftLogo}>AK</Text>
                      <Text style={styles.giftChip}>{t("home.giftCardChip")}</Text>
                    </View>
                    <Text style={styles.giftName}>{card.name}</Text>
                    <Text style={styles.giftValue}>
                      {formatEur(numeric(card.value_eur), locale)}
                    </Text>
                    <Text style={styles.giftAoa}>
                      {formatSecondary(
                        numeric(card.value_eur) * effectiveExchangeRate,
                        currencyLabel,
                        locale,
                      )}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <EmptyState text={t("home.emptyGiftCards")} />
            )}
          </View>
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
  appTopbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoAk: {
    color: "#C89212",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
  brandName: {
    color: "#071846",
    fontSize: 14,
    fontWeight: "900",
  },
  brandTagline: {
    color: "#756C5B",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8",
  },
  headerIconShape: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDome: {
    width: 12,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#071846",
  },
  bellBody: {
    width: 16,
    height: 8,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#071846",
  },
  bellClapper: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#071846",
    marginTop: 1,
  },
  cartHandle: {
    width: 11,
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#071846",
    transform: [{ rotate: "-8deg" }],
  },
  cartBasket: {
    width: 17,
    height: 10,
    borderWidth: 2,
    borderColor: "#071846",
    borderRadius: 3,
  },
  cartWheels: {
    width: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cartWheel: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#071846",
  },
  notificationBadge: {
    position: "absolute",
    right: -3,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CF1F28",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  cartBadge: {
    position: "absolute",
    right: -3,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: {
    color: theme.colors.gold,
    fontWeight: "900",
  },
  content: {
    gap: 18,
    padding: 14,
    paddingBottom: 24,
  },
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0A21B",
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  noticeText: {
    color: "#755300",
    fontWeight: "800",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    color: "#071846",
    paddingHorizontal: 14,
    fontSize: 13,
  },
  filterButton: {
    minWidth: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  searchIconCanvas: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconCircle: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#FFF",
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  searchIconHandle: {
    position: "absolute",
    width: 10,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#FFF",
    transform: [{ translateX: 5 }, { translateY: 6 }, { rotate: "45deg" }],
  },
  hero: {
    height: 188,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#071846",
  },
  heroCopy: {
    flex: 1.2,
    justifyContent: "center",
    gap: 6,
    padding: 16,
  },
  heroEyebrow: {
    color: "#F5D27C",
    fontSize: 11,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
  },
  heroText: {
    color: "#E7EAF3",
    fontSize: 12,
    lineHeight: 18,
  },
  heroPrice: {
    color: "#F5D27C",
    fontSize: 16,
    fontWeight: "900",
  },
  heroButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroButtonText: {
    color: "#071846",
    fontWeight: "900",
    fontSize: 12,
  },
  heroModel: {
    flex: 0.72,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173E91",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroModelText: {
    color: "#F5D27C",
    fontSize: 52,
    fontWeight: "900",
  },
  quickList: {
    gap: 10,
    paddingRight: 14,
  },
  quickCard: {
    width: 138,
    minHeight: 86,
    borderRadius: 16,
    justifyContent: "flex-end",
    padding: 12,
  },
  quickTitle: {
    color: "#FFF",
    fontWeight: "900",
  },
  quickSubtitle: {
    color: "#E6DFD3",
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#071846",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionAction: {
    color: "#7A5A00",
    fontSize: 12,
    fontWeight: "900",
  },
  categoryList: {
    gap: 13,
    paddingRight: 14,
  },
  categoryItem: {
    alignItems: "center",
    gap: 6,
    width: 74,
  },
  categoryAvatar: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7D8B9",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryInitial: {
    color: "#071846",
    fontWeight: "900",
  },
  categoryLabel: {
    color: "#3E392F",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  categoryCount: {
    color: "#8A6A13",
    fontSize: 10,
    fontWeight: "900",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  horizontalProducts: {
    gap: 12,
    paddingRight: 14,
  },
  productCard: {
    width: "48%",
    minWidth: 164,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  productCardCompact: {
    width: 178,
  },
  productVisual: {
    height: 128,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DDD5CB",
  },
  productBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  productBadgeText: {
    color: "#071846",
    fontSize: 10,
    fontWeight: "900",
  },
  productInitials: {
    color: "#8E8D8A",
    fontSize: 30,
    fontWeight: "900",
  },
  productBody: {
    gap: 5,
    padding: 12,
  },
  productCategory: {
    color: "#6B665A",
    fontSize: 11,
    fontWeight: "800",
  },
  productName: {
    color: "#071846",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900",
  },
  productMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  productPrice: {
    color: "#071846",
    fontWeight: "900",
  },
  productRating: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
  },
  productAoa: {
    color: "#70695D",
    fontSize: 11,
    fontStyle: "italic",
  },
  productRental: {
    color: "#5F564B",
    fontSize: 11,
  },
  rentalSection: {
    borderRadius: 18,
    backgroundColor: "#071846",
    padding: 16,
    gap: 12,
  },
  darkEyebrow: {
    color: "#F5D27C",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  darkTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },
  darkText: {
    color: "#E7EAF3",
    lineHeight: 19,
    marginTop: 4,
  },
  darkEmpty: {
    color: "#E7EAF3",
    fontWeight: "800",
  },
  rentalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
    paddingTop: 10,
    gap: 10,
  },
  rentalRowName: {
    flex: 1,
    color: "#FFF",
    fontWeight: "800",
  },
  rentalRowPrice: {
    color: "#F5D27C",
    fontWeight: "900",
  },
  secondHandCard: {
    flexDirection: "row",
    height: 148,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    backgroundColor: theme.colors.paper,
    marginBottom: 10,
  },
  secondHandVisual: {
    width: 112,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  secondHandBody: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
    padding: 14,
  },
  secondHandBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#FFF0C2",
    color: "#7A5A00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "900",
  },
  secondHandTitle: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  secondHandPrice: {
    color: "#071846",
    fontSize: 17,
    fontWeight: "900",
  },
  giftList: {
    gap: 12,
    paddingRight: 14,
  },
  giftCard: {
    width: 230,
    height: 132,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "#111827",
  },
  giftTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  giftLogo: {
    color: "#F5D27C",
    fontSize: 24,
    fontWeight: "900",
  },
  giftChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.44)",
    borderRadius: 8,
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  giftName: {
    color: "#FFF",
    fontSize: 21,
    fontWeight: "900",
  },
  giftValue: {
    color: "#F5D27C",
    fontSize: 18,
    fontWeight: "900",
  },
  giftAoa: {
    color: "#E6DFD3",
    fontSize: 11,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFFDF8",
    padding: 14,
  },
  emptyText: {
    color: "#5F564B",
    fontWeight: "800",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: "#FFF",
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  bottomItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 58,
  },
  bottomIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EDDF",
  },
  bottomIconActive: {
    backgroundColor: "#071846",
  },
  tabIconCanvas: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  homeBase: {
    width: 14,
    height: 11,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  productsIcon: {
    width: 19,
    height: 19,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  productsDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 2,
  },
  tabCartHandle: {
    width: 11,
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    transform: [{ rotate: "-8deg" }],
  },
  tabCartBasket: {
    width: 17,
    height: 10,
    borderWidth: 2,
    borderRadius: 3,
  },
  tabCartWheels: {
    width: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  tabCartWheel: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  heartLeft: {
    position: "absolute",
    top: 4,
    left: 5,
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  heartRight: {
    position: "absolute",
    top: 4,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  heartBottom: {
    position: "absolute",
    top: 9,
    width: 13,
    height: 13,
    transform: [{ rotate: "45deg" }],
    borderBottomRightRadius: 2,
  },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 2,
  },
  userBody: {
    width: 17,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2,
    borderBottomWidth: 0,
    marginTop: 2,
  },
  bottomLabel: {
    color: "#5F564B",
    fontSize: 10,
    fontWeight: "800",
  },
  bottomLabelActive: {
    color: "#071846",
    fontWeight: "900",
  },
});
