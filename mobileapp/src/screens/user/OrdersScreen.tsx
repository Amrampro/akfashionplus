import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { getOrders } from "../../services/order.service";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onOpenOrder: (id: number) => void;
};

type OrderItem = {
  product_name?: string;
  product_image_url?: string | null;
  image_url?: string | null;
};

type Order = {
  id?: number;
  order_number?: string;
  reference?: string;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_method?: string | null;
  delivery_method?: string | null;
  beneficiary_name?: string | null;
  total_eur?: number | string | null;
  total_aoa?: number | string | null;
  resale_value_aoa?: number | string | null;
  resale_payout_amount_aoa?: number | string | null;
  resale_items_count?: number | string | null;
  resell_to_company?: boolean | number | null;
  resale_requested?: boolean | number | null;
  created_at?: string | null;
  items?: OrderItem[];
};

type Filter = "all" | "paid" | "pending" | "resale" | "rental";

function normalizeArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as T[];
  }
  if (Array.isArray(data.data)) return data.data as T[];
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

function formatKwanza(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value)} Kwanza`;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isResale(order: Order) {
  return Boolean(
    order.resell_to_company ||
      order.resale_requested ||
      numeric(order.resale_items_count) > 0 ||
      numeric(order.resale_payout_amount_aoa) > 0 ||
      numeric(order.resale_value_aoa) > 0,
  );
}

function resaleAmount(order: Order) {
  return numeric(order.resale_payout_amount_aoa || order.resale_value_aoa);
}

function firstImage(order: Order) {
  const item = order.items?.[0];
  return absoluteImageUrl(item?.product_image_url || item?.image_url || null);
}

function statusLabel(status: string | null | undefined, t: (key: string) => string) {
  const labels: Record<string, string> = {
    pending: t("orderDetails.statusPending"),
    pending_payment: t("orderDetails.statusPendingPayment"),
    confirmed: t("orderDetails.statusConfirmed"),
    processing: t("orderDetails.statusProcessing"),
    preparing: t("orderDetails.statusPreparing"),
    ready_for_pickup: t("orderDetails.statusReadyPickup"),
    shipped: t("orderDetails.statusShipped"),
    delivered: t("orderDetails.statusDelivered"),
    completed: t("orderDetails.statusCompleted"),
    cancelled: t("orderDetails.statusCancelled"),
    canceled: t("orderDetails.statusCancelled"),
    paid: t("orderDetails.statusPaid"),
    unpaid: t("orderDetails.statusUnpaid"),
    partially_paid: t("orderDetails.statusPartiallyPaid"),
    failed: t("orderDetails.statusFailed"),
    succeeded: t("orderDetails.statusSucceeded"),
    refunded: t("orderDetails.statusRefunded"),
    partially_refunded: t("orderDetails.statusPartiallyRefunded"),
    reserved: t("orderDetails.statusReserved"),
    return_due: t("orderDetails.statusReturnDue"),
    returned: t("orderDetails.statusReturned"),
  };
  return labels[String(status || "").toLowerCase()] || status || "-";
}

export default function OrdersScreen({ onBack, onLogin, onOpenOrder }: Props) {
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    async function loadOrders() {
      setDataLoading(true);
      setError("");
      try {
        const result = await getOrders();
        if (mounted) setOrders(normalizeArray<Order>(result, ["orders"]));
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : t("ordersPage.loadError"),
          );
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [t, user]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => {
        const left = a.created_at ? new Date(a.created_at).getTime() : 0;
        const right = b.created_at ? new Date(b.created_at).getTime() : 0;
        return right - left;
      })
      .filter((order) => {
        if (filter === "paid" && order.payment_status !== "paid") return false;
        if (filter === "pending" && order.payment_status === "paid") return false;
        if (filter === "resale" && !isResale(order)) return false;
        if (
          filter === "rental" &&
          !order.items?.some((item) =>
            String(item.product_name || "").toLowerCase().includes("location"),
          ) &&
          !String(order.fulfillment_method || order.delivery_method || "")
            .toLowerCase()
            .includes("rental")
        ) {
          return false;
        }
        if (!query) return true;
        return [
          order.order_number,
          order.reference,
          order.beneficiary_name,
          order.status,
          order.payment_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [filter, orders, search]);

  const total = filteredOrders.reduce(
    (sum, order) => sum + numeric(order.total_eur),
    0,
  );
  const resaleTotal = filteredOrders.reduce(
    (sum, order) => sum + resaleAmount(order),
    0,
  );

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
            <Text style={styles.title}>{t("ordersPage.title")}</Text>
            <Text style={styles.body}>
              {t("ordersPage.guestText")}
            </Text>
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.eyebrow}>{t("common.orders")}</Text>
              <Text style={styles.title}>{t("ordersPage.title")}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("ordersPage.displayed")}</Text>
              <Text style={styles.statValue}>{filteredOrders.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("common.total")}</Text>
              <Text style={styles.statValue}>{formatEur(total, locale)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("ordersPage.resale")}</Text>
              <Text style={styles.statValue}>{formatKwanza(resaleTotal, locale)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("ordersPage.searchPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.searchInput}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {[
                ["all", t("common.all")],
                ["paid", t("ordersPage.paid")],
                ["pending", t("ordersPage.pending")],
                ["resale", t("ordersPage.resaleFilter")],
                ["rental", t("ordersPage.rentalsFilter")],
              ].map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.filterButton,
                    filter === value ? styles.filterButtonActive : null,
                  ]}
                  onPress={() => setFilter(value as Filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === value ? styles.filterTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("ordersPage.history")}</Text>
              {dataLoading ? <ActivityIndicator color="#071846" /> : null}
            </View>
            {filteredOrders.length ? (
              filteredOrders.map((order) => {
                const id = Number(order.id);
                return (
                  <TouchableOpacity
                    key={order.id || order.order_number}
                    style={styles.orderRow}
                    onPress={() => Number.isFinite(id) && onOpenOrder(id)}
                  >
                    {firstImage(order) ? (
                      <Image source={{ uri: firstImage(order) }} style={styles.orderImage} />
                    ) : (
                      <View style={styles.orderImageFallback}>
                        <Text style={styles.orderImageText}>AK</Text>
                      </View>
                    )}
                    <View style={styles.orderInfo}>
                      <Text numberOfLines={1} style={styles.orderRef}>
                        {order.order_number || order.reference || t("account.orderFallback")}
                      </Text>
                      <Text style={styles.orderMeta}>
                        {formatDate(order.created_at, locale)} ·{" "}
                        {order.beneficiary_name || t("account.beneficiary")}
                      </Text>
                      {isResale(order) ? (
                        <Text style={styles.resaleLine}>
                          {t("ordersPage.resale")}: {formatKwanza(resaleAmount(order), locale)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.orderSide}>
                      <Text style={styles.orderTotal}>
                        {formatEur(numeric(order.total_eur), locale)}
                      </Text>
                      <Text style={styles.orderKwanza}>
                        {formatKwanza(numeric(order.total_aoa), locale)}
                      </Text>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{statusLabel(order.status, t)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t("ordersPage.emptyTitle")}</Text>
                <Text style={styles.emptyText}>
                  {t("ordersPage.emptyText")}
                </Text>
              </View>
            )}
          </View>
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
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  title: { color: "#071846", fontSize: 34, lineHeight: 38, fontWeight: "900" },
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
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryButtonText: { color: "#FFF", fontWeight: "900" },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 12,
    justifyContent: "space-between",
  },
  statLabel: { color: "#665F54", fontSize: 12 },
  statValue: { color: "#071846", fontSize: 20, fontWeight: "900" },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: "#071846",
    paddingHorizontal: 14,
    fontWeight: "800",
    backgroundColor: "#FFFDF8",
  },
  filters: { gap: 8 },
  filterButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8",
  },
  filterButtonActive: { borderColor: "#071846", backgroundColor: "#071846" },
  filterText: { color: "#071846", fontWeight: "900" },
  filterTextActive: { color: "#FFF" },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2A7A7",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: { color: "#9B1010", fontWeight: "800" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#071846", fontSize: 22, fontWeight: "900" },
  orderRow: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10,
  },
  orderImage: {
    width: 58,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#DDD5CB",
  },
  orderImageFallback: {
    width: 58,
    height: 70,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  orderImageText: { color: "#8A8374", fontWeight: "900" },
  orderInfo: { flex: 1, gap: 4 },
  orderRef: { color: "#071846", fontWeight: "900" },
  orderMeta: { color: "#665F54", fontSize: 11 },
  resaleLine: { color: "#7A5A00", fontSize: 11, fontWeight: "900" },
  orderSide: { alignItems: "flex-end", gap: 4, maxWidth: 110 },
  orderTotal: { color: "#071846", fontWeight: "900" },
  orderKwanza: { color: "#665F54", fontSize: 11 },
  statusPill: {
    borderRadius: 999,
    backgroundColor: "#E8F7E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { color: "#08742E", fontSize: 10, fontWeight: "900" },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    padding: 14,
    backgroundColor: "#FFF8E7",
  },
  emptyTitle: { color: "#071846", fontWeight: "900" },
  emptyText: { color: "#665F54", marginTop: 4 },
});
