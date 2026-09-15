import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { getFavorites } from "../../services/favorite.service";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onOpenProduct: (slug: string) => void;
};

type FavoriteProduct = {
  id: number;
  product_id?: number;
  slug?: string | null;
  name?: string | null;
  category_name?: string | null;
  condition_type?: string | null;
  sale_enabled?: boolean | number | null;
  sale_price_eur?: number | string | null;
  rental_enabled?: boolean | number | null;
  rental_price_per_day_eur?: number | string | null;
  featured?: boolean | number | null;
  status?: string | null;
  image_url?: string | null;
  average_rating?: number | string | null;
  total_reviews?: number | string | null;
  created_at?: string | null;
};

function normalizeList(payload: unknown): FavoriteProduct[] {
  if (Array.isArray(payload)) return payload as FavoriteProduct[];
  if (payload && typeof payload === "object" && "rows" in payload) {
    const rows = (payload as { rows?: unknown }).rows;
    return Array.isArray(rows) ? (rows as FavoriteProduct[]) : [];
  }
  return [];
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function ProductImage({ product }: { product: FavoriteProduct }) {
  const imageUrl = absoluteImageUrl(product.image_url);
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.productImage} />;
  }
  return (
    <View style={styles.productPlaceholder}>
      <Text style={styles.productPlaceholderText}>
        {(product.name || "AK")
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </Text>
    </View>
  );
}

export default function FavoritesScreen({ onBack, onLogin, onOpenProduct }: Props) {
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoadingRows(true);
    setError("");
    try {
      const result = await getFavorites<unknown>();
      setFavorites(normalizeList(result));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("favoritesPage.loadError"),
      );
    } finally {
      setLoadingRows(false);
    }
  }, [t, user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerScreen}>
          <ActivityIndicator color="#071846" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" />
        <View style={styles.screen}>
          <View style={styles.guestCard}>
            <Text style={styles.title}>{t("favoritesPage.title")}</Text>
            <Text style={styles.body}>{t("favoritesPage.guestText")}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
              <Text style={styles.primaryButtonText}>{t("common.login")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t("favoritesPage.eyebrow")}</Text>
              <Text style={styles.title}>{t("favoritesPage.title")}</Text>
              <Text style={styles.body}>
                {t("favoritesPage.savedCount", { count: favorites.length })}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={loadFavorites}>
            <Text style={styles.secondaryButtonText}>{t("common.refresh")}</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loadingRows ? (
            <View style={styles.centerInline}>
              <ActivityIndicator color="#071846" />
              <Text style={styles.body}>{t("favoritesPage.loading")}</Text>
            </View>
          ) : favorites.length ? (
            <View style={styles.grid}>
              {favorites.map((product, index) => (
                <TouchableOpacity
                  key={`${product.id}-${product.product_id || product.slug}-${index}`}
                  style={styles.productCard}
                  onPress={() => product.slug && onOpenProduct(product.slug)}
                  activeOpacity={product.slug ? 0.84 : 1}
                >
                  <View style={styles.productVisual}>
                    <ProductImage product={product} />
                    <View style={styles.favoriteBadge}>
                      <Text style={styles.favoriteBadgeText}>{t("favoritesPage.badge")}</Text>
                    </View>
                  </View>
                  <View style={styles.productBody}>
                    <View style={styles.metaRow}>
                      <Text numberOfLines={1} style={styles.categoryText}>
                        {product.category_name || t("common.catalogue")}
                      </Text>
                      <Text style={styles.ratingText}>
                        {numeric(product.average_rating).toFixed(1)} / 5
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={styles.productName}>
                      {product.name || t("favoritesPage.fallbackProduct")}
                    </Text>
                    <Text style={styles.priceText}>
                      {formatEur(numeric(product.sale_price_eur), locale)}
                    </Text>
                    {product.rental_enabled ? (
                      <Text style={styles.rentalText}>
                        {t("common.rental")} {formatEur(numeric(product.rental_price_per_day_eur), locale)} / {t("common.day")}
                      </Text>
                    ) : null}
                    <View style={styles.badgeRow}>
                      {product.condition_type === "second_hand" ? (
                        <Text style={styles.softBadge}>{t("common.secondHand")}</Text>
                      ) : null}
                      {product.featured ? (
                        <Text style={styles.softBadge}>{t("common.selection")}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t("favoritesPage.emptyTitle")}</Text>
              <Text style={styles.body}>{t("favoritesPage.emptyText")}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.soft,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.soft,
  },
  content: { gap: 14, padding: 16, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerCopy: { flex: 1 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  backText: { color: "#071846", fontSize: 34, lineHeight: 36 },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: { color: "#071846", fontSize: 36, lineHeight: 40, fontWeight: "900" },
  body: { color: "#665F54", lineHeight: 21 },
  guestCard: {
    margin: 16,
    padding: 18,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryButtonText: { color: "#FFF", fontWeight: "900" },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.gold,
    backgroundColor: "#FFFDF8",
  },
  secondaryButtonText: { color: "#071846", fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCard: {
    width: "48%",
    minWidth: 154,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  productVisual: {
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  productPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  productPlaceholderText: { color: "#8E8D8A", fontSize: 28, fontWeight: "900" },
  favoriteBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  favoriteBadgeText: { color: "#071846", fontSize: 10, fontWeight: "900" },
  productBody: { gap: 6, padding: 12 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  categoryText: { flex: 1, color: "#6B665A", fontSize: 11, fontWeight: "800" },
  ratingText: { color: "#B07800", fontSize: 11, fontWeight: "900" },
  productName: { color: "#071846", fontSize: 15, lineHeight: 19, fontWeight: "900" },
  priceText: { color: "#071846", fontSize: 17, fontWeight: "900" },
  rentalText: { color: "#5F564B", fontSize: 11 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  softBadge: {
    borderRadius: 999,
    backgroundColor: "#F4EDDF",
    color: "#745400",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  centerInline: {
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 24,
  },
  emptyState: {
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFFDF8",
    padding: 18,
  },
  emptyTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2A7A7",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: { color: "#9B1010", fontWeight: "800" },
});
