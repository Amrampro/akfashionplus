import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import {
  getGiftCards,
  getGiftCardTransactions,
} from "../../services/giftCard.service";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onBuyGiftCard: () => void;
  onOpenOrderDetails?: (id: number) => void;
};

type GiftCard = {
  id: number;
  serial_number?: string | null;
  card_name?: string | null;
  card_code?: string | null;
  initial_balance_eur?: number | string | null;
  current_balance_eur?: number | string | null;
  reserved_balance_eur?: number | string | null;
  available_balance_eur?: number | string | null;
  status?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  purchaser_name?: string | null;
};

type GiftCardTransaction = {
  id?: number;
  transaction_reference?: string | null;
  order_id?: number | null;
  type?: string | null;
  amount_eur?: number | string | null;
  balance_before_eur?: number | string | null;
  balance_after_eur?: number | string | null;
  description?: string | null;
  created_at?: string | null;
};

const { width } = Dimensions.get("window");
const slideWidth = Math.min(width - 42, 360);

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

function eur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function date(value: string | null | undefined, locale: string) {
  if (!value) return "00/00";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "00/00";
  return parsed.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shortDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string | null | undefined, t: (key: string) => string) {
  const labels: Record<string, string> = {
    active: t("giftCardsWallet.statusActive"),
    blocked: t("giftCardsWallet.statusBlocked"),
    cancelled: t("giftCardsWallet.statusCancelled"),
    expired: t("giftCardsWallet.statusExpired"),
    fully_used: t("giftCardsWallet.statusUsed"),
    pending_payment: t("giftCardsWallet.statusPending"),
    unassigned: t("giftCardsWallet.statusUnassigned"),
  };
  return labels[String(status || "").toLowerCase()] || status || "-";
}

function transactionLabel(type: string | null | undefined, t: (key: string) => string) {
  const labels: Record<string, string> = {
    created: t("giftCardsWallet.txCreated"),
    purchase: t("giftCardsWallet.txPurchase"),
    redemption: t("giftCardsWallet.txRedemption"),
    payment: t("giftCardsWallet.txPayment"),
    reserve: t("giftCardsWallet.txReserve"),
    release: t("giftCardsWallet.txRelease"),
    admin_credit: t("giftCardsWallet.txAdminCredit"),
    admin_debit: t("giftCardsWallet.txAdminDebit"),
  };
  return labels[String(type || "").toLowerCase()] || type || t("giftCardsWallet.operationFallback");
}

function serialBlocks(serial?: string | null) {
  const cleaned = String(serial || "GC00000000000000")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .padEnd(16, "0")
    .slice(0, 16);
  return cleaned.match(/.{1,4}/g)?.join(" ") || "GC00 0000 0000 0000";
}

function initialsName(card?: GiftCard | null) {
  return String(card?.card_name || "AK CARD").toUpperCase();
}

function holderName(
  card: GiftCard | null,
  user: ReturnType<typeof useAuth>["user"],
  fallback: string,
) {
  const cardOwner = String(card?.owner_name || "").trim();
  if (cardOwner) return cardOwner.toUpperCase();
  const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return (userName || user?.name || user?.email || fallback).toUpperCase();
}

function cardTone(index: number) {
  return [styles.cardToneGold, styles.cardToneBlue, styles.cardToneBlack][
    index % 3
  ];
}

export default function MyGiftCardsScreen({
  onBack,
  onLogin,
  onBuyGiftCard,
  onOpenOrderDetails,
}: Props) {
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");

  const selectedCard = cards[selectedIndex] || null;

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    async function loadCards() {
      setCardsLoading(true);
      setError("");
      try {
        const result = await getGiftCards();
        if (mounted) {
          const rows = normalizeArray<GiftCard>(result, [
            "giftCards",
            "gift_cards",
            "cards",
          ]);
          setCards(rows);
          setSelectedIndex(0);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : t("giftCardsWallet.loadError"),
          );
        }
      } finally {
        if (mounted) setCardsLoading(false);
      }
    }

    loadCards();
    return () => {
      mounted = false;
    };
  }, [t, user]);

  useEffect(() => {
    let mounted = true;
    if (!selectedCard?.id) {
      setTransactions([]);
      return;
    }

    async function loadTransactions() {
      setTransactionsLoading(true);
      setTransactionError("");
      try {
        const result = await getGiftCardTransactions(Number(selectedCard.id));
        if (mounted) {
          setTransactions(
            normalizeArray<GiftCardTransaction>(result, [
              "transactions",
              "gift_card_transactions",
            ]),
          );
        }
      } catch (err) {
        if (mounted) {
          setTransactions([]);
          setTransactionError(
            err instanceof Error
              ? err.message
              : t("giftCardsWallet.transactionLoadError"),
          );
        }
      } finally {
        if (mounted) setTransactionsLoading(false);
      }
    }

    loadTransactions();
    return () => {
      mounted = false;
    };
  }, [selectedCard?.id, t]);

  const totals = useMemo(
    () =>
      cards.reduce(
        (sum, card) => ({
          initial: sum.initial + numeric(card.initial_balance_eur),
          available: sum.available + numeric(card.available_balance_eur),
        }),
        { initial: 0, available: 0 },
      ),
    [cards],
  );

  const handleCardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / (slideWidth + 12),
    );
    if (nextIndex !== selectedIndex && cards[nextIndex]) {
      setSelectedIndex(nextIndex);
    }
  };

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
            <Text style={styles.title}>{t("common.giftCards")}</Text>
            <Text style={styles.body}>
              {t("giftCardsWallet.guestText")}
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
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{t("giftCardsWallet.eyebrow")}</Text>
              <Text style={styles.title}>{t("giftCardsWallet.title")}</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>{t("giftCardsWallet.activeCards")}</Text>
              <Text style={styles.heroValue}>{cards.length}</Text>
            </View>
            <View>
              <Text style={styles.heroLabel}>{t("common.available")}</Text>
              <Text style={styles.heroValue}>{eur(totals.available, locale)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.buyButton} onPress={onBuyGiftCard}>
            <Text style={styles.buyButtonText}>{t("giftCardsWallet.buy")}</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {cardsLoading ? (
            <View style={styles.centerCard}>
              <ActivityIndicator color="#071846" />
              <Text style={styles.body}>{t("giftCardsWallet.loading")}</Text>
            </View>
          ) : null}

          {!cardsLoading && cards.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{t("giftCardsWallet.emptyTitle")}</Text>
              <Text style={styles.emptyText}>
                {t("giftCardsWallet.emptyText")}
              </Text>
            </View>
          ) : null}

          {cards.length ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled={false}
                snapToInterval={slideWidth + 12}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sliderContent}
                onMomentumScrollEnd={handleCardScroll}
              >
                {cards.map((card, index) => (
                  <View
                    key={card.id}
                    style={[styles.visaCard, cardTone(index), { width: slideWidth }]}
                  >
                    <View style={styles.visaTop}>
                      <View>
                        <Text style={styles.akLogo}>AK</Text>
                        <Text style={styles.bankName}>Fashion Plus</Text>
                      </View>
                      <View style={styles.giftBadge}>
                        <Text style={styles.giftBadgeText}>
                          {t("giftCardsWallet.giftBadge").replace(" ", "\n")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.chipRow}>
                      <View style={styles.contactless}>
                        <View style={styles.wave} />
                        <View style={styles.waveSmall} />
                      </View>
                      <View style={styles.chip}>
                        <View style={styles.chipLine} />
                        <View style={styles.chipLine} />
                      </View>
                    </View>

                    <Text style={styles.serial}>{serialBlocks(card.serial_number)}</Text>

                    <View style={styles.visaBottom}>
                      <View>
                        <Text style={styles.cardOwner}>
                          {holderName(card, user, t("profile.fallbackName"))}
                        </Text>
                        <Text style={styles.expiryLabel}>{t("giftCardsWallet.expires")}</Text>
                        <Text style={styles.expiryValue}>
                          {date(card.expires_at, locale)}
                        </Text>
                      </View>
                      <View style={styles.balanceBlock}>
                        <Text style={styles.balanceLabel}>{t("giftCardsWallet.balance")}</Text>
                        <Text style={styles.balanceValue}>
                          {eur(numeric(card.available_balance_eur), locale)}
                        </Text>
                        <Text style={styles.cardCode}>{initialsName(card)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.dots}>
                {cards.map((card, index) => (
                  <View
                    key={card.id}
                    style={[
                      styles.dot,
                      index === selectedIndex ? styles.dotActive : null,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>{t("giftCardsWallet.selected")}</Text>
                    <Text style={styles.sectionTitle}>
                      {selectedCard?.card_name || t("giftCardsWallet.fallbackCard")}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>
                      {statusLabel(selectedCard?.status, t)}
                    </Text>
                  </View>
                </View>

                <View style={styles.balanceGrid}>
                  <View style={styles.balanceCell}>
                    <Text style={styles.balanceCellLabel}>{t("common.initial")}</Text>
                    <Text style={styles.balanceCellValue}>
                      {eur(numeric(selectedCard?.initial_balance_eur), locale)}
                    </Text>
                  </View>
                  <View style={styles.balanceCell}>
                    <Text style={styles.balanceCellLabel}>{t("common.available")}</Text>
                    <Text style={styles.balanceCellValue}>
                      {eur(numeric(selectedCard?.available_balance_eur), locale)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>{t("giftCardsWallet.operations")}</Text>
                  {transactionsLoading ? <ActivityIndicator color="#071846" /> : null}
                </View>

                {transactionError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{transactionError}</Text>
                  </View>
                ) : null}

                {!transactionsLoading && transactions.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>{t("giftCardsWallet.emptyOperations")}</Text>
                    <Text style={styles.emptyText}>
                      {t("giftCardsWallet.emptyOperationsText")}
                    </Text>
                  </View>
                ) : null}

                {transactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={`${transaction.id || transaction.transaction_reference || "operation"}-${index}`}
                    style={styles.transactionRow}
                    activeOpacity={transaction.order_id ? 0.82 : 1}
                    disabled={!transaction.order_id}
                    onPress={() => {
                      if (transaction.order_id) onOpenOrderDetails?.(Number(transaction.order_id));
                    }}
                  >
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionIconText}>€</Text>
                    </View>
                    <View style={styles.transactionBody}>
                      <Text numberOfLines={1} style={styles.transactionTitle}>
                        {transactionLabel(transaction.type, t)}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {transaction.transaction_reference ||
                          t("giftCardsWallet.operationFallback")}{" "}
                        · {shortDate(transaction.created_at, locale)}
                      </Text>
                      {transaction.order_id ? (
                        <Text style={styles.transactionMeta}>
                          {t("giftCardsWallet.orderNumber", { id: transaction.order_id })}
                        </Text>
                      ) : null}
                      {transaction.description ? (
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={styles.transactionValue}>
                        {eur(numeric(transaction.amount_eur), locale)}
                      </Text>
                      <Text style={styles.transactionAfter}>
                        {t("giftCardsWallet.balanceAfter")}{" "}
                        {eur(numeric(transaction.balance_after_eur), locale)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
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
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.soft,
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
  title: { color: "#071846", fontSize: 32, lineHeight: 36, fontWeight: "900" },
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
  heroCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#071846",
  },
  heroLabel: { color: "#DDE5FF", fontSize: 12, fontWeight: "800" },
  heroValue: { color: "#FFF", fontSize: 22, fontWeight: "900", marginTop: 4 },
  buyButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.gold,
  },
  buyButtonText: { color: "#071846", fontWeight: "900" },
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
  sliderContent: { gap: 12, paddingRight: 16 },
  visaCard: {
    height: 224,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  cardToneGold: { backgroundColor: "#5C4205" },
  cardToneBlue: { backgroundColor: "#17243B" },
  cardToneBlack: { backgroundColor: "#202020" },
  visaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  akLogo: { color: theme.colors.gold, fontSize: 30, fontWeight: "900" },
  bankName: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  giftBadge: {
    width: 58,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftBadgeText: {
    color: "#FFF",
    fontSize: 9,
    lineHeight: 11,
    textAlign: "center",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactless: { width: 26, height: 28, justifyContent: "center" },
  wave: {
    width: 22,
    height: 22,
    borderRightWidth: 3,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 20,
  },
  waveSmall: {
    position: "absolute",
    left: 6,
    width: 14,
    height: 14,
    borderRightWidth: 3,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 20,
  },
  chip: {
    width: 50,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "#D8D1C4",
    padding: 7,
    justifyContent: "space-between",
  },
  chipLine: {
    height: 1,
    backgroundColor: "rgba(7,24,70,0.35)",
  },
  serial: {
    color: "#FFF",
    fontSize: 21,
    letterSpacing: 1,
    fontWeight: "900",
  },
  visaBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardOwner: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  expiryLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase",
  },
  expiryValue: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  balanceBlock: { alignItems: "flex-end" },
  balanceLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  balanceValue: { color: theme.colors.gold, fontSize: 22, fontWeight: "900" },
  cardCode: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    marginTop: 5,
    fontWeight: "900",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#D7CEBC",
  },
  dotActive: { width: 22, backgroundColor: "#071846" },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  sectionTitle: { color: "#071846", fontSize: 22, fontWeight: "900" },
  statusPill: {
    borderRadius: 999,
    backgroundColor: "#E8F7E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { color: "#08742E", fontSize: 10, fontWeight: "900" },
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  balanceCell: {
    width: "48%",
    borderRadius: 14,
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  balanceCellLabel: { color: "#665F54", fontSize: 12, fontWeight: "800" },
  balanceCellValue: {
    color: "#071846",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  transactionRow: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  transactionIconText: { color: theme.colors.gold, fontWeight: "900" },
  transactionBody: { flex: 1, gap: 3 },
  transactionTitle: { color: "#071846", fontWeight: "900" },
  transactionMeta: { color: "#665F54", fontSize: 11 },
  transactionDescription: { color: "#7A5A00", fontSize: 11, fontWeight: "800" },
  transactionAmount: { alignItems: "flex-end", maxWidth: 100 },
  transactionValue: { color: "#071846", fontWeight: "900" },
  transactionAfter: { color: "#665F54", fontSize: 10, marginTop: 4 },
});
