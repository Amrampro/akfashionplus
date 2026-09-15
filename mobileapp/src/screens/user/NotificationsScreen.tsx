import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification.service";

type Props = {
  onBack: () => void;
  onLogin: () => void;
};

type NotificationRow = {
  id: number;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  is_read?: boolean | number | null;
  read_at?: string | null;
  created_at?: string | null;
};

function isUnread(notification: NotificationRow) {
  return notification.is_read !== true && notification.is_read !== 1;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeList(payload: unknown): NotificationRow[] {
  if (Array.isArray(payload)) return payload as NotificationRow[];
  if (payload && typeof payload === "object" && "rows" in payload) {
    const rows = (payload as { rows?: unknown }).rows;
    return Array.isArray(rows) ? (rows as NotificationRow[]) : [];
  }
  return [];
}

export default function NotificationsScreen({ onBack, onLogin }: Props) {
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter(isUnread).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingRows(true);
    setError("");
    try {
      const result = await getNotifications<unknown>();
      setNotifications(normalizeList(result));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("notificationsPage.loadError"),
      );
    } finally {
      setLoadingRows(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const openNotification = async (notification: NotificationRow) => {
    setSelected(notification);
    if (!isUnread(notification)) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true, read_at: new Date().toISOString() }
          : item,
      ),
    );

    try {
      await markNotificationRead(notification.id);
    } catch {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: notification.is_read, read_at: notification.read_at }
            : item,
        ),
      );
    }
  };

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at || new Date().toISOString(),
      })),
    );
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previous);
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
            <Text style={styles.title}>{t("notificationsPage.title")}</Text>
            <Text style={styles.body}>
              {t("notificationsPage.guestText")}
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
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t("notificationsPage.messages")}</Text>
              <Text style={styles.title}>{t("notificationsPage.title")}</Text>
              <Text style={styles.body}>
                {t("notificationsPage.unreadCount", { count: unreadCount })}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={loadNotifications}>
              <Text style={styles.secondaryButtonText}>{t("common.refresh")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryPill, unreadCount === 0 ? styles.disabledButton : null]}
              onPress={markAllRead}
              disabled={unreadCount === 0}
            >
              <Text style={styles.primaryPillText}>{t("notificationsPage.markAllRead")}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.listCard}>
            {loadingRows ? (
              <View style={styles.centerInline}>
                <ActivityIndicator color="#071846" />
                <Text style={styles.body}>{t("notificationsPage.loading")}</Text>
              </View>
            ) : notifications.length ? (
              notifications.map((notification) => {
                const unread = isUnread(notification);
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[styles.notificationRow, unread ? styles.notificationUnread : null]}
                    onPress={() => openNotification(notification)}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.dot, unread ? styles.dotUnread : null]} />
                    <View style={styles.notificationCopy}>
                      <Text
                        numberOfLines={2}
                        style={[styles.notificationTitle, unread ? styles.boldText : null]}
                      >
                        {notification.title || t("notificationsPage.fallbackTitle")}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.notificationMessage, unread ? styles.boldMessage : null]}
                      >
                        {notification.message || t("notificationsPage.fallbackMessage")}
                      </Text>
                      <Text style={styles.dateText}>
                        {formatDate(notification.created_at, locale)}
                      </Text>
                    </View>
                    {unread ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{t("notificationsPage.unread")}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t("notificationsPage.emptyTitle")}</Text>
                <Text style={styles.body}>
                  {t("notificationsPage.emptyText")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={Boolean(selected)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.eyebrow}>{selected?.type || t("notificationsPage.title")}</Text>
                  <Text style={styles.modalTitle}>
                    {selected?.title || t("notificationsPage.fallbackTitle")}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                  <Text style={styles.closeText}>{t("common.close")}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDate}>{formatDate(selected?.created_at, locale)}</Text>
              <Text style={styles.modalMessage}>
                {selected?.message || t("notificationsPage.fallbackMessage")}
              </Text>
            </View>
          </View>
        </Modal>
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
  actionsRow: { flexDirection: "row", gap: 10 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryButtonText: { color: "#FFF", fontWeight: "900" },
  primaryPill: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryPillText: { color: "#FFF", fontWeight: "900" },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.gold,
    backgroundColor: "#FFFDF8",
  },
  secondaryButtonText: { color: "#071846", fontWeight: "900" },
  disabledButton: { opacity: 0.45 },
  guestCard: {
    margin: 16,
    padding: 18,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    backgroundColor: theme.colors.paper,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  notificationUnread: { backgroundColor: "#FFF8E7" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#D9D0C2",
  },
  dotUnread: { backgroundColor: "#CF1F28" },
  notificationCopy: { flex: 1, gap: 4 },
  notificationTitle: { color: "#071846", fontSize: 16, fontWeight: "700" },
  notificationMessage: { color: "#625B50", lineHeight: 19 },
  boldText: { fontWeight: "900" },
  boldMessage: { color: "#071846", fontWeight: "800" },
  dateText: { color: "#8A8374", fontSize: 11, fontWeight: "700" },
  unreadBadge: {
    borderRadius: 999,
    backgroundColor: "#CF1F28",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  unreadBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  centerInline: { alignItems: "center", gap: 10, padding: 24 },
  emptyState: { gap: 8, padding: 18 },
  emptyTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2A7A7",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: { color: "#9B1010", fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4, 12, 33, 0.45)",
  },
  modalCard: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.paper,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    color: "#071846",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: { color: "#071846", fontWeight: "900" },
  modalDate: { color: "#8A8374", fontWeight: "800" },
  modalMessage: { color: "#2F2B25", fontSize: 16, lineHeight: 24 },
});
