import { useStripe } from "@stripe/stripe-react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { appConfig } from "../../config/app";
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { get } from "../../services/api";
import {
  createGiftCardMobilePaymentIntent,
  getGiftCardTypes,
} from "../../services/giftCard.service";
import { syncStripeIntent } from "../../services/payment.service";

type GiftCardType = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  value_eur?: number | string | null;
  active?: boolean | number | null;
  status?: string | null;
  color_from?: string | null;
  color_to?: string | null;
};

type SettingsPayload = {
  settings?:
    | Array<{ setting_key: string; setting_value: string | null }>
    | Record<string, string | number | null>;
  exchange_rate_eur_to_aoa?: number | string | null;
};

type GiftCardIntentResponse = {
  gift_card_id?: number;
  payment_id?: number;
  payment_intent_id?: string;
  client_secret?: string;
  status?: string;
  serial_number?: string;
  value_eur?: number;
  card_name?: string;
};

type Props = {
  pendingGiftCardTypeId?: number | null;
  onRequireLogin?: (giftCardTypeId: number) => void;
  onOpenMyGiftCards?: () => void;
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

function formatEur(value: number, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatSecondary(value: number, label: string, locale = "fr-FR") {
  return `${Math.round(value).toLocaleString(locale)} ${label}`;
}

function cardReference(card: GiftCardType) {
  const id = String(card.id).padStart(4, "0");
  return `GC 2026 ${id} ${String(card.code || card.name).slice(0, 4).toUpperCase()}`;
}

function userName(user: ReturnType<typeof useAuth>["user"], fallback: string) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  return fullName || user?.name || user?.email || fallback;
}

export default function GiftCardsScreen({
  pendingGiftCardTypeId,
  onRequireLogin,
  onOpenMyGiftCards,
}: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [giftCards, setGiftCards] = useState<GiftCardType[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [selectedCard, setSelectedCard] = useState<GiftCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingConsumed, setPendingConsumed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [settingsResult, giftCardsResult] = await Promise.allSettled([
          get<SettingsPayload>("/settings"),
          getGiftCardTypes() as Promise<GiftCardType[]>,
        ]);

        if (!mounted) return;
        if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
        if (giftCardsResult.status === "fulfilled") {
          setGiftCards(
            (giftCardsResult.value || []).filter(
              (card) =>
                card.active !== false &&
                card.active !== 0 &&
                card.status !== "inactive",
            ),
          );
        }
        if (settingsResult.status === "rejected" || giftCardsResult.status === "rejected") {
          setError(t("giftCardsPage.partialLoadError"));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : t("giftCardsPage.loadError"));
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
    if (pendingConsumed || !pendingGiftCardTypeId || !user || !giftCards.length) return;
    const card = giftCards.find((item) => item.id === pendingGiftCardTypeId);
    if (!card) return;
    setSelectedCard(card);
    setNotice(t("giftCardsPage.connectedNotice"));
    setPendingConsumed(true);
  }, [giftCards, pendingConsumed, pendingGiftCardTypeId, t, user]);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";
  const exchangeRate =
    numeric(settings.exchange_rate_eur_to_aoa) ||
    numeric(settingValue(settings.settings, "exchange_rate_eur_to_aoa")) ||
    1000;

  const totalValue = useMemo(
    () => giftCards.reduce((sum, card) => sum + numeric(card.value_eur), 0),
    [giftCards],
  );

  const openCard = (card: GiftCardType) => {
    setError("");
    setNotice("");
    setSelectedCard(card);
  };

  const closeModal = () => {
    if (buying) return;
    setSelectedCard(null);
    setNotice("");
    setError("");
  };

  const handleBuy = async () => {
    if (!selectedCard) return;
    if (!user) {
      setNotice("");
      setError(t("giftCardsPage.loginRequired"));
      onRequireLogin?.(selectedCard.id);
      return;
    }
    if (!appConfig.stripePublishableKey) {
      setError(t("giftCardsPage.stripeMissing"));
      return;
    }

    setBuying(true);
    setError("");
    setNotice("");

    let intent: GiftCardIntentResponse | null = null;
    try {
      intent = (await createGiftCardMobilePaymentIntent({
        gift_card_type_id: selectedCard.id,
      })) as GiftCardIntentResponse;

      if (!intent.client_secret || !intent.payment_intent_id) {
        throw new Error(t("giftCardsPage.noServerPayment"));
      }

      const initResult = await initPaymentSheet({
        merchantDisplayName: "AK Fashion Plus",
        paymentIntentClientSecret: intent.client_secret,
        returnURL: appConfig.stripeReturnUrl,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: userName(user, t("profile.fallbackName")),
          email: user.email || undefined,
          phone: user.phone || undefined,
        },
      });

      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code === "Canceled") return;
        throw new Error(presentResult.error.message);
      }

      const syncResult = await syncStripeIntent<{ status?: string }>(
        intent.payment_intent_id,
      );
      if (syncResult?.status !== "succeeded") {
        setError(
          t("giftCardsPage.pendingConfirmation"),
        );
        return;
      }

      setNotice(t("giftCardsPage.success"));
      setSelectedCard(null);
      onOpenMyGiftCards?.();
    } catch (purchaseError) {
      if (intent?.payment_intent_id) {
        try {
          await syncStripeIntent(intent.payment_intent_id);
        } catch {
          // The visible message below is enough for the customer.
        }
      }
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : t("giftCardsPage.purchaseError"),
      );
    } finally {
      setBuying(false);
    }
  };

  const selectedValue = numeric(selectedCard?.value_eur);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{t("giftCardsPage.eyebrow")}</Text>
            <Text style={styles.title}>{t("giftCardsPage.title")}</Text>
            <Text style={styles.subtitle}>{t("giftCardsPage.subtitle")}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("giftCardsPage.models")}</Text>
              <Text style={styles.statValue}>{giftCards.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("giftCardsPage.catalogValue")}</Text>
              <Text style={styles.statValue}>{formatEur(totalValue, locale)}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("giftCardsPage.availableModels")}</Text>
          </View>

          {giftCards.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRail}>
              {giftCards.map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.9}
                  onPress={() => openCard(card)}
                  style={[
                    styles.bankCard,
                    { backgroundColor: index % 2 === 0 ? "#101827" : "#071846" },
                  ]}
                >
                  <View style={styles.bankGlow} />
                  <View style={styles.bankTop}>
                    <View>
                      <Text style={styles.logo}>AK</Text>
                      <Text style={styles.bankBrand}>Fashion Plus</Text>
                    </View>
                    <View style={styles.cardTypeBox}>
                      <Text style={styles.cardTypeText}>{t("giftCardsPage.cardBadge")}</Text>
                    </View>
                  </View>
                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <View style={styles.chipLine} />
                      <View style={styles.chipLine} />
                    </View>
                    <Text style={styles.contactless}>)))</Text>
                  </View>
                  <Text style={styles.cardNumber}>{cardReference(card)}</Text>
                  <View style={styles.bankBottom}>
                    <View>
                      <Text style={styles.bankMeta}>{t("giftCardsPage.holderLabel")}</Text>
                      <Text style={styles.bankHolder}>{t("giftCardsPage.holder")}</Text>
                    </View>
                    <View>
                      <Text style={styles.bankMeta}>{t("giftCardsPage.expiry")}</Text>
                      <Text style={styles.bankHolder}>00/00</Text>
                    </View>
                  </View>
                  <View style={styles.bankFooter}>
                    <Text style={styles.giftName}>{card.name}</Text>
                    <View>
                      <Text style={styles.giftValue}>{formatEur(numeric(card.value_eur), locale)}</Text>
                      <Text style={styles.giftSecondary}>
                        {formatSecondary(numeric(card.value_eur) * exchangeRate, currencyLabel, locale)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {loading ? t("giftCardsPage.loadingCards") : t("giftCardsPage.noCards")}
              </Text>
              <Text style={styles.emptyText}>{t("giftCardsPage.noCardsText")}</Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t("giftCardsPage.howTitle")}</Text>
            <Text style={styles.infoText}>{t("giftCardsPage.howText")}</Text>
          </View>
        </ScrollView>

        <Modal animationType="fade" transparent visible={Boolean(selectedCard)} onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalEyebrow}>{t("giftCardsPage.modalEyebrow")}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeText}>{t("common.close")}</Text>
                </TouchableOpacity>
              </View>

              {selectedCard ? (
                <>
                  <View style={styles.modalBankCard}>
                    <View style={styles.bankTop}>
                      <View>
                        <Text style={styles.logo}>AK</Text>
                        <Text style={styles.bankBrand}>Fashion Plus</Text>
                      </View>
                      <View style={styles.cardTypeBox}>
                        <Text style={styles.cardTypeText}>{t("giftCardsPage.cardBadge")}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardNumber}>{cardReference(selectedCard)}</Text>
                    <View style={styles.bankFooter}>
                      <Text style={styles.giftName}>{selectedCard.name}</Text>
                      <Text style={styles.giftValue}>{formatEur(selectedValue, locale)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>{t("giftCardsPage.value")}</Text>
                      <Text style={styles.detailValue}>{formatEur(selectedValue, locale)}</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>{currencyLabel}</Text>
                      <Text style={styles.detailValue}>
                        {formatSecondary(selectedValue * exchangeRate, currencyLabel, locale)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription}>
                    {selectedCard.description ||
                      t("giftCardsPage.descriptionFallback")}
                  </Text>

                  {!user ? (
                    <View style={styles.loginBox}>
                      <Text style={styles.loginText}>
                        {t("giftCardsPage.loginText")}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={buying || !selectedCard}
                onPress={handleBuy}
                style={[styles.buyButton, buying && styles.disabledButton]}
              >
                {buying ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buyButtonText}>
                    {user ? t("giftCardsPage.buy") : t("giftCardsPage.loginToBuy")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  content: {
    padding: 18,
    paddingBottom: 118,
    gap: 18,
  },
  hero: {
    borderRadius: 24,
    backgroundColor: "#071846",
    padding: 22,
    gap: 10,
  },
  eyebrow: {
    color: "#F5D27C",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFF",
    fontSize: 31,
    fontWeight: "900",
  },
  subtitle: {
    color: "#E7EAF3",
    fontSize: 15,
    lineHeight: 23,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 8,
  },
  statLabel: {
    color: "#6B665A",
    fontWeight: "700",
  },
  statValue: {
    color: "#071846",
    fontSize: 23,
    fontWeight: "900",
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
  noticeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BEE5C4",
    backgroundColor: "#EEF9F0",
    padding: 12,
  },
  noticeText: {
    color: "#126B27",
    fontWeight: "800",
  },
  sectionHeader: {
    marginTop: 2,
  },
  sectionTitle: {
    color: "#071846",
    fontSize: 25,
    fontWeight: "900",
  },
  cardsRail: {
    gap: 14,
    paddingRight: 18,
  },
  bankCard: {
    width: 318,
    minHeight: 212,
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  bankGlow: {
    position: "absolute",
    right: -42,
    top: -36,
    width: 135,
    height: 135,
    borderRadius: 80,
    backgroundColor: "rgba(245,210,124,0.16)",
  },
  bankTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: {
    color: "#F5D27C",
    fontSize: 33,
    fontWeight: "900",
  },
  bankBrand: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cardTypeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  cardTypeText: {
    color: "#FFF",
    fontWeight: "900",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  chip: {
    width: 42,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "space-evenly",
    paddingHorizontal: 7,
  },
  chipLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  contactless: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "900",
  },
  cardNumber: {
    color: "#FFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
  },
  bankBottom: {
    flexDirection: "row",
    gap: 26,
  },
  bankMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bankHolder: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  bankFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  giftName: {
    color: "#FFF",
    flex: 1,
    fontSize: 24,
    fontWeight: "900",
  },
  giftValue: {
    color: "#F5D27C",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
  },
  giftSecondary: {
    color: "#FFF",
    fontWeight: "700",
    textAlign: "right",
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
  infoBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    color: "#071846",
    fontSize: 20,
    fontWeight: "900",
  },
  infoText: {
    color: "#5F564B",
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,24,70,0.58)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: theme.colors.paper,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalEyebrow: {
    color: "#A67400",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  closeButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDA10F",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  closeText: {
    color: "#071846",
    fontWeight: "900",
  },
  modalBankCard: {
    minHeight: 178,
    borderRadius: 20,
    backgroundColor: "#101827",
    padding: 18,
    justifyContent: "space-between",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  detailBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 4,
  },
  detailLabel: {
    color: "#6B665A",
    fontWeight: "700",
  },
  detailValue: {
    color: "#071846",
    fontSize: 15,
    fontWeight: "900",
  },
  modalDescription: {
    color: "#5F564B",
    lineHeight: 22,
  },
  loginBox: {
    borderRadius: 14,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#E6C77F",
    padding: 12,
  },
  loginText: {
    color: "#5E4300",
    fontWeight: "800",
    lineHeight: 20,
  },
  buyButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#071846",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.68,
  },
  buyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
