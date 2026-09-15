import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";

type Props = {
  orderNumber?: string;
  message?: string;
  onRetry: () => void;
  onCart: () => void;
};

export default function PaymentFailScreen({
  orderNumber,
  message,
  onRetry,
  onCart,
}: Props) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <View style={styles.card}>
          <View style={styles.failCircle}>
            <Text style={styles.failText}>!</Text>
          </View>
          <Text style={styles.eyebrow}>{t("paymentFail.eyebrow")}</Text>
          <Text style={styles.title}>{t("paymentFail.title")}</Text>
          <Text style={styles.message}>
            {message || t("paymentFail.message")}
          </Text>

          {orderNumber ? (
            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>{t("paymentFail.reference")}</Text>
              <Text style={styles.referenceValue}>{orderNumber}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
              <Text style={styles.primaryButtonText}>{t("paymentFail.retry")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCart}>
              <Text style={styles.secondaryButtonText}>{t("paymentFail.cart")}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: "center",
    backgroundColor: theme.colors.soft,
    padding: 18,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  card: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 22,
    gap: 12,
  },
  failCircle: {
    width: 70,
    height: 70,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B42318",
  },
  failText: {
    color: "#FFF",
    fontSize: 42,
    fontWeight: "900",
  },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#071846",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 33,
    textAlign: "center",
  },
  message: {
    color: "#5F564B",
    lineHeight: 20,
    textAlign: "center",
  },
  referenceBox: {
    alignSelf: "stretch",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF8E7",
    padding: 12,
  },
  referenceLabel: {
    color: "#6E5A25",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  referenceValue: {
    color: "#071846",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  actions: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 48,
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
});
