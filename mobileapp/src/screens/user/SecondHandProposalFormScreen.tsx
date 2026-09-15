import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import { getCategories } from "../../services/category.service";
import type { SecondHandConditionState, SecondHandProposalForm } from "../../types";

type Category = {
  id: number;
  name_fr?: string | null;
  name_en?: string | null;
  name_pt?: string | null;
  name?: string | null;
};

type Props = {
  onBack: () => void;
  onContinue: (form: SecondHandProposalForm) => void;
};

const conditions: SecondHandConditionState[] = [
  "new_never_worn",
  "excellent",
  "very_good",
  "good",
  "fair",
];

function localizedCategory(category: Category, language: string) {
  if (language === "en") return category.name_en || category.name_fr || category.name || "-";
  if (language === "pt") return category.name_pt || category.name_fr || category.name || "-";
  return category.name_fr || category.name || "-";
}

function normalizeCategories(payload: unknown): Category[] {
  if (Array.isArray(payload)) return payload as Category[];
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.categories)) return data.categories as Category[];
  if (Array.isArray(data.data)) return data.data as Category[];
  return [];
}

export default function SecondHandProposalFormScreen({ onBack, onContinue }: Props) {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SecondHandProposalForm>({
    category_id: null,
    item_type: "",
    brand: "",
    size: "",
    color: "",
    condition_state: "very_good",
    description: "",
    desired_price_eur: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_name: "",
  });

  useEffect(() => {
    let mounted = true;
    setLoadingCategories(true);
    getCategories()
      .then((payload) => mounted && setCategories(normalizeCategories(payload)))
      .catch(() => mounted && setCategories([]))
      .finally(() => mounted && setLoadingCategories(false));
    return () => {
      mounted = false;
    };
  }, []);

  const update = (key: keyof SecondHandProposalForm, value: string | number | null) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    const required = [
      form.item_type,
      form.brand,
      form.condition_state,
      form.description,
      form.bank_account_holder,
      form.bank_account_number,
      form.bank_name,
    ];
    if (required.some((value) => !String(value || "").trim())) {
      setError(t("secondHand.required"));
      return;
    }
    setError("");
    onContinue(form);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t("secondHand.infoTitle")}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.itemInfo")}</Text>

          <Text style={styles.label}>{t("secondHand.category")}</Text>
          {loadingCategories ? <ActivityIndicator color="#071846" /> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <TouchableOpacity
              style={[styles.chip, form.category_id === null ? styles.chipActive : null]}
              onPress={() => update("category_id", null)}
            >
              <Text style={[styles.chipText, form.category_id === null ? styles.chipTextActive : null]}>
                {t("secondHand.noCategory")}
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.chip, form.category_id === category.id ? styles.chipActive : null]}
                onPress={() => update("category_id", category.id)}
              >
                <Text style={[styles.chipText, form.category_id === category.id ? styles.chipTextActive : null]}>
                  {localizedCategory(category, language)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>{t("secondHand.itemType")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.itemType")}
            placeholderTextColor="#8A8374"
            value={form.item_type}
            onChangeText={(value) => update("item_type", value)}
          />
          <Text style={styles.inputLabel}>{t("secondHand.brand")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.brand")}
            placeholderTextColor="#8A8374"
            value={form.brand}
            onChangeText={(value) => update("brand", value)}
          />
          <View style={styles.row}>
            <View style={styles.rowInput}>
              <Text style={styles.inputLabel}>{t("secondHand.size")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("secondHand.size")}
                placeholderTextColor="#8A8374"
                value={form.size}
                onChangeText={(value) => update("size", value)}
              />
            </View>
            <View style={styles.rowInput}>
              <Text style={styles.inputLabel}>{t("secondHand.color")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("secondHand.color")}
                placeholderTextColor="#8A8374"
                value={form.color}
                onChangeText={(value) => update("color", value)}
              />
            </View>
          </View>

          <Text style={styles.label}>{t("secondHand.condition")}</Text>
          <View style={styles.wrap}>
            {conditions.map((condition) => (
              <TouchableOpacity
                key={condition}
                style={[styles.condition, form.condition_state === condition ? styles.chipActive : null]}
                onPress={() => update("condition_state", condition)}
              >
                <Text style={[styles.chipText, form.condition_state === condition ? styles.chipTextActive : null]}>
                  {t(`secondHand.conditionState.${condition}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>{t("secondHand.description")}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("secondHand.description")}
            placeholderTextColor="#8A8374"
            value={form.description}
            multiline
            onChangeText={(value) => update("description", value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.titleSmall}>{t("secondHand.bankTitle")}</Text>
          <Text style={styles.inputLabel}>{t("secondHand.bankHolder")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.bankHolder")}
            placeholderTextColor="#8A8374"
            value={form.bank_account_holder}
            onChangeText={(value) => update("bank_account_holder", value)}
          />
          <Text style={styles.inputLabel}>{t("secondHand.bankNumber")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.bankNumber")}
            placeholderTextColor="#8A8374"
            value={form.bank_account_number}
            autoCapitalize="characters"
            onChangeText={(value) => update("bank_account_number", value)}
          />
          <Text style={styles.inputLabel}>{t("secondHand.bankName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("secondHand.bankName")}
            placeholderTextColor="#8A8374"
            value={form.bank_name}
            onChangeText={(value) => update("bank_name", value)}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={submit}>
            <Text style={styles.primaryText}>{t("secondHand.continue")}</Text>
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
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 16, gap: 12 },
  eyebrow: { color: "#A87500", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#071846", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  titleSmall: { color: "#071846", fontSize: 22, fontWeight: "900" },
  label: { color: "#5F564B", fontWeight: "900" },
  inputLabel: { color: "#5F564B", fontSize: 13, fontWeight: "900", marginBottom: -6 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.line, justifyContent: "center", paddingHorizontal: 12, backgroundColor: "#FFFDF8" },
  chipActive: { borderColor: "#071846", backgroundColor: "#071846" },
  chipText: { color: "#5F564B", fontWeight: "800" },
  chipTextActive: { color: "#FFF" },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 14, color: "#071846", fontWeight: "800", backgroundColor: "#FFFDF8" },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1, gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  condition: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.line, justifyContent: "center", paddingHorizontal: 12, backgroundColor: "#FFFDF8" },
  textarea: { minHeight: 110, paddingTop: 14, textAlignVertical: "top" },
  primary: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  primaryText: { color: "#FFF", fontWeight: "900" },
  error: { color: "#9B1010", fontWeight: "800" },
});
