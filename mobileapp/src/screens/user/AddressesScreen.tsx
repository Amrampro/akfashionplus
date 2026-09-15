import { ScrollView, StyleSheet, Text } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AddressesScreen() {
  const { t } = useLanguage();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>{t("addressesPage.title")}</Text>
      <Text style={styles.body}>{t("addressesPage.body")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18, gap: 10, backgroundColor: "#F7F5EF" },
  title: { color: "#1D1D1B", fontSize: 28, fontWeight: "800" },
  body: { color: "#6B665A", lineHeight: 22 },
});
