import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
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
import {
  createSecondHandProposal,
  uploadSecondHandProposalImages,
} from "../../services/secondHandProposal.service";
import type { SecondHandProposalForm } from "../../types";
import type { ProposalPhoto } from "./SecondHandProposalPhotosScreen";

type Props = {
  form: SecondHandProposalForm;
  photos: ProposalPhoto[];
  onBack: () => void;
  onDone: (id: number) => void;
};

function numeric(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function eur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

export default function SecondHandProposalPriceScreen({ form, photos, onBack, onDone }: Props) {
  const { locale, t } = useLanguage();
  const [price, setPrice] = useState(form.desired_price_eur || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const priceValue = numeric(price);

  const submit = async () => {
    if (priceValue <= 0) {
      setError(t("secondHand.required"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const proposal = await createSecondHandProposal({
        ...form,
        desired_price_eur: String(priceValue),
      });
      await uploadSecondHandProposalImages(proposal.id, photos);
      onDone(proposal.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("secondHand.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t("secondHand.priceTitle")}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.priceQuestion")}</Text>
          <Text style={styles.inputLabel}>{t("secondHand.desiredPrice")}</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            keyboardType="decimal-pad"
            placeholder="45,00"
            placeholderTextColor="#8A8374"
            onChangeText={setPrice}
          />

          <View style={styles.adviceBox}>
            <Text style={styles.adviceTitle}>{t("secondHand.adviceTitle")}</Text>
            <Text style={styles.adviceText}>{t("secondHand.adviceText")}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t("secondHand.summary")}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("secondHand.itemInfo")}</Text>
            <Text style={styles.summaryValue}>{form.item_type} {form.brand}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("secondHand.size")}</Text>
            <Text style={styles.summaryValue}>{form.size || "-"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("secondHand.condition")}</Text>
            <Text style={styles.summaryValue}>{t(`secondHand.conditionState.${form.condition_state}`)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("secondHand.photos")}</Text>
            <Text style={styles.summaryValue}>{photos.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("secondHand.desiredPrice")}</Text>
            <Text style={styles.summaryValue}>{eur(priceValue, locale)}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={submit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>{t("secondHand.sendProposal")}</Text>
            )}
          </TouchableOpacity>
        </View>
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
  topTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 16, gap: 14 },
  eyebrow: { color: "#A87500", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#071846", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  inputLabel: { color: "#5F564B", fontSize: 13, fontWeight: "900", marginBottom: -6 },
  priceInput: { minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 16, color: "#071846", fontSize: 24, fontWeight: "900", backgroundColor: "#FFFDF8" },
  adviceBox: { borderRadius: 16, backgroundColor: "#F7F5EF", padding: 14, gap: 5 },
  adviceTitle: { color: "#071846", fontWeight: "900" },
  adviceText: { color: "#61594E", lineHeight: 20 },
  sectionTitle: { color: "#071846", fontSize: 18, fontWeight: "900" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line, paddingBottom: 9 },
  summaryLabel: { color: "#61594E", flex: 1 },
  summaryValue: { color: "#071846", flex: 1.2, textAlign: "right", fontWeight: "900" },
  error: { color: "#9B1010", fontWeight: "800" },
  primary: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  primaryText: { color: "#FFF", fontWeight: "900" },
});
