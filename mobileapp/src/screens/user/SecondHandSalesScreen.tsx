import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { getSecondHandProposals } from "../../services/secondHandProposal.service";
import type { SecondHandProposal, SecondHandProposalStatus } from "../../types";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onLogin: () => void;
  onNew: () => void;
  onOpen: (id: number) => void;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function eur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

function statusLabel(status: SecondHandProposalStatus, t: (key: string) => string) {
  return t(`secondHand.status.${status}`);
}

export default function SecondHandSalesScreen({ onLogin, onNew, onOpen }: Props) {
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();
  const [rows, setRows] = useState<SecondHandProposal[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    setFetching(true);
    setError("");
    getSecondHandProposals()
      .then((data) => mounted && setRows(data || []))
      .catch((err) => mounted && setError(err instanceof Error ? err.message : t("secondHand.loadError")))
      .finally(() => mounted && setFetching(false));
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#2C2C91" /></View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.guestTitle")}</Text>
          <Text style={styles.body}>{t("secondHand.guestText")}</Text>
          <TouchableOpacity style={styles.primary} onPress={onLogin}>
            <Text style={styles.primaryText}>{t("common.login")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.myProposals")}</Text>
          <Text style={styles.body}>{t("secondHand.listIntro")}</Text>
          <TouchableOpacity style={styles.primary} onPress={onNew}>
            <Text style={styles.primaryText}>{t("secondHand.newProposal")}</Text>
          </TouchableOpacity>
        </View>

        {fetching ? <ActivityIndicator color="#2C2C91" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!fetching && rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t("secondHand.emptyTitle")}</Text>
            <Text style={styles.body}>{t("secondHand.emptyText")}</Text>
            <TouchableOpacity style={styles.secondary} onPress={onNew}>
              <Text style={styles.secondaryText}>{t("secondHand.firstProposal")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {rows.map((proposal) => {
          const image = absoluteImageUrl(proposal.cover_image_url || proposal.images?.[0]?.image_url);
          return (
            <TouchableOpacity
              key={proposal.id}
              activeOpacity={0.86}
              style={styles.card}
              onPress={() => onOpen(proposal.id)}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbFallback}><Text style={styles.thumbText}>AK</Text></View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.itemName}>{proposal.item_type} {proposal.brand}</Text>
                <Text style={styles.meta}>{proposal.proposal_number}</Text>
                <Text style={styles.meta}>
                  {t("secondHand.desiredPrice")}: {eur(numeric(proposal.desired_price_eur), locale)}
                </Text>
                {numeric(proposal.offered_price_eur) > 0 ? (
                  <Text style={styles.offer}>{t("secondHand.akOffer")}: {eur(numeric(proposal.offered_price_eur), locale)}</Text>
                ) : null}
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{statusLabel(proposal.status, t)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFDF8",
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 28, backgroundColor: "#F7F5EF" },
  hero: { borderRadius: 22, padding: 18, gap: 10, backgroundColor: "#FFF" },
  eyebrow: { color: "#A87500", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#1D1D1B", fontSize: 30, lineHeight: 34, fontWeight: "900" },
  body: { color: "#61594E", lineHeight: 21 },
  primary: { minHeight: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1D1D1B" },
  primaryText: { color: "#FFF", fontWeight: "900" },
  secondary: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#DCB200" },
  secondaryText: { color: "#1D1D1B", fontWeight: "900" },
  error: { color: "#9B1010", fontWeight: "800" },
  empty: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 16, gap: 10 },
  emptyTitle: { color: "#071846", fontSize: 20, fontWeight: "900" },
  card: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 10 },
  thumb: { width: 62, height: 74, borderRadius: 12, backgroundColor: "#E6DED0" },
  thumbFallback: { width: 62, height: 74, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E6DED0" },
  thumbText: { color: "#8A7E6D", fontWeight: "900" },
  cardBody: { flex: 1, gap: 3 },
  itemName: { color: "#071846", fontSize: 16, fontWeight: "900" },
  meta: { color: "#61594E", fontSize: 12 },
  offer: { color: "#088238", fontSize: 12, fontWeight: "900" },
  statusPill: { maxWidth: 92, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#FFF8D9" },
  statusText: { color: "#7A5A00", fontSize: 10, fontWeight: "900", textAlign: "center" },
});
