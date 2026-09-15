import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
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
import { useCart, type CartItem } from "../../hooks/useCart";
import { useLanguage } from "../../hooks/useLanguage";
import { get } from "../../services/api";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onBack: () => void;
  onCheckout: () => void;
};

type SettingsPayload = {
  settings?: Array<{ setting_key: string; setting_value: string | null }> | Record<string, string | number | null>;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function settingValue(settings: SettingsPayload["settings"], key: string) {
  if (!settings) return undefined;
  if (Array.isArray(settings)) {
    return settings.find((item) => item.setting_key === key)?.setting_value || undefined;
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

function lineTotal(item: CartItem) {
  if (item.item_type === "rental") {
    return (
      item.quantity *
      (numeric(item.rental_days) * numeric(item.rental_price_per_day_eur || item.unit_price_eur) +
        numeric(item.rental_deposit_eur))
    );
  }

  return item.quantity * item.unit_price_eur;
}

function CartProductImage({ item }: { item: CartItem }) {
  const uri = absoluteImageUrl(item.product_image_url);
  if (uri) return <Image source={{ uri }} style={styles.itemImage} />;
  return (
    <View style={styles.itemImagePlaceholder}>
      <Text style={styles.itemImageText}>{item.product_name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

export default function CartScreen({ onBack, onCheckout }: Props) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { locale, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsPayload>({});

  useEffect(() => {
    get<SettingsPayload>("/settings")
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";
  const exchangeRate = numeric(settingValue(settings.settings, "exchange_rate_eur_to_aoa")) || 1000;
  const total = subtotal;

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>{t("cart.topbar")}</Text>
          <View style={styles.cartIndicator}>
            <Text style={styles.cartIndicatorText}>{items.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{t("cart.topbar")}</Text>
            <Text style={styles.title}>{t("cart.title")}</Text>

            {items.length ? (
              <View style={styles.itemsList}>
                {items.map((item) => (
                  <View key={item.key} style={styles.itemRow}>
                    <CartProductImage item={item} />
                    <View style={styles.itemBody}>
                      <Text numberOfLines={2} style={styles.itemName}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.item_type === "rental" ? t("cart.rentalMode") : t("cart.purchaseMode")}
                        {item.size ? ` - ${item.size}` : ""}
                        {item.color ? ` - ${item.color}` : ""}
                      </Text>
                      {item.item_type === "rental" ? (
                        <Text style={styles.itemMeta}>
                          {item.rental_days || 1} {t("common.days")}, {t("cart.deposit").toLowerCase()}{" "}
                          {formatEur(numeric(item.rental_deposit_eur), locale)}
                        </Text>
                      ) : null}
                      <Text style={styles.itemPrice}>{formatEur(lineTotal(item), locale)}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepButton}
                          onPress={() => updateQuantity(item.key, item.quantity - 1)}
                        >
                          <Text style={styles.stepText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepButton}
                          onPress={() => updateQuantity(item.key, item.quantity + 1)}
                        >
                          <Text style={styles.stepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => removeItem(item.key)}>
                        <Text style={styles.removeText}>{t("cart.remove")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t("cart.emptyTitle")}</Text>
                <Text style={styles.emptyText}>{t("cart.emptyText")}</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t("common.total")}</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>{t("common.subtotal")}</Text>
              <Text style={styles.summaryValue}>{formatEur(subtotal, locale)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryLine}>
              <Text style={styles.totalLabel}>{t("common.total")}</Text>
              <View style={styles.totalBlock}>
                <Text style={styles.totalValue}>{formatEur(total, locale)}</Text>
                <Text style={styles.secondaryTotal}>
                  {formatSecondary(total * exchangeRate, currencyLabel, locale)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, !items.length ? styles.checkoutButtonDisabled : null]}
              onPress={onCheckout}
              disabled={!items.length}
            >
              <Text style={styles.checkoutButtonText}>{t("cart.checkout")}</Text>
            </TouchableOpacity>
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
  topbar: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#071846",
    fontSize: 32,
    lineHeight: 34,
  },
  topbarTitle: {
    color: "#071846",
    fontSize: 16,
    fontWeight: "900",
  },
  cartIndicator: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.gold,
  },
  cartIndicatorText: {
    color: "#071846",
    fontWeight: "900",
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
  },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#071846",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    paddingBottom: 12,
  },
  itemImage: {
    width: 74,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#DDD5CB",
  },
  itemImagePlaceholder: {
    width: 74,
    height: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  itemImageText: {
    color: "#8A8374",
    fontWeight: "900",
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: "#071846",
    fontSize: 14,
    fontWeight: "900",
  },
  itemMeta: {
    color: "#665F54",
    fontSize: 11,
  },
  itemPrice: {
    color: "#071846",
    fontSize: 13,
    fontWeight: "900",
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
  },
  stepButton: {
    width: 26,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E7",
  },
  stepText: {
    color: "#071846",
    fontWeight: "900",
  },
  quantity: {
    minWidth: 24,
    textAlign: "center",
    color: "#071846",
    fontWeight: "900",
  },
  removeText: {
    color: "#A32323",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    borderRadius: 14,
    backgroundColor: "#FFF8E7",
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    color: "#071846",
    fontWeight: "900",
  },
  emptyText: {
    color: "#665F54",
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  summaryTitle: {
    color: "#071846",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  summaryLabel: {
    color: "#1D1D1B",
  },
  summaryValue: {
    color: "#071846",
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.line,
  },
  totalLabel: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  totalBlock: {
    alignItems: "flex-end",
  },
  totalValue: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryTotal: {
    color: "#665F54",
    fontSize: 12,
  },
  checkoutButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  checkoutButtonDisabled: {
    opacity: 0.45,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
});
