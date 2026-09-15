import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
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
import { useStripe } from "@stripe/stripe-react-native";
import { appConfig } from "../../config/app";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useCart, type CartItem } from "../../hooks/useCart";
import { useLanguage } from "../../contexts/LanguageContext";
import { get } from "../../services/api";
import {
  cancelPendingOrderPayment,
  directCheckout,
  getOrder,
} from "../../services/order.service";
import {
  createStripeIntent,
  syncStripeIntent,
} from "../../services/payment.service";

type Props = {
  onBack: () => void;
  onSuccess: (order: { order_number?: string; total_eur?: number }) => void;
  onFailure: (failure: { order_number?: string; message?: string }) => void;
};

type SettingsPayload = {
  settings?: Array<{ setting_key: string; setting_value: string | null }> | Record<string, string | number | null>;
};

type OrderResponse = {
  id: number;
  order_number: string;
  subtotal_eur: number;
  shipping_eur: number;
  total_eur: number;
  total_aoa: number;
  gift_card_paid_eur?: number | string | null;
  remaining_due_eur?: number | string | null;
  payment_status?: string | null;
};

type GiftCard = {
  id: number;
  serial_number: string;
  card_name: string;
  current_balance_eur?: number | string | null;
  reserved_balance_eur?: number | string | null;
  available_balance_eur?: number | string | null;
  status?: string | null;
};

type DeliveryCountry = {
  id: number;
  country_code: string;
  country_name: string;
  delivery_price_eur: number | string;
  status?: string | null;
};

type VerifiedOrder = OrderResponse & {
  status?: string | null;
  payment_status?: string | null;
  payments?: Array<{
    status?: string | null;
    failure_message?: string | null;
    stripe_payment_intent_id?: string | null;
  }>;
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

function checkoutLine(item: CartItem) {
  return {
    product_id: item.product_id,
    product_variant_id: item.variant_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    item_type: item.item_type === "rental" ? "rental" : "purchase",
    unit_price_eur: item.unit_price_eur,
    rental_days: item.rental_days,
    rental_price_per_day_eur: item.rental_price_per_day_eur,
    rental_deposit_eur: item.rental_deposit_eur,
    rental_start_date: item.rental_start_date,
    rental_end_date: item.rental_end_date,
  };
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function orderIsPaid(order?: VerifiedOrder) {
  return (
    order?.payment_status === "paid" ||
    order?.status === "paid" ||
    order?.payments?.some((payment) => payment.status === "succeeded")
  );
}

function orderIsFailed(order?: VerifiedOrder) {
  return order?.payments?.some((payment) =>
    ["failed", "canceled", "cancelled"].includes(String(payment.status || "").toLowerCase()),
  );
}

function failureMessage(order: VerifiedOrder | undefined, fallback: string) {
  return (
    order?.payments?.find((payment) => payment.failure_message)?.failure_message ||
    fallback
  );
}

function allocateGiftCards(cards: GiftCard[], selectedIds: number[], total: number) {
  let remaining = total;
  const allocations: Array<{ id: number; amount: number; card: GiftCard }> = [];

  for (const id of selectedIds) {
    const card = cards.find((item) => item.id === id);
    if (!card || remaining <= 0) continue;
    const available = Math.max(numeric(card.available_balance_eur), 0);
    const amount = Math.min(available, remaining);
    if (amount <= 0) continue;
    allocations.push({ id, amount, card });
    remaining = Math.max(remaining - amount, 0);
  }

  return {
    allocations,
    paid: allocations.reduce((sum, item) => sum + item.amount, 0),
    remaining,
  };
}

export default function CheckoutScreen({ onBack, onSuccess, onFailure }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { language, locale, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [beneficiaryName, setBeneficiaryName] = useState("Ana Kiala");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("+244 912 345 678");
  const [address, setAddress] = useState("Rua Rainha Ginga, No 23");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [deliveryCountries, setDeliveryCountries] = useState<DeliveryCountry[]>([]);
  const [shippingCountryCode, setShippingCountryCode] = useState("AO");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [resellToCompany, setResellToCompany] = useState(false);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [selectedGiftCardIds, setSelectedGiftCardIds] = useState<number[]>([]);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    get<SettingsPayload>("/settings")
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    let active = true;
    get<DeliveryCountry[]>("/settings/delivery-countries")
      .then((countries) => {
        if (!active) return;
        const activeCountries = countries || [];
        setDeliveryCountries(activeCountries);
        if (activeCountries[0]?.country_code) {
          setShippingCountryCode(activeCountries[0].country_code);
        }
      })
      .catch(() => {
        if (active) setDeliveryCountries([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setGiftCards([]);
      setSelectedGiftCardIds([]);
      return () => {
        active = false;
      };
    }

    setLoadingGiftCards(true);
    get<GiftCard[]>("/gift-cards?status=active")
      .then((cards) => {
        if (!active) return;
        setGiftCards(cards || []);
      })
      .catch(() => {
        if (active) setGiftCards([]);
      })
      .finally(() => {
        if (active) setLoadingGiftCards(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";
  const exchangeRate = numeric(settingValue(settings.settings, "exchange_rate_eur_to_aoa")) || 1000;
  const selectedDeliveryCountry = deliveryCountries.find(
    (country) => country.country_code === shippingCountryCode,
  );
  const shipping =
    fulfillment === "delivery" && !resellToCompany && items.length
      ? numeric(selectedDeliveryCountry?.delivery_price_eur)
      : 0;
  const total = subtotal + shipping;
  const resaleValue = subtotal * exchangeRate;
  const giftCardSelection = useMemo(
    () => allocateGiftCards(giftCards, selectedGiftCardIds, total),
    [giftCards, selectedGiftCardIds, total],
  );
  const giftCardPaid = giftCardSelection.paid;
  const remainingDue = giftCardSelection.remaining;

  const toggleGiftCard = (cardId: number) => {
    setSelectedGiftCardIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  };

  const submit = async () => {
    if (!items.length) {
      setError(t("checkoutPage.emptyCart"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const order = await directCheckout({
        items: items.map(checkoutLine),
        fulfillment_type: fulfillment,
        beneficiary_name: beneficiaryName,
        beneficiary_phone: beneficiaryPhone,
        shipping_name: beneficiaryName,
        shipping_phone: beneficiaryPhone,
        shipping_address_line_1: address,
        shipping_country_code: shippingCountryCode,
        resell_to_company: resellToCompany,
        gift_card_ids: selectedGiftCardIds,
        language,
      }) as OrderResponse;

      const orderRemainingDue = Math.max(
        numeric(order.remaining_due_eur ?? order.total_eur),
        0,
      );

      if (orderRemainingDue <= 0 || order.payment_status === "paid") {
        clearCart();
        onSuccess({
          order_number: order.order_number,
          total_eur: numeric(order.total_eur),
        });
        return;
      }

      if (!appConfig.stripePublishableKey) {
        await cancelPendingOrderPayment(order.id).catch(() => null);
        setError(t("checkoutPage.stripeMissing"));
        return;
      }

      const paymentIntent = await createStripeIntent({
        order_id: order.id,
        amount_eur: orderRemainingDue,
        purpose: "order",
        description: `Commande ${order.order_number}`,
        return_url: appConfig.stripeReturnUrl,
      });

      if (!paymentIntent.client_secret) {
        throw new Error(t("checkoutPage.stripeClientSecretMissing"));
      }

      const initialized = await initPaymentSheet({
        merchantDisplayName: "AK Fashion Plus",
        paymentIntentClientSecret: paymentIntent.client_secret,
        returnURL: appConfig.stripeReturnUrl,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: beneficiaryName,
          phone: beneficiaryPhone,
        },
      });

      if (initialized.error) {
        await cancelPendingOrderPayment(order.id).catch(() => null);
        throw new Error(initialized.error.message);
      }

      const presented = await presentPaymentSheet();

      if (presented.error) {
        const code = String(presented.error.code || "").toLowerCase();
        if (code.includes("cancel")) {
          await cancelPendingOrderPayment(order.id).catch(() => null);
          setError(t("checkoutPage.paymentCancelledReleased"));
          return;
        }

        if (paymentIntent.payment_intent_id) {
          await syncStripeIntent(paymentIntent.payment_intent_id).catch(() => null);
        }

        const checkedOrder = await verifyOrderPayment(order.id);
        if (orderIsPaid(checkedOrder)) {
          clearCart();
          onSuccess({
            order_number: checkedOrder?.order_number || order.order_number,
            total_eur: numeric(checkedOrder?.total_eur ?? order.total_eur),
          });
          return;
        }

        await cancelPendingOrderPayment(order.id).catch(() => null);
        onFailure({
          order_number: order.order_number,
          message: presented.error.message || failureMessage(checkedOrder, t("checkoutPage.submitError")),
        });
        return;
      }

      if (paymentIntent.payment_intent_id) {
        await syncStripeIntent(paymentIntent.payment_intent_id);
      }

      const checkedOrder = await verifyOrderPayment(order.id);

      if (orderIsPaid(checkedOrder)) {
        clearCart();
        onSuccess({
          order_number: checkedOrder?.order_number || order.order_number,
          total_eur: numeric(checkedOrder?.total_eur ?? order.total_eur),
        });
        return;
      }

      if (orderIsFailed(checkedOrder)) {
        await cancelPendingOrderPayment(order.id).catch(() => null);
        onFailure({
          order_number: checkedOrder?.order_number || order.order_number,
          message: failureMessage(checkedOrder, t("checkoutPage.submitError")),
        });
        return;
      }

      setError(t("checkoutPage.pendingConfirmation"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("checkoutPage.submitError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOrderPayment = async (orderId: number) => {
    let latestOrder: VerifiedOrder | undefined;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      latestOrder = await getOrder<VerifiedOrder>(orderId);

      if (orderIsPaid(latestOrder) || orderIsFailed(latestOrder)) {
        return latestOrder;
      }

      await wait(attempt < 2 ? 800 : 1400);
    }

    return latestOrder;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>{t("checkoutPage.paymentTitle")}</Text>
          <View style={styles.securePill}>
            <Text style={styles.securePillText}>Stripe</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.eyebrow}>{t("checkoutPage.paymentTitle")}</Text>
            <Text style={styles.title}>{t("checkoutPage.beneficiaryTitle")}</Text>

            <TextInput
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
              placeholder={t("checkoutPage.fullNamePlaceholder")}
              style={styles.input}
            />
            <TextInput
              value={beneficiaryPhone}
              onChangeText={setBeneficiaryPhone}
              placeholder={t("checkoutPage.phonePlaceholder")}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={t("checkoutPage.addressPlaceholder")}
              style={styles.input}
            />

            <View style={styles.countryBlock}>
              <Text style={styles.countryLabel}>{t("profile.country")}</Text>
              <TouchableOpacity
                disabled={fulfillment !== "delivery" || resellToCompany}
                onPress={() => setCountryPickerOpen((value) => !value)}
                style={[
                  styles.countrySelect,
                  fulfillment !== "delivery" || resellToCompany
                    ? styles.countrySelectDisabled
                    : null,
                ]}
              >
                <Text style={styles.countrySelectText}>
                  {selectedDeliveryCountry
                    ? `${selectedDeliveryCountry.country_name} - ${formatEur(
                        numeric(selectedDeliveryCountry.delivery_price_eur),
                        locale,
                      )}`
                    : t("checkoutPage.noDeliveryCountry")}
                </Text>
                <Text style={styles.countryChevron}>
                  {countryPickerOpen ? "⌃" : "⌄"}
                </Text>
              </TouchableOpacity>
              {countryPickerOpen &&
              fulfillment === "delivery" &&
              !resellToCompany ? (
                <View style={styles.countryDropdown}>
                  {deliveryCountries.map((country) => (
                    <TouchableOpacity
                      key={country.id}
                      onPress={() => {
                        setShippingCountryCode(country.country_code);
                        setCountryPickerOpen(false);
                      }}
                      style={[
                        styles.countryOption,
                        shippingCountryCode === country.country_code
                          ? styles.countryOptionActive
                          : null,
                      ]}
                    >
                      <Text style={styles.countryOptionName}>
                        {country.country_name}
                      </Text>
                      <Text style={styles.countryOptionPrice}>
                        {formatEur(numeric(country.delivery_price_eur), locale)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionButton, fulfillment === "delivery" ? styles.optionButtonActive : null]}
                onPress={() => setFulfillment("delivery")}
              >
                <Text style={[styles.optionText, fulfillment === "delivery" ? styles.optionTextActive : null]}>
                  {t("common.delivery")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, fulfillment === "pickup" ? styles.optionButtonActive : null]}
                onPress={() => setFulfillment("pickup")}
              >
                <Text style={[styles.optionText, fulfillment === "pickup" ? styles.optionTextActive : null]}>
                  {t("checkoutPage.storePickup")}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resaleBox}
              onPress={() => setResellToCompany((value) => !value)}
            >
              <View style={[styles.checkbox, resellToCompany ? styles.checkboxActive : null]}>
                {resellToCompany ? <Text style={styles.checkboxText}>✓</Text> : null}
              </View>
              <Text style={styles.resaleText}>
                {t("checkoutPage.resalePrefix")}{" "}
                <Text style={styles.resaleAmount}>
                  {formatSecondary(resaleValue, currencyLabel, locale)}
                </Text>
                .
              </Text>
            </TouchableOpacity>

            <Text style={styles.paymentTitle}>{t("checkoutPage.paymentMethodTitle")}</Text>
            <View style={styles.giftCardPanel}>
              <View style={styles.giftCardHeader}>
                <Text style={styles.giftCardTitle}>{t("checkoutPage.giftCardsTitle")}</Text>
                <Text style={styles.giftCardHint}>
                  {t("checkoutPage.giftCardsHint")}
                </Text>
              </View>
              {!user ? (
                <Text style={styles.giftCardEmpty}>
                  {t("checkoutPage.loginGiftCards")}
                </Text>
              ) : loadingGiftCards ? (
                <Text style={styles.giftCardEmpty}>{t("checkoutPage.loadingGiftCards")}</Text>
              ) : giftCards.length ? (
                <View style={styles.giftCardList}>
                  {giftCards.map((card) => {
                    const selected = selectedGiftCardIds.includes(card.id);
                    const allocation = giftCardSelection.allocations.find(
                      (item) => item.id === card.id,
                    );
                    const available = numeric(card.available_balance_eur);
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.giftCardRow,
                          selected ? styles.giftCardRowActive : null,
                        ]}
                        onPress={() => toggleGiftCard(card.id)}
                      >
                        <View style={[styles.checkbox, selected ? styles.checkboxActive : null]}>
                          {selected ? <Text style={styles.checkboxText}>✓</Text> : null}
                        </View>
                        <View style={styles.giftCardTextBlock}>
                          <Text style={styles.giftCardName}>{card.card_name}</Text>
                          <Text style={styles.giftCardSerial}>{card.serial_number}</Text>
                        </View>
                        <View style={styles.giftCardAmounts}>
                          <Text style={styles.giftCardAvailable}>{formatEur(available, locale)}</Text>
                          {allocation ? (
                            <Text style={styles.giftCardApplied}>
                              {t("checkoutPage.applies")} {formatEur(allocation.amount, locale)}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.giftCardEmpty}>
                  {t("checkoutPage.emptyGiftCards")}
                </Text>
              )}
              {giftCardPaid > 0 ? (
                <View style={styles.giftCardTotals}>
                  <Text style={styles.giftCardTotalsText}>
                    {t("checkoutPage.applied")}: {formatEur(giftCardPaid, locale)}
                  </Text>
                  <Text style={styles.giftCardTotalsStrong}>
                    {t("checkoutPage.remaining")}: {formatEur(remainingDue, locale)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentMethodTitle}>{t("checkoutPage.cardStripe")}</Text>
              <Text style={styles.paymentMethodText}>
                {giftCardPaid > 0
                  ? t("checkoutPage.stripeRemaining", { amount: formatEur(remainingDue, locale) })
                  : t("checkoutPage.stripeInApp")}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t("checkoutPage.summary")}</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>{t("common.subtotal")}</Text>
              <Text style={styles.summaryValue}>{formatEur(subtotal, locale)}</Text>
            </View>
            {!resellToCompany ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t("common.delivery")}</Text>
                <Text style={styles.summaryValue}>{formatEur(shipping, locale)}</Text>
              </View>
            ) : null}
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
            {giftCardPaid > 0 ? (
              <>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>{t("checkoutPage.appliedGiftCards")}</Text>
                  <Text style={styles.giftCardDeduction}>-{formatEur(giftCardPaid, locale)}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.totalLabel}>{t("checkoutPage.remainingStripe")}</Text>
                  <Text style={styles.totalValue}>{formatEur(remainingDue, locale)}</Text>
                </View>
              </>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
              onPress={submit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? t("checkoutPage.submitting") : t("checkoutPage.confirm")}
              </Text>
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
  securePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFF8E7",
  },
  securePillText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 10,
  },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#071846",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    color: "#071846",
    paddingHorizontal: 12,
    fontWeight: "700",
  },
  countryBlock: {
    gap: 7,
  },
  countryLabel: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  countrySelect: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  countrySelectDisabled: {
    opacity: 0.55,
  },
  countrySelectText: {
    flex: 1,
    color: "#071846",
    fontWeight: "800",
  },
  countryChevron: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  countryDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  countryOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  countryOptionActive: {
    backgroundColor: "#FFF7DA",
  },
  countryOptionName: {
    color: "#071846",
    fontWeight: "800",
  },
  countryOptionPrice: {
    color: "#B07800",
    fontWeight: "900",
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#FFFDF8",
  },
  optionButtonActive: {
    backgroundColor: "#071846",
    borderColor: "#071846",
  },
  optionText: {
    color: "#071846",
    fontWeight: "900",
  },
  optionTextActive: {
    color: "#FFF",
  },
  resaleBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#071846",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  checkboxActive: {
    backgroundColor: "#071846",
  },
  checkboxText: {
    color: "#FFF",
    fontWeight: "900",
  },
  resaleText: {
    flex: 1,
    color: "#3D352A",
    lineHeight: 19,
  },
  resaleAmount: {
    color: "#071846",
    fontWeight: "900",
  },
  paymentTitle: {
    color: "#071846",
    fontWeight: "900",
    marginTop: 4,
  },
  giftCardPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 10,
  },
  giftCardHeader: {
    gap: 3,
  },
  giftCardTitle: {
    color: "#071846",
    fontSize: 15,
    fontWeight: "900",
  },
  giftCardHint: {
    color: "#665F54",
    fontSize: 12,
    lineHeight: 17,
  },
  giftCardEmpty: {
    color: "#665F54",
    fontSize: 12,
    lineHeight: 18,
  },
  giftCardList: {
    gap: 8,
  },
  giftCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF",
    padding: 10,
  },
  giftCardRowActive: {
    borderColor: theme.colors.gold,
    backgroundColor: "#FFF7DA",
  },
  giftCardTextBlock: {
    flex: 1,
    gap: 2,
  },
  giftCardName: {
    color: "#071846",
    fontWeight: "900",
  },
  giftCardSerial: {
    color: "#665F54",
    fontSize: 11,
  },
  giftCardAmounts: {
    alignItems: "flex-end",
    gap: 2,
  },
  giftCardAvailable: {
    color: "#071846",
    fontWeight: "900",
  },
  giftCardApplied: {
    color: "#0A7A35",
    fontSize: 11,
    fontWeight: "800",
  },
  giftCardTotals: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 8,
    gap: 4,
  },
  giftCardTotalsText: {
    color: "#665F54",
    fontSize: 12,
  },
  giftCardTotalsStrong: {
    color: "#071846",
    fontWeight: "900",
  },
  paymentMethod: {
    borderRadius: 14,
    backgroundColor: "#071846",
    padding: 14,
  },
  paymentMethodTitle: {
    color: "#FFF",
    fontWeight: "900",
  },
  paymentMethodText: {
    color: "#DDE5FF",
    marginTop: 3,
    fontSize: 12,
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
  giftCardDeduction: {
    color: "#0A7A35",
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
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1A0A0",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: {
    color: "#9A1B1B",
    fontWeight: "800",
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
});
