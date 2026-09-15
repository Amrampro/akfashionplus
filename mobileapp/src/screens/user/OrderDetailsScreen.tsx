import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import { getOrder } from "../../services/order.service";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  orderId: number;
  onBack: () => void;
};

type OrderItem = {
  id?: number;
  product_name?: string;
  product_slug?: string;
  product_sku?: string;
  sku?: string;
  variant_label?: string | null;
  color_name?: string | null;
  color?: string | null;
  size_name?: string | null;
  size?: string | null;
  product_image_url?: string | null;
  image_url?: string | null;
  quantity?: number | string | null;
  unit_price_eur?: number | string | null;
  total_eur?: number | string | null;
  line_total_eur?: number | string | null;
  rental_days?: number | string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  rental_price_per_day_eur?: number | string | null;
  rental_deposit_eur?: number | string | null;
  item_type?: string | null;
  type?: string | null;
};

type Payment = {
  id?: number;
  reference?: string;
  payment_method?: string | null;
  method?: string | null;
  status?: string | null;
  amount_eur?: number | string | null;
  amount_aoa?: number | string | null;
  created_at?: string | null;
  paid_at?: string | null;
};

type Order = {
  id?: number;
  order_number?: string;
  reference?: string;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_method?: string | null;
  fulfillment_type?: string | null;
  delivery_method?: string | null;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  delivery_address?: string | null;
  shipping_address_line_1?: string | null;
  shipping_address_line_2?: string | null;
  shipping_city?: string | null;
  shipping_province?: string | null;
  shipping_country_code?: string | null;
  branch_name?: string | null;
  branch_city?: string | null;
  total_eur?: number | string | null;
  subtotal_eur?: number | string | null;
  delivery_fee_eur?: number | string | null;
  exchange_rate_eur_to_aoa?: number | string | null;
  total_aoa?: number | string | null;
  resale_value_aoa?: number | string | null;
  resale_payout_amount_aoa?: number | string | null;
  resale_items_count?: number | string | null;
  resell_to_company?: boolean | number | null;
  resale_requested?: boolean | number | null;
  created_at?: string | null;
  items?: OrderItem[];
  payments?: Payment[];
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstNumber(...values: Array<number | string | null | undefined>) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function unwrapOrder(payload: unknown): Order | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.order && typeof record.order === "object") return record.order as Order;
  return payload as Order;
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
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOrderMode(order: Order, t: (key: string) => string) {
  const mode = String(
    order.fulfillment_type || order.fulfillment_method || order.delivery_method || "",
  ).toLowerCase();
  if (mode === "pickup" || mode === "branch" || mode === "retrait") {
    return t("common.pickup");
  }
  if (mode === "delivery" || mode === "livraison") return t("common.delivery");
  return order.fulfillment_type || order.fulfillment_method || order.delivery_method || "-";
}

function formatPaymentMethod(method: string | null | undefined, t: (key: string) => string) {
  const labels: Record<string, string> = {
    stripe: "Stripe",
    card: t("orderDetails.cardPayment"),
    gift_card: t("orderDetails.giftCardPayment"),
    cash: t("orderDetails.cash"),
    order: t("orderDetails.orderPayment"),
  };
  const key = String(method || "").toLowerCase();
  return labels[key] || method || t("common.payment");
}

function paymentSummary(order: Order, t: (key: string) => string) {
  const methods = Array.from(
    new Set(
      (order.payments || [])
        .map((payment) =>
          formatPaymentMethod(payment.payment_method || payment.method, t),
        )
        .filter(Boolean),
    ),
  );
  const status = statusLabel(order.payment_status, t);
  return methods.length ? `${methods.join(" + ")} · ${status}` : status;
}

function branchSummary(order: Order, t: (key: string) => string) {
  const branch = [order.branch_name, order.branch_city].filter(Boolean).join(" - ");
  return branch || t("orderDetails.unassigned");
}

function addressSummary(order: Order) {
  const parts = [
    order.delivery_address,
    order.shipping_address_line_1,
    order.shipping_address_line_2,
    order.shipping_city,
    order.shipping_province,
    order.shipping_country_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function itemSku(item: OrderItem) {
  return item.product_sku || item.sku || "";
}

function itemSize(item: OrderItem) {
  return item.size_name || item.size || "";
}

function itemColor(item: OrderItem) {
  return item.color_name || item.color || "";
}

function itemLineTotal(item: OrderItem) {
  const explicitTotal = firstNumber(item.line_total_eur, item.total_eur);
  if (explicitTotal > 0) return explicitTotal;
  const quantity = numeric(item.quantity) || 1;
  const itemType = String(item.item_type || item.type || "").toLowerCase();
  if (itemType === "rental") {
    return (
      quantity *
      ((numeric(item.rental_days) || 1) *
        firstNumber(item.rental_price_per_day_eur, item.unit_price_eur) +
        numeric(item.rental_deposit_eur))
    );
  }
  return quantity * numeric(item.unit_price_eur);
}

function itemUnitPrice(item: OrderItem) {
  return firstNumber(item.unit_price_eur, item.rental_price_per_day_eur);
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

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLineLabel}>{label}</Text>
      <Text style={styles.summaryLineValue}>{value}</Text>
    </View>
  );
}

export default function OrderDetailsScreen({ orderId, onBack }: Props) {
  const { locale, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      setLoading(true);
      setError("");
      try {
        const result = await getOrder(orderId);
        if (mounted) setOrder(unwrapOrder(result));
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : t("orderDetails.loadError"),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      mounted = false;
    };
  }, [orderId, t]);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{t("orderDetails.titleFallback")}</Text>
              <Text numberOfLines={2} style={styles.title}>
                {order?.order_number || order?.reference || t("orderDetails.titleFallback")}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerCard}>
              <ActivityIndicator color="#071846" />
              <Text style={styles.body}>{t("orderDetails.loading")}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {order && !loading ? (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View>
                    <Text style={styles.summaryLabel}>{t("common.total")}</Text>
                    <Text style={styles.summaryTotal}>
                      {formatEur(numeric(order.total_eur), locale)}
                    </Text>
                    <Text style={styles.summaryKwanza}>
                      {formatKwanza(
                        firstNumber(
                          order.total_aoa,
                          numeric(order.total_eur) *
                            numeric(order.exchange_rate_eur_to_aoa),
                        ),
                        locale,
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t("orderDetails.share")}
                    onPress={() => undefined}
                    style={styles.shareButton}
                  >
                    <Text style={styles.shareText}>↗</Text>
                  </TouchableOpacity>
                </View>
                <SummaryLine
                  label={t("orderDetails.date")}
                  value={formatDateTime(order.created_at, locale)}
                />
                <SummaryLine
                  label={t("common.payment")}
                  value={paymentSummary(order, t)}
                />
                <SummaryLine
                  label={t("orderDetails.mode")}
                  value={formatOrderMode(order, t)}
                />
                <SummaryLine
                  label={t("orderDetails.branch")}
                  value={branchSummary(order, t)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("orderDetails.beneficiary")}</Text>
                <DetailLine
                  label={t("orderDetails.name")}
                  value={order.beneficiary_name || "-"}
                />
                <DetailLine
                  label={t("orderDetails.phone")}
                  value={order.beneficiary_phone || "-"}
                />
                <DetailLine
                  label={t("orderDetails.address")}
                  value={addressSummary(order)}
                />
              </View>

              {isResale(order) ? (
                <View style={styles.resaleCard}>
                  <Text style={styles.sectionTitle}>{t("orderDetails.resaleTitle")}</Text>
                  <Text style={styles.body}>
                    {t("orderDetails.resaleText")}
                  </Text>
                  <Text style={styles.resaleValue}>
                    {formatKwanza(resaleAmount(order), locale)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("orderDetails.items")}</Text>
                {order.items?.length ? (
                  order.items.map((item) => {
                    const image = absoluteImageUrl(
                      item.product_image_url || item.image_url || null,
                    );
                    const itemType = String(item.item_type || item.type || "purchase");
                    const itemTypeLabel =
                      itemType.toLowerCase() === "rental"
                        ? t("orderDetails.rentalMode")
                        : t("orderDetails.purchaseMode");
                    return (
                      <View key={item.id || item.product_sku || item.product_name} style={styles.itemRow}>
                        {image ? (
                          <Image source={{ uri: image }} style={styles.itemImage} />
                        ) : (
                          <View style={styles.itemImageFallback}>
                            <Text style={styles.itemImageText}>AK</Text>
                          </View>
                        )}
                        <View style={styles.itemBody}>
                          <Text numberOfLines={1} style={styles.itemName}>
                            {item.product_name || t("orderDetails.fallbackItem")}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {itemTypeLabel} · {item.quantity || 1} x{" "}
                            {formatEur(itemUnitPrice(item), locale)}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {[itemSize(item), itemColor(item), itemSku(item)]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </Text>
                          {numeric(item.rental_days) > 0 ? (
                            <Text style={styles.itemMeta}>
                              {formatDate(item.rental_start_date, locale)} -{" "}
                              {formatDate(item.rental_end_date, locale)} · {item.rental_days}{" "}
                              {t("common.days")}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.itemPrice}>
                          {formatEur(itemLineTotal(item), locale)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.body}>{t("orderDetails.noItems")}</Text>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("orderDetails.payments")}</Text>
                {order.payments?.length ? (
                  order.payments.map((payment) => (
                    <View key={payment.id || payment.reference} style={styles.paymentRow}>
                      <View>
                        <Text style={styles.paymentRef}>
                          {payment.reference || t("orderDetails.fallbackPayment")}
                        </Text>
                        <Text style={styles.paymentMeta}>
                          {formatPaymentMethod(payment.payment_method || payment.method, t)} ·{" "}
                          {statusLabel(payment.status, t)}
                        </Text>
                        <Text style={styles.paymentMeta}>
                          {formatDateTime(payment.paid_at || payment.created_at, locale)}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        {formatEur(numeric(payment.amount_eur), locale)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.body}>{t("orderDetails.noPayments")}</Text>
                )}
              </View>
            </>
          ) : null}
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
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1 },
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
  title: { color: "#071846", fontSize: 30, lineHeight: 34, fontWeight: "900" },
  body: { color: "#665F54", lineHeight: 21 },
  centerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2A7A7",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: { color: "#9B1010", fontWeight: "800" },
  summaryCard: {
    borderRadius: 20,
    backgroundColor: "#071846",
    padding: 16,
    gap: 12,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: { color: "#DDE5FF", fontWeight: "800" },
  summaryTotal: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryKwanza: { color: theme.colors.gold, fontWeight: "900" },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#E8F7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: "#08742E", fontSize: 22, fontWeight: "900" },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.58)",
    paddingTop: 10,
  },
  summaryLineLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12 },
  summaryLineValue: {
    flex: 1,
    color: "#FFFFFF",
    textAlign: "right",
    fontWeight: "900",
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(228,222,206,0.72)",
    paddingTop: 10,
  },
  detailLabel: { color: "#6B665A", fontSize: 12 },
  detailValue: {
    flex: 1,
    color: "#071846",
    textAlign: "right",
    fontWeight: "900",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { color: "#071846", fontSize: 21, fontWeight: "900" },
  resaleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    backgroundColor: "#FFF8E7",
    padding: 14,
    gap: 8,
  },
  resaleValue: { color: "#071846", fontSize: 22, fontWeight: "900" },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
    backgroundColor: "#FFFDF8",
  },
  itemImage: {
    width: 62,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#DDD5CB",
  },
  itemImageFallback: {
    width: 62,
    height: 76,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  itemImageText: { color: "#8A8374", fontWeight: "900" },
  itemBody: { flex: 1, gap: 3 },
  itemName: { color: "#071846", fontWeight: "900" },
  itemMeta: { color: "#665F54", fontSize: 11 },
  itemPrice: { color: "#071846", fontWeight: "900" },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
  },
  paymentRef: { color: "#071846", fontWeight: "900" },
  paymentMeta: { color: "#665F54", fontSize: 12, marginTop: 4 },
});
