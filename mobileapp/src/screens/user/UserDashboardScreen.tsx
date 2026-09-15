import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { appConfig } from "../../config/app";
import { theme } from "../../config/theme";
import { useAuth, type AuthUser } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { getFavorites } from "../../services/favorite.service";
import { getGiftCards } from "../../services/giftCard.service";
import { getOrders } from "../../services/order.service";
import { getRentals } from "../../services/rental.service";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onLogin: () => void;
  onLogout: () => void;
  onOpenShop: () => void;
  onOpenOrders: () => void;
  onOpenOrderDetails: (id: number) => void;
  onOpenProfile: () => void;
  onOpenGiftCards: () => void;
  onOpenFavorites: () => void;
  onOpenNotifications: () => void;
  onOpenAdminSecondHandProposals?: () => void;
};

type Order = {
  id?: number;
  order_number?: string;
  reference?: string;
  status?: string | null;
  payment_status?: string | null;
  total_eur?: number | string | null;
  total_aoa?: number | string | null;
  beneficiary_name?: string | null;
  created_at?: string | null;
  items?: Array<{ product_name?: string; product_image_url?: string | null }>;
};

type Rental = {
  id?: number;
  product_name?: string;
  product_image_url?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  status?: string | null;
};

type DashboardState = {
  orders: Order[];
  rentals: Rental[];
  favorites: unknown[];
  giftCards: unknown[];
};

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

function fullName(user: AuthUser | null, fallback: string) {
  if (!user) return fallback;
  const composed = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return user.name || composed || user.email || fallback;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
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

function StatusStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, active ? styles.stepIconActive : null]}>
        <Text style={[styles.stepIconText, active ? styles.stepIconTextActive : null]}>
          ✓
        </Text>
      </View>
      <Text style={[styles.stepText, active ? styles.stepTextActive : null]}>
        {label}
      </Text>
    </View>
  );
}

function MenuIcon({
  type,
}: {
  type: "orders" | "rentals" | "resales" | "cards" | "profile" | "favorites" | "notifications" | "secondHandAdmin";
}) {
  if (type === "orders") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.menuBox} />
        <View style={styles.menuLine} />
        <View style={styles.menuLineShort} />
      </View>
    );
  }
  if (type === "rentals") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.hangerHook} />
        <View style={styles.hangerBar} />
      </View>
    );
  }
  if (type === "cards") {
    return <View style={styles.cardIcon} />;
  }
  if (type === "favorites") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.favoriteLeft} />
        <View style={styles.favoriteRight} />
        <View style={styles.favoriteTip} />
      </View>
    );
  }
  if (type === "notifications") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.notificationDome} />
        <View style={styles.notificationBody} />
        <View style={styles.notificationDot} />
      </View>
    );
  }
  if (type === "profile") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.profileHead} />
        <View style={styles.profileBody} />
      </View>
    );
  }
  if (type === "secondHandAdmin") {
    return (
      <View style={styles.menuIconCanvas}>
        <View style={styles.cardIcon} />
        <View style={styles.resaleArrowSmall} />
      </View>
    );
  }
  return (
    <View style={styles.menuIconCanvas}>
      <View style={styles.resaleArrow} />
    </View>
  );
}

function OrderImage({ order }: { order: Order }) {
  const image = absoluteImageUrl(order.items?.[0]?.product_image_url);
  if (image) return <Image source={{ uri: image }} style={styles.orderImage} />;
  return (
    <View style={styles.orderImagePlaceholder}>
      <Text style={styles.orderImageText}>AK</Text>
    </View>
  );
}

export default function UserDashboardScreen({
  onLogin,
  onLogout,
  onOpenShop,
  onOpenOrders,
  onOpenOrderDetails,
  onOpenProfile,
  onOpenGiftCards,
  onOpenFavorites,
  onOpenNotifications,
  onOpenAdminSecondHandProposals,
}: Props) {
  const { user, loading, logout } = useAuth();
  const { locale, t } = useLanguage();
  const [dashboard, setDashboard] = useState<DashboardState>({
    orders: [],
    rentals: [],
    favorites: [],
    giftCards: [],
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    async function loadDashboard() {
      setDataLoading(true);
      setError("");
      try {
        const [ordersResult, rentalsResult, favoritesResult, giftCardsResult] =
          await Promise.allSettled([
            getOrders(),
            getRentals(),
            getFavorites(),
            getGiftCards(),
          ]);

        if (!mounted) return;

        setDashboard({
          orders:
            ordersResult.status === "fulfilled"
              ? normalizeArray<Order>(ordersResult.value, ["orders"])
              : [],
          rentals:
            rentalsResult.status === "fulfilled"
              ? normalizeArray<Rental>(rentalsResult.value, ["rentals"])
              : [],
          favorites:
            favoritesResult.status === "fulfilled"
              ? normalizeArray<unknown>(favoritesResult.value, ["favorites"])
              : [],
          giftCards:
            giftCardsResult.status === "fulfilled"
              ? normalizeArray<unknown>(giftCardsResult.value, ["giftCards", "gift_cards"])
              : [],
        });

        if (
          [ordersResult, rentalsResult, favoritesResult, giftCardsResult].some(
            (result) => result.status === "rejected",
          )
        ) {
          setError(t("home.loadPartialError"));
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const name = fullName(user, t("profile.fallbackName"));
  const referralCode = user?.referral_code || "";
  const referralLink = referralCode
    ? `${appConfig.webUrl}/register?ref=${encodeURIComponent(referralCode)}`
    : "";
  const total = useMemo(
    () =>
      dashboard.orders.reduce(
        (sum, order) => sum + numeric(order.total_eur),
        0,
      ),
    [dashboard.orders],
  );
  const recentOrders = [...dashboard.orders]
    .sort((a, b) => {
      const left = a.created_at ? new Date(a.created_at).getTime() : 0;
      const right = b.created_at ? new Date(b.created_at).getTime() : 0;
      return right - left;
    })
    .slice(0, 3);
  const nextRental = [...dashboard.rentals]
    .sort((a, b) => {
      const left = a.rental_start_date ? new Date(a.rental_start_date).getTime() : 0;
      const right = b.rental_start_date ? new Date(b.rental_start_date).getTime() : 0;
      return left - right;
    })[0];

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const shareReferral = async () => {
    if (!referralLink) return;
    await Share.share({
      message: `${t("account.referralShareMessage")} ${referralLink}`,
      url: referralLink,
      title: t("account.referralTitle"),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerScreen}>
          <ActivityIndicator color="#071846" />
          <Text style={styles.loadingText}>{t("account.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.guestContent}>
            <View style={styles.guestCard}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>AK</Text>
              </View>
              <Text style={styles.eyebrow}>{t("account.guestEyebrow")}</Text>
              <Text style={styles.guestTitle}>{t("account.guestTitle")}</Text>
              <Text style={styles.guestText}>{t("account.guestText")}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
                <Text style={styles.primaryButtonText}>{t("account.login")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={onOpenShop}>
                <Text style={styles.secondaryButtonText}>{t("account.continueShop")}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" backgroundColor="#071846" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHero}>
            <View style={styles.heroTop}>
              <TouchableOpacity style={styles.iconRound}>
                <Text style={styles.iconGlyph}>↺</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconRound}>
                <Text style={styles.iconGlyph}>⚙</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.identityRow}>
              {user.avatar_url ? (
                <Image
                  source={{ uri: absoluteImageUrl(user.avatar_url) }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(name)}</Text>
                </View>
              )}
              <View style={styles.identityText}>
                <Text numberOfLines={1} style={styles.userName}>
                  {name}
                </Text>
                <Text numberOfLines={1} style={styles.userEmail}>
                  {user.email || "client@akfashionplus.com"}
                </Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>{t("common.logout")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{dashboard.orders.length}</Text>
                <Text style={styles.metricLabel}>{t("account.orders")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{dashboard.rentals.length}</Text>
                <Text style={styles.metricLabel}>{t("account.rentals")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{dashboard.favorites.length}</Text>
                <Text style={styles.metricLabel}>{t("account.favorites")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{formatEur(total, locale)}</Text>
                <Text style={styles.metricLabel}>{t("common.total")}</Text>
              </View>
            </View>
          </View>

          {error ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{error}</Text>
            </View>
          ) : null}

          {referralLink ? (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t("account.referralTitle")}</Text>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => void shareReferral()}
                >
                  <Text style={styles.shareButtonText}>{t("account.referralShare")}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.referralText}>{t("account.referralText")}</Text>
              <View style={styles.referralBox}>
                <Text style={styles.referralCode}>{referralCode}</Text>
                <Text selectable style={styles.referralLink}>
                  {referralLink}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("account.history")}</Text>
            <View style={styles.menuList}>
              {[
                {
                  type: "orders",
                  label: t("account.orders"),
                  detail: t("home.articleCount", { count: dashboard.orders.length }),
                  action: onOpenOrders,
                },
                {
                  type: "rentals",
                  label: t("account.rentals"),
                  detail: t("home.articleCount", { count: dashboard.rentals.length }),
                  action: onOpenOrders,
                },
                {
                  type: "resales",
                  label: t("account.resales"),
                  detail: t("account.resalesDetail"),
                  action: onOpenOrders,
                },
                {
                  type: "favorites",
                  label: t("account.favorites"),
                  detail: t("home.articleCount", { count: dashboard.favorites.length }),
                  action: onOpenFavorites,
                },
                {
                  type: "cards",
                  label: t("account.giftCards"),
                  detail: t("home.modelCount", { count: dashboard.giftCards.length }),
                  action: onOpenGiftCards,
                },
                {
                  type: "notifications",
                  label: t("account.notifications"),
                  detail: t("account.notificationsDetail"),
                  action: onOpenNotifications,
                },
                ...(user.role === "admin" && onOpenAdminSecondHandProposals
                  ? [
                      {
                        type: "secondHandAdmin",
                        label: t("secondHand.adminTitle"),
                        detail: t("secondHand.adminDetail"),
                        action: onOpenAdminSecondHandProposals,
                      },
                    ]
                  : []),
                {
                  type: "profile",
                  label: t("account.profile"),
                  detail: t("account.profileDetail"),
                  action: onOpenProfile,
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuRow}
                  onPress={item.action}
                >
                  <MenuIcon
                    type={
                      item.type as
                        | "orders"
                        | "rentals"
                        | "resales"
                        | "cards"
                        | "profile"
                        | "favorites"
                        | "notifications"
                        | "secondHandAdmin"
                    }
                  />
                  <View style={styles.menuTextBlock}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDetail}>{item.detail}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("account.myOrders")}</Text>
              {dataLoading ? <ActivityIndicator color="#071846" /> : <Text style={styles.seeAll}>{t("account.viewAll")}</Text>}
            </View>
            <View style={styles.stepsRow}>
              <StatusStep label={t("account.orderStatusPending")} active={dashboard.orders.some((order) => order.status === "pending")} />
              <StatusStep label={t("account.orderStatusConfirmed")} active={dashboard.orders.some((order) => order.status === "confirmed")} />
              <StatusStep label={t("account.orderStatusProcessing")} active={dashboard.orders.some((order) => order.status === "processing")} />
              <StatusStep label={t("account.orderStatusCompleted")} active={dashboard.orders.some((order) => order.status === "completed")} />
            </View>

            {recentOrders.length ? (
              recentOrders.map((order) => (
                <TouchableOpacity
                  key={order.id || order.order_number}
                  style={styles.orderRow}
                  onPress={() => {
                    const id = Number(order.id);
                    if (Number.isFinite(id)) onOpenOrderDetails(id);
                  }}
                >
                  <OrderImage order={order} />
                  <View style={styles.orderBody}>
                    <Text numberOfLines={1} style={styles.orderRef}>
                      {order.order_number || order.reference || t("account.orderFallback")}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {formatDate(order.created_at, locale)} - {order.beneficiary_name || t("account.beneficiary")}
                    </Text>
                  </View>
                  <View style={styles.orderAmount}>
                    <Text style={styles.orderTotal}>{formatEur(numeric(order.total_eur), locale)}</Text>
                    <Text style={styles.orderStatus}>
                      {statusLabel(order.payment_status || order.status, t)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t("account.noOrdersTitle")}</Text>
                <Text style={styles.emptyText}>{t("account.noOrdersText")}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("account.myRentals")}</Text>
              <Text style={styles.seeAll}>{t("account.viewAll")}</Text>
            </View>
            {nextRental ? (
              <View style={styles.rentalCard}>
                {absoluteImageUrl(nextRental.product_image_url) ? (
                  <Image
                    source={{ uri: absoluteImageUrl(nextRental.product_image_url) }}
                    style={styles.rentalImage}
                  />
                ) : (
                  <View style={styles.rentalImagePlaceholder} />
                )}
                <View style={styles.rentalBody}>
                  <Text numberOfLines={1} style={styles.rentalName}>
                    {nextRental.product_name || t("account.activeRentalFallback")}
                  </Text>
                  <Text style={styles.rentalDate}>
                    {formatDate(nextRental.rental_start_date, locale)} -{" "}
                    {formatDate(nextRental.rental_end_date, locale)}
                  </Text>
                </View>
                <Text style={styles.rentalStatus}>{statusLabel(nextRental.status, t)}</Text>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t("account.noRentalsTitle")}</Text>
                <Text style={styles.emptyText}>{t("account.noRentalsText")}</Text>
              </View>
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
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.soft,
  },
  loadingText: {
    color: "#071846",
    fontWeight: "800",
  },
  guestContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },
  guestCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 22,
    gap: 12,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  logoText: {
    color: theme.colors.gold,
    fontSize: 30,
    fontWeight: "900",
  },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  guestTitle: {
    color: "#071846",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    textAlign: "center",
  },
  guestText: {
    color: "#5F564B",
    lineHeight: 21,
    textAlign: "center",
  },
  primaryButton: {
    alignSelf: "stretch",
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
  secondaryButton: {
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.gold,
    backgroundColor: "#FFFDF8",
  },
  secondaryButtonText: {
    color: "#071846",
    fontWeight: "900",
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  profileHero: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#071846",
    padding: 14,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconRound: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  iconGlyph: {
    color: "#FFF",
    fontWeight: "900",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.gold,
    backgroundColor: "#0B1E55",
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  avatarText: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: "900",
  },
  identityText: {
    flex: 1,
  },
  userName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },
  userEmail: {
    color: "#DDE5FF",
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  metricsCard: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "#FFF",
    paddingVertical: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    color: "#071846",
    fontSize: 14,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#5F564B",
    fontSize: 9,
    fontWeight: "800",
  },
  warningBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0A21B",
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  warningText: {
    color: "#755300",
    fontWeight: "800",
  },
  shareButton: {
    minHeight: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 14,
  },
  shareButtonText: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  referralText: {
    color: "#665F54",
    lineHeight: 20,
  },
  referralBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF8E7",
    padding: 12,
    gap: 5,
  },
  referralCode: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  referralLink: {
    color: "#665F54",
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  seeAll: {
    color: "#7A5A00",
    fontSize: 12,
    fontWeight: "900",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
  },
  stepIconActive: {
    borderColor: "#071846",
    backgroundColor: "#EEF2FF",
  },
  stepIconText: {
    color: "#A19887",
    fontSize: 12,
    fontWeight: "900",
  },
  stepIconTextActive: {
    color: "#071846",
  },
  stepText: {
    color: "#756C5B",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  stepTextActive: {
    color: "#071846",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
    backgroundColor: "#FFFDF8",
  },
  orderImage: {
    width: 48,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#DDD5CB",
  },
  orderImagePlaceholder: {
    width: 48,
    height: 58,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD5CB",
  },
  orderImageText: {
    color: "#8A8374",
    fontWeight: "900",
  },
  orderBody: {
    flex: 1,
    gap: 3,
  },
  orderRef: {
    color: "#071846",
    fontWeight: "900",
  },
  orderMeta: {
    color: "#665F54",
    fontSize: 11,
  },
  orderAmount: {
    alignItems: "flex-end",
    gap: 3,
  },
  orderTotal: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  orderStatus: {
    color: "#0A7B34",
    fontSize: 10,
    fontWeight: "900",
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFF8E7",
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    color: "#071846",
    fontWeight: "900",
  },
  emptyText: {
    color: "#665F54",
  },
  rentalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#FFF8E7",
    padding: 10,
  },
  rentalImage: {
    width: 52,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#DDD5CB",
  },
  rentalImagePlaceholder: {
    width: 52,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#DDD5CB",
  },
  rentalBody: {
    flex: 1,
  },
  rentalName: {
    color: "#071846",
    fontWeight: "900",
  },
  rentalDate: {
    color: "#665F54",
    fontSize: 11,
    marginTop: 3,
  },
  rentalStatus: {
    color: "#071846",
    fontSize: 10,
    fontWeight: "900",
  },
  menuList: {
    gap: 8,
  },
  menuRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  menuIconCanvas: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBox: {
    width: 18,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#071846",
  },
  menuLine: {
    position: "absolute",
    width: 10,
    height: 2,
    backgroundColor: "#071846",
  },
  menuLineShort: {
    position: "absolute",
    top: 18,
    width: 8,
    height: 2,
    backgroundColor: "#071846",
  },
  hangerHook: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#071846",
    borderTopRightRadius: 8,
  },
  hangerBar: {
    width: 22,
    height: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#071846",
    transform: [{ rotate: "8deg" }],
  },
  cardIcon: {
    width: 24,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#071846",
  },
  favoriteLeft: {
    position: "absolute",
    top: 6,
    left: 7,
    width: 9,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#071846",
    transform: [{ rotate: "-42deg" }],
  },
  favoriteRight: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 9,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#071846",
    transform: [{ rotate: "42deg" }],
  },
  favoriteTip: {
    position: "absolute",
    top: 12,
    width: 10,
    height: 10,
    backgroundColor: "#071846",
    transform: [{ rotate: "45deg" }],
  },
  notificationDome: {
    width: 13,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#071846",
  },
  notificationBody: {
    width: 18,
    height: 9,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#071846",
  },
  notificationDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#071846",
    marginTop: 1,
  },
  profileHead: {
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#071846",
  },
  profileBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#071846",
    marginTop: 2,
  },
  resaleArrow: {
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#071846",
    transform: [{ rotate: "45deg" }],
  },
  resaleArrowSmall: {
    position: "absolute",
    right: 1,
    top: 1,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#071846",
    transform: [{ rotate: "45deg" }],
  },
  menuTextBlock: {
    flex: 1,
  },
  menuLabel: {
    color: "#071846",
    fontWeight: "900",
  },
  menuDetail: {
    color: "#665F54",
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: "#071846",
    fontSize: 26,
    fontWeight: "500",
  },
});
