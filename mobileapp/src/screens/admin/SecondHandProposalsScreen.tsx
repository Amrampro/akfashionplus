import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { getAdminSecondHandProposals } from "../../services/secondHandProposal.service";
import type { SecondHandProposal, SecondHandProposalStatus } from "../../types";

type Props = {
  onBack: () => void;
  onOpen: (id: number) => void;
};

const statuses: Array<SecondHandProposalStatus | "all"> = [
  "all",
  "submitted",
  "under_review",
  "offer_sent",
  "accepted",
  "awaiting_item",
  "verified",
  "paid",
  "completed",
  "rejected",
];

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function eur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

export default function SecondHandProposalsScreen({ onBack, onOpen }: Props) {
  const { locale, t } = useLanguage();
  const [rows, setRows] = useState<SecondHandProposal[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SecondHandProposalStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getAdminSecondHandProposals());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((proposal) => {
      if (status !== "all" && proposal.status !== status) return false;
      if (!needle) return true;
      return [
        proposal.proposal_number,
        proposal.user_name,
        proposal.user_email,
        proposal.item_type,
        proposal.brand,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [query, rows, status]);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t("secondHand.adminListTitle")}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.adminTitle")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.searchPlaceholder")}
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {statuses.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, status === item ? styles.chipActive : null]}
                onPress={() => setStatus(item)}
              >
                <Text style={[styles.chipText, status === item ? styles.chipTextActive : null]}>
                  {item === "all" ? t("secondHand.filterAll") : t(`secondHand.status.${item}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? <ActivityIndicator color="#071846" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {filtered.map((proposal) => (
          <TouchableOpacity key={proposal.id} style={styles.row} onPress={() => onOpen(proposal.id)}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{proposal.item_type} {proposal.brand}</Text>
              <Text style={styles.meta}>{proposal.proposal_number}</Text>
              <Text style={styles.meta}>{proposal.user_name || proposal.user_email || "-"}</Text>
            </View>
            <View style={styles.rowSide}>
              <Text style={styles.amount}>{eur(numeric(proposal.desired_price_eur), locale)}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{t(`secondHand.status.${proposal.status}`)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  content: { padding: 16, gap: 14, paddingBottom: 26, backgroundColor: "#F7F5EF" },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  backText: { color: "#071846", fontSize: 28, fontWeight: "900" },
  refreshText: { color: "#071846", fontSize: 20, fontWeight: "900" },
  topTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  hero: { borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 16, gap: 12 },
  eyebrow: { color: "#A87500", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#071846", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 14, color: "#071846", backgroundColor: "#FFFDF8", fontWeight: "800" },
  chips: { gap: 8 },
  chip: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.line, justifyContent: "center", paddingHorizontal: 12, backgroundColor: "#FFFDF8" },
  chipActive: { borderColor: "#071846", backgroundColor: "#071846" },
  chipText: { color: "#5F564B", fontWeight: "800" },
  chipTextActive: { color: "#FFF" },
  row: { flexDirection: "row", borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 14, gap: 12 },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { color: "#071846", fontSize: 16, fontWeight: "900" },
  meta: { color: "#61594E", fontSize: 12 },
  rowSide: { alignItems: "flex-end", gap: 8 },
  amount: { color: "#071846", fontWeight: "900" },
  statusPill: { maxWidth: 110, borderRadius: 999, backgroundColor: "#E9F9EF", paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: "#087E36", fontSize: 10, fontWeight: "900", textAlign: "center" },
  error: { color: "#9B1010", fontWeight: "800" },
});
