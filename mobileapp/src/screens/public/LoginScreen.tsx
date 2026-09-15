import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  onSuccess: () => void;
  onRegister: () => void;
};

function EyeIcon({ open }: { open: boolean }) {
  return (
    <View style={styles.eyeIcon}>
      <View style={styles.eyeShape}>
        <View style={styles.eyeDot} />
      </View>
      {!open ? <View style={styles.eyeSlash} /> : null}
    </View>
  );
}

export default function LoginScreen({ onSuccess, onRegister }: Props) {
  const { loginWithCredentials } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t("loginPage.missingCredentials"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await loginWithCredentials(email.trim(), password);
      onSuccess();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : t("loginPage.errorFallback"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 12}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>AK</Text>
            </View>
            <Text style={styles.eyebrow}>{t("loginPage.eyebrow")}</Text>
            <Text style={styles.title}>{t("loginPage.title")}</Text>
            <Text style={styles.subtitle}>{t("loginPage.subtitle")}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t("common.email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t("loginPage.emailPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.input}
            />

            <Text style={styles.label}>{t("loginPage.password")}</Text>
            <View style={styles.passwordField}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                placeholder={t("loginPage.passwordPlaceholder")}
                placeholderTextColor="#8A8374"
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                accessibilityLabel={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((value) => !value)}
              >
                <EyeIcon open={passwordVisible} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, submitting ? styles.buttonDisabled : null]}
              disabled={submitting}
              onPress={submit}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{t("common.login")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onRegister}>
              <Text style={styles.secondaryButtonText}>{t("common.register")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: theme.colors.soft,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
    gap: 18,
  },
  hero: {
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  logoText: {
    color: theme.colors.gold,
    fontSize: 28,
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
    fontSize: 36,
    fontWeight: "900",
  },
  subtitle: {
    color: "#5F564B",
    maxWidth: 310,
    lineHeight: 21,
    textAlign: "center",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 10,
  },
  label: {
    color: "#071846",
    fontSize: 12,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    color: "#071846",
    paddingHorizontal: 12,
    fontWeight: "700",
  },
  passwordField: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: "absolute",
    right: 6,
    top: 4,
    width: 42,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    width: 24,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeShape: {
    width: 22,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#071846",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scaleY: 0.72 }],
  },
  eyeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#071846",
  },
  eyeSlash: {
    position: "absolute",
    width: 25,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#071846",
    transform: [{ rotate: "-35deg" }],
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFA1A1",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: {
    color: "#9A1B1B",
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  buttonDisabled: {
    opacity: 0.6,
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
