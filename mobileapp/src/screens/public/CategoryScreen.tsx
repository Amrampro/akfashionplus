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
import { get } from "../../services/api";
import { absoluteImageUrl } from "../../utils/images";

type Category = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  active_product_count?: number | string | null;
};

type Props = {
  onBack?: () => void;
  onOpenCategory?: (slug: string) => void;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function CategoryImage({ category }: { category: Category }) {
  const imageUrl = absoluteImageUrl(category.image_url);
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.categoryImage} />;
  }

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{category.name[0] || "A"}</Text>
    </View>
  );
}

export default function CategoryScreen({ onBack, onOpenCategory }: Props) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setLoading(true);
      setError("");
      try {
        const rows = await get<Category[]>("/categories");
        if (mounted) setCategories(rows || []);
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("categoriesPage.loadError"),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, [t]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return categories
      .filter((category) => {
        if (!normalizedQuery) return true;
        return [category.name, category.slug, category.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => numeric(b.active_product_count) - numeric(a.active_product_count));
  }, [categories, query]);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>{t("categoriesPage.title")}</Text>
          <View style={styles.topbarSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{t("common.catalogue")}</Text>
            <Text style={styles.title}>{t("categoriesPage.heroTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("categoriesPage.heroText")}
            </Text>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("categoriesPage.searchPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.searchInput}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>
              {loading
                ? t("categoriesPage.loading")
                : t("categoriesPage.resultCount", {
                    count: filteredCategories.length,
                  })}
            </Text>
            <Text style={styles.summaryText}>{t("categoriesPage.synced")}</Text>
          </View>

          {filteredCategories.length ? (
            <View style={styles.grid}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.86}
                  style={styles.card}
                  onPress={() => onOpenCategory?.(category.slug)}
                >
                  <CategoryImage category={category} />
                  <View style={styles.cardBody}>
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {category.name}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {t("categoriesPage.articleCount", {
                        count: numeric(category.active_product_count),
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {loading
                  ? t("home.loadingCategories")
                  : t("categoriesPage.emptyTitle")}
              </Text>
              <Text style={styles.emptyText}>
                {t("categoriesPage.emptyText")}
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
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#071846",
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 38,
  },
  topbarTitle: {
    color: "#071846",
    fontSize: 23,
    fontWeight: "900",
  },
  topbarSpacer: {
    width: 42,
  },
  content: {
    padding: 18,
    paddingBottom: 118,
    gap: 18,
  },
  hero: {
    borderRadius: 22,
    backgroundColor: "#071846",
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: "#F5D27C",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#E7EAF3",
    lineHeight: 21,
  },
  searchBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: 16,
  },
  searchInput: {
    minHeight: 54,
    color: "#071846",
    fontSize: 16,
    fontWeight: "700",
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0A0A0",
    backgroundColor: "#FFF1F1",
    padding: 12,
  },
  errorText: {
    color: "#9E1B1B",
    fontWeight: "800",
  },
  summaryRow: {
    gap: 4,
  },
  summaryTitle: {
    color: "#071846",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryText: {
    color: "#6B665A",
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  card: {
    width: "47.8%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    backgroundColor: theme.colors.paper,
  },
  categoryImage: {
    width: "100%",
    height: 118,
    resizeMode: "cover",
    backgroundColor: "#DDD5CB",
  },
  placeholder: {
    height: 118,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  placeholderText: {
    color: "#071846",
    fontSize: 38,
    fontWeight: "900",
  },
  cardBody: {
    padding: 13,
    gap: 6,
  },
  cardTitle: {
    color: "#071846",
    fontSize: 17,
    fontWeight: "900",
  },
  cardMeta: {
    color: "#7A5A00",
    fontWeight: "900",
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFFDF8",
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: "#6B665A",
    lineHeight: 20,
  },
});
