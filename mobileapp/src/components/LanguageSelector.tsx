import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [visible, setVisible] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={t("account.language")}
      style={styles.trigger} onPress={() => setVisible(true)}>
      <Text style={styles.text}>{language.toUpperCase()}</Text>
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>{t("account.language")}</Text>
          {([ ["fr", "Français"], ["en", "English"], ["pt", "Português"] ] as const).map(([code, label]) =>
            <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected: language === code }}
              style={styles.option} onPress={() => { setLanguage(code); setVisible(false); }}>
              <Text style={styles.text}>{label}{language === code ? " ✓" : ""}</Text>
            </Pressable>)}
          <Pressable accessibilityRole="button" style={styles.option} onPress={() => setVisible(false)}>
            <Text style={styles.text}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: "#E4DECE", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF8" },
  text: { color: "#071846", fontWeight: "900" },
  title: { color: "#071846", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  backdrop: { flex: 1, backgroundColor: "#0008", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 360, backgroundColor: "#FFFDF8", borderRadius: 18, padding: 20 },
  option: { minHeight: 48, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#E4DECE" },
});
