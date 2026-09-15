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
  onLogin: () => void;
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

export default function RegisterScreen({ onSuccess, onLogin }: Props) {
  const { t } = useLanguage();
  const { registerWithCredentials } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError(t("registerPage.required"));
      return;
    }

    if (password.length < 6) {
      setError(t("registerPage.passwordMin"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("registerPage.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await registerWithCredentials({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: confirmPassword,
      });
      onSuccess();
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : t("registerPage.errorFallback"),
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
            <Text style={styles.logoText}>AK</Text>
            <View>
              <Text style={styles.eyebrow}>{t("registerPage.eyebrow")}</Text>
              <Text style={styles.title}>{t("registerPage.title")}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>{t("profile.firstName")}</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t("registerPage.firstNamePlaceholder")}
                  placeholderTextColor="#8A8374"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t("profile.lastName")}</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t("registerPage.lastNamePlaceholder")}
                  placeholderTextColor="#8A8374"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>{t("common.email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t("registerPage.emailPlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.input}
            />

            <Text style={styles.label}>{t("profile.phone")}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={t("registerPage.phonePlaceholder")}
              placeholderTextColor="#8A8374"
              style={styles.input}
            />

            <Text style={styles.label}>{t("profile.password")}</Text>
            <View style={styles.passwordField}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                placeholder={t("profile.password")}
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

            <Text style={styles.label}>{t("profile.confirmPassword")}</Text>
            <View style={styles.passwordField}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                placeholder={t("profile.confirmPassword")}
                placeholderTextColor="#8A8374"
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                accessibilityLabel={confirmPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={styles.eyeButton}
                onPress={() => setConfirmPasswordVisible((value) => !value)}
              >
                <EyeIcon open={confirmPasswordVisible} />
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
                <Text style={styles.primaryButtonText}>{t("registerPage.submit")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onLogin}>
              <Text style={styles.secondaryButtonText}>{t("registerPage.haveAccount")}</Text>
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
    padding: 18,
    gap: 18,
    paddingBottom: 28,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#071846",
    padding: 18,
  },
  logoText: {
    color: theme.colors.gold,
    fontSize: 44,
    fontWeight: "900",
  },
  eyebrow: {
    color: "#F5D27C",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "900",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 6,
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
