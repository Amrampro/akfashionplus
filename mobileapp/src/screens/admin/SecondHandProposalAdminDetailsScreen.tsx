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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../hooks/useLanguage";
import {
  confirmSecondHandProposalPayment,
  evaluateSecondHandProposal,
  getAdminSecondHandProposal,
  markSecondHandProposalReceived,
  setSecondHandProposalInstructions,
  updateSecondHandProposalStatus,
  verifySecondHandProposal,
} from "../../services/secondHandProposal.service";
import type { SecondHandHandoverMethod, SecondHandProposal } from "../../types";
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

export default function SecondHandProposalAdminDetailsScreen({ id, onBack }: Props) {
  const { locale, t } = useLanguage();
  const [proposal, setProposal] = useState<SecondHandProposal | null>(null);
  const [offer, setOffer] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<SecondHandHandoverMethod>("dropoff");
  const [instructions, setInstructions] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminSecondHandProposal(id);
      setProposal(data);
      setOffer(data.offered_price_eur ? String(data.offered_price_eur) : "");
      setNotes(data.admin_notes || "");
      setInstructions(data.handover_instructions || "");
      setMethod(data.handover_method || "dropoff");
      setPaymentReference(data.payment_reference || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const run = async (task: () => Promise<SecondHandProposal>) => {
    setSaving(true);
    setError("");
    try {
      setProposal(await task());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.updateError"));
    } finally {
      setSaving(false);
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
          <Text style={styles.topTitle}>{t("secondHand.adminTitle")}</Text>
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
              <Text style={styles.body}>{proposal.user_name || proposal.user_email || "-"}</Text>
              <Text style={styles.status}>{t(`secondHand.status.${proposal.status}`)}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
              {(proposal.images || []).map((image) => {
                const uri = absoluteImageUrl(image.image_url);
                return uri ? <Image key={image.id || image.image_url} source={{ uri }} style={styles.image} /> : null;
              })}
            </ScrollView>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.summary")}</Text>
              <Info label={t("secondHand.desiredPrice")} value={eur(numeric(proposal.desired_price_eur), locale)} />
              <Info label={t("secondHand.condition")} value={t(`secondHand.conditionState.${proposal.condition_state}`)} />
              <Info label={t("secondHand.size")} value={proposal.size || "-"} />
              <Info label={t("secondHand.color")} value={proposal.color || "-"} />
              <Info label={t("secondHand.bankHolder")} value={proposal.bank_account_holder || "-"} />
              <Info label={t("secondHand.bankNumber")} value={proposal.bank_account_number || proposal.bank_account_number_masked || "-"} />
              <Info label={t("secondHand.bankName")} value={proposal.bank_name || "-"} />
              <Text style={styles.body}>{proposal.description || "-"}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.offer")}</Text>
              <TextInput
                style={styles.input}
                value={offer}
                keyboardType="decimal-pad"
                placeholder="30,00"
                onChangeText={setOffer}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                value={notes}
                multiline
                placeholder={t("secondHand.notes")}
                onChangeText={setNotes}
              />
              <TouchableOpacity
                style={styles.primary}
                disabled={saving}
                onPress={() => run(() => evaluateSecondHandProposal(id, { offered_price_eur: Number(offer.replace(",", ".")), admin_notes: notes }))}
              >
                <Text style={styles.primaryText}>{t("secondHand.sendOffer")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondary}
                disabled={saving}
                onPress={() => run(() => updateSecondHandProposalStatus(id, { status: "under_review", admin_notes: notes }))}
              >
                <Text style={styles.secondaryText}>{t("secondHand.status.under_review")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.instructions")}</Text>
              <View style={styles.segment}>
                {(["dropoff", "shipping"] as SecondHandHandoverMethod[]).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.segmentButton, method === item ? styles.segmentActive : null]}
                    onPress={() => setMethod(item)}
                  >
                    <Text style={[styles.segmentText, method === item ? styles.segmentTextActive : null]}>
                      {item === "dropoff" ? t("secondHand.handoverDropoff") : t("secondHand.handoverShipping")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={instructions}
                multiline
                placeholder={t("secondHand.instructions")}
                onChangeText={setInstructions}
              />
              <TouchableOpacity
                style={styles.primary}
                disabled={saving}
                onPress={() => run(() => setSecondHandProposalInstructions(id, { handover_method: method, handover_instructions: instructions }))}
              >
                <Text style={styles.primaryText}>{t("secondHand.save")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("secondHand.payment")}</Text>
              <TouchableOpacity style={styles.secondary} disabled={saving} onPress={() => run(() => markSecondHandProposalReceived(id, notes))}>
                <Text style={styles.secondaryText}>{t("secondHand.markReceived")}</Text>
              </TouchableOpacity>
              <View style={styles.segment}>
                <TouchableOpacity style={styles.segmentButton} disabled={saving} onPress={() => run(() => verifySecondHandProposal(id, { valid: true, admin_notes: notes }))}>
                  <Text style={styles.segmentText}>{t("secondHand.verifyValid")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.segmentButton} disabled={saving} onPress={() => run(() => verifySecondHandProposal(id, { valid: false, admin_notes: notes }))}>
                  <Text style={styles.segmentText}>{t("secondHand.verifyInvalid")}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={paymentReference}
                placeholder={t("secondHand.paymentReference")}
                onChangeText={setPaymentReference}
              />
              <TouchableOpacity
                style={styles.primary}
                disabled={saving}
                onPress={() => run(() => confirmSecondHandProposalPayment(id, { final_price_eur: Number((offer || proposal.offered_price_eur || proposal.desired_price_eur).toString().replace(",", ".")), payment_reference: paymentReference, admin_notes: notes }))}
              >
                <Text style={styles.primaryText}>{t("secondHand.confirmPayment")}</Text>
              </TouchableOpacity>
            </View>
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
  hero: { borderRadius: 22, backgroundColor: "#071846", padding: 18, gap: 6 },
  eyebrow: { color: theme.colors.gold, fontSize: 12, fontWeight: "900" },
  title: { color: "#FFF", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  body: { color: "#61594E", lineHeight: 21 },
  status: { alignSelf: "flex-start", borderRadius: 999, overflow: "hidden", backgroundColor: "#E9F9EF", color: "#087E36", fontWeight: "900", paddingHorizontal: 12, paddingVertical: 6 },
  images: { gap: 10 },
  image: { width: 128, height: 150, borderRadius: 16, backgroundColor: "#E6DED0" },
  card: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 15, gap: 10 },
  sectionTitle: { color: "#071846", fontSize: 19, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line, paddingBottom: 8 },
  infoLabel: { color: "#61594E", flex: 1 },
  infoValue: { color: "#071846", flex: 1, textAlign: "right", fontWeight: "900" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 14, color: "#071846", backgroundColor: "#FFFDF8", fontWeight: "800" },
  textarea: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" },
  primary: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  primaryText: { color: "#FFF", fontWeight: "900" },
  secondary: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#071846", backgroundColor: "#FFF" },
  secondaryText: { color: "#071846", fontWeight: "900" },
  segment: { flexDirection: "row", gap: 8 },
  segmentButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, backgroundColor: "#FFFDF8" },
  segmentActive: { borderColor: "#071846", backgroundColor: "#071846" },
  segmentText: { color: "#071846", fontSize: 12, fontWeight: "900", textAlign: "center" },
  segmentTextActive: { color: "#FFF" },
  error: { color: "#9B1010", fontWeight: "800" },
});
