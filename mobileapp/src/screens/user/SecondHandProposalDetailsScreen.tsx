import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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
import { useLanguage } from "../../hooks/useLanguage";
import {
  acceptSecondHandProposal,
  getSecondHandProposal,
  rejectSecondHandProposal,
} from "../../services/secondHandProposal.service";
import type { SecondHandProposal, SecondHandProposalStatus } from "../../types";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  id: number;
  onBack: () => void;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function eur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

function Step({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, done ? styles.stepDone : active ? styles.stepActive : null]}>
        <Text style={styles.stepDotText}>{done ? "✓" : active ? "•" : ""}</Text>
      </View>
      <Text style={[styles.stepLabel, active || done ? styles.stepLabelActive : null]}>{label}</Text>
    </View>
  );
}

export default function SecondHandProposalDetailsScreen({ id, onBack }: Props) {
  const { locale, t } = useLanguage();
  const [proposal, setProposal] = useState<SecondHandProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setProposal(await getSecondHandProposal(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const progress = useMemo(() => {
    const status = proposal?.status;
    const order: SecondHandProposalStatus[] = [
      "submitted",
      "under_review",
      "offer_sent",
      "accepted",
      "awaiting_item",
      "item_received",
      "verified",
      "paid",
      "completed",
    ];
    const index = Math.max(0, order.indexOf(status || "submitted"));
    return { status, index };
  }, [proposal?.status]);

  const answer = async (accepted: boolean) => {
    setUpdating(true);
    try {
      setProposal(accepted ? await acceptSecondHandProposal(id) : await rejectSecondHandProposal(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.updateError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#071846" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t("secondHand.detailsTitle")}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {proposal ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>{proposal.proposal_number}</Text>
              <Text style={styles.title}>{proposal.item_type} {proposal.brand}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{t(`secondHand.status.${proposal.status}`)}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
              {(proposal.images || []).map((image) => {
                const uri = absoluteImageUrl(image.image_url);
                return uri ? <Image key={image.id || image.image_url} source={{ uri }} style={styles.image} /> : null;
              })}
            </ScrollView>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.statusProgress")}</Text>
              <Step label={t("secondHand.status.submitted")} done={progress.index > 0} active={progress.status === "submitted"} />
              <Step label={t("secondHand.status.under_review")} done={progress.index > 1} active={progress.status === "under_review"} />
              <Step label={t("secondHand.status.offer_sent")} done={progress.index > 2} active={progress.status === "offer_sent"} />
              <Step label={t("secondHand.status.accepted")} done={progress.index > 3} active={progress.status === "accepted"} />
              <Step label={t("secondHand.status.completed")} done={proposal.status === "completed"} active={["paid", "completed"].includes(proposal.status)} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.summary")}</Text>
              <Info label={t("secondHand.desiredPrice")} value={eur(numeric(proposal.desired_price_eur), locale)} />
              <Info label={t("secondHand.akOffer")} value={numeric(proposal.offered_price_eur) ? eur(numeric(proposal.offered_price_eur), locale) : "-"} />
              <Info label={t("secondHand.finalPrice")} value={numeric(proposal.final_price_eur) ? eur(numeric(proposal.final_price_eur), locale) : "-"} />
              <Info label={t("secondHand.condition")} value={t(`secondHand.conditionState.${proposal.condition_state}`)} />
              <Info label={t("secondHand.bankNumber")} value={proposal.bank_account_number_masked || "-"} />
            </View>

            {proposal.status === "offer_sent" ? (
              <View style={styles.offerBox}>
                <Text style={styles.sectionTitle}>{t("secondHand.offerSentTitle")}</Text>
                <Text style={styles.body}>{t("secondHand.offerSentText")}</Text>
                <Text style={styles.offerAmount}>{eur(numeric(proposal.offered_price_eur), locale)}</Text>
                <TouchableOpacity style={styles.primary} disabled={updating} onPress={() => void answer(true)}>
                  <Text style={styles.primaryText}>{t("secondHand.accept")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondary} disabled={updating} onPress={() => void answer(false)}>
                  <Text style={styles.secondaryText}>{t("secondHand.reject")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {proposal.handover_instructions ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("secondHand.instructions")}</Text>
                <Text style={styles.body}>{proposal.handover_instructions}</Text>
              </View>
            ) : null}

            {proposal.payment_reference || proposal.status === "paid" || proposal.status === "completed" ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("secondHand.payment")}</Text>
                <Info label={t("secondHand.paymentReference")} value={proposal.payment_reference || "-"} />
                <Info label={t("secondHand.finalPrice")} value={eur(numeric(proposal.final_price_eur || proposal.offered_price_eur), locale)} />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFDF8",
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 26, backgroundColor: "#F7F5EF" },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  backText: { color: "#071846", fontSize: 28, fontWeight: "900" },
  refreshText: { color: "#071846", fontSize: 20, fontWeight: "900" },
  topTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  hero: { borderRadius: 22, backgroundColor: "#071846", padding: 18, gap: 8 },
  eyebrow: { color: theme.colors.gold, fontSize: 12, fontWeight: "900" },
  title: { color: "#FFF", fontSize: 27, lineHeight: 31, fontWeight: "900" },
  statusPill: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#E9F9EF", paddingHorizontal: 12, paddingVertical: 7 },
  statusText: { color: "#087E36", fontWeight: "900" },
  images: { gap: 10 },
  image: { width: 128, height: 150, borderRadius: 16, backgroundColor: "#E6DED0" },
  card: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 15, gap: 10 },
  offerBox: { borderRadius: 18, backgroundColor: "#FFF8D9", borderWidth: 1, borderColor: "#DCB200", padding: 15, gap: 10 },
  sectionTitle: { color: "#071846", fontSize: 19, fontWeight: "900" },
  body: { color: "#61594E", lineHeight: 21 },
  offerAmount: { color: "#087E36", fontSize: 30, fontWeight: "900", textAlign: "center" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: { width: 24, height: 24, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.line, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  stepDone: { borderColor: "#087E36", backgroundColor: "#087E36" },
  stepActive: { borderColor: "#071846", backgroundColor: "#071846" },
  stepDotText: { color: "#FFF", fontWeight: "900" },
  stepLabel: { color: "#6A6257", fontWeight: "800" },
  stepLabelActive: { color: "#071846" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line, paddingBottom: 8 },
  infoLabel: { color: "#61594E", flex: 1 },
  infoValue: { color: "#071846", flex: 1, textAlign: "right", fontWeight: "900" },
  primary: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  primaryText: { color: "#FFF", fontWeight: "900" },
  secondary: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#071846", backgroundColor: "#FFF" },
  secondaryText: { color: "#071846", fontWeight: "900" },
  error: { color: "#9B1010", fontWeight: "800" },
});
