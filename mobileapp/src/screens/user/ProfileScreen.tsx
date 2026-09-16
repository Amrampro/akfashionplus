import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { normalizeLanguage, useLanguage } from "../../contexts/LanguageContext";
import { useAuth, type AuthUser } from "../../hooks/useAuth";
import { get, postForm, put } from "../../services/api";
import { absoluteImageUrl } from "../../utils/images";

type Props = {
  onBack: () => void;
  onLogin: () => void;
};

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_language: string;
  country_code: string;
  avatar_url: string;
};

function fullName(user: AuthUser | null, fallback: string) {
  if (!user) return fallback;
  const composed = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return user.name || composed || user.email || fallback;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formFromUser(user: AuthUser | null): ProfileForm {
  return {
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    preferred_language: user?.preferred_language || "pt",
    country_code: user?.country_code || "",
    avatar_url: user?.avatar_url || "",
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8374"
        editable={editable}
        style={[styles.input, !editable ? styles.inputDisabled : null]}
      />
    </View>
  );
}

export default function ProfileScreen({ onBack, onLogin }: Props) {
  const { user, loading, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [form, setForm] = useState<ProfileForm>(formFromUser(null));
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    async function loadProfile() {
      setLoadingProfile(true);
      setError("");
      try {
        const profile = await get<AuthUser>("/users/me");
        if (mounted) setForm(formFromUser(profile));
      } catch (err) {
        if (mounted) {
          setForm(formFromUser(user));
          setError(
            err instanceof Error
              ? err.message
              : t("profile.loadError"),
          );
        }
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const name = fullName(user, t("profile.fallbackName"));
  const avatar = absoluteImageUrl(form.avatar_url || user?.avatar_url);
  const activeLanguage = normalizeLanguage(language || form.preferred_language);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await put<AuthUser>("/users/me", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        preferred_language: form.preferred_language || "pt",
        country_code: form.country_code.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      });
      await refreshUser();
      setLanguage(normalizeLanguage(form.preferred_language));
      setMessage(t("profile.saved"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("profile.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    setMessage("");
    setError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(t("profile.photoPermission"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
      });

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("avatar", {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as unknown as Blob);

      setUploadingAvatar(true);
      const updated = await postForm<AuthUser>("/users/me/avatar", formData);
      setForm(formFromUser(updated));
      await refreshUser();
      setMessage(t("profile.photoUpdated"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("profile.photoError"),
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerScreen}>
          <ActivityIndicator color="#071846" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" />
        <View style={styles.screen}>
          <View style={styles.guestCard}>
            <Text style={styles.title}>{t("profile.title")}</Text>
            <Text style={styles.body}>{t("profile.guestText")}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
              <Text style={styles.primaryButtonText}>{t("common.login")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.eyebrow}>{t("profile.account")}</Text>
              <Text style={styles.title}>{t("profile.title")}</Text>
            </View>
          </View>

          <View style={styles.identityCard}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
            )}
            <View style={styles.identityText}>
              <Text numberOfLines={2} style={styles.identityName}>
                {name}
              </Text>
              <Text style={styles.identityEmail}>{user.email}</Text>
              <TouchableOpacity
                style={[styles.avatarButton, uploadingAvatar ? styles.primaryButtonDisabled : null]}
                onPress={pickAvatar}
                disabled={uploadingAvatar}
              >
                <Text style={styles.avatarButtonText}>
                  {uploadingAvatar ? t("common.loading") : t("profile.choosePhoto")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingProfile ? (
            <View style={styles.noticeBox}>
              <ActivityIndicator color="#071846" />
              <Text style={styles.body}>{t("profile.loadingProfile")}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("profile.personalInfo")}</Text>
            <Field
              label={t("profile.firstName")}
              value={form.first_name}
              onChangeText={(value) => updateField("first_name", value)}
              placeholder={t("profile.firstName")}
            />
            <Field
              label={t("profile.lastName")}
              value={form.last_name}
              onChangeText={(value) => updateField("last_name", value)}
              placeholder={t("profile.lastName")}
            />
            <Field
              label={t("common.email")}
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              editable={false}
            />
            <Field
              label={t("profile.phone")}
              value={form.phone}
              onChangeText={(value) => updateField("phone", value)}
              placeholder={t("profile.phonePlaceholder")}
            />
            <Field
              label={t("profile.country")}
              value={form.country_code}
              onChangeText={(value) => updateField("country_code", value)}
              placeholder={t("profile.countryPlaceholder")}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("profile.language")}</Text>
            <View style={styles.languageRow}>
              {[
                ["fr", "FR"],
                ["en", "EN"],
                ["pt", "PT"],
              ].map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.languageButton,
                    activeLanguage === value ? styles.languageButtonActive : null,
                  ]}
                  onPress={() => {
                    updateField("preferred_language", value);
                    setLanguage(normalizeLanguage(value));
                  }}
                >
                  <Text
                    style={[
                      styles.languageText,
                      activeLanguage === value ? styles.languageTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, saving ? styles.primaryButtonDisabled : null]}
            onPress={saveProfile}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? t("common.loading") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.soft,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.soft,
  },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  backText: { color: "#071846", fontSize: 34, lineHeight: 36 },
  eyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: { color: "#071846", fontSize: 36, lineHeight: 40, fontWeight: "900" },
  body: { color: "#665F54", lineHeight: 21 },
  guestCard: {
    margin: 16,
    padding: 18,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    backgroundColor: "#071846",
    padding: 16,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.gold,
    backgroundColor: "#0B1E55",
  },
  avatarText: { color: theme.colors.gold, fontSize: 24, fontWeight: "900" },
  identityText: { flex: 1 },
  identityName: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  identityEmail: { color: "#DDE5FF", marginTop: 4 },
  avatarButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarButtonText: { color: "#071846", fontSize: 12, fontWeight: "900" },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { color: "#071846", fontSize: 21, fontWeight: "900" },
  field: { gap: 6 },
  label: {
    color: "#5F564B",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: "#071846",
    paddingHorizontal: 14,
    fontWeight: "800",
    backgroundColor: "#FFFDF8",
  },
  inputDisabled: { color: "#756C5B", backgroundColor: "#F2EEE5" },
  languageRow: { flexDirection: "row", gap: 8 },
  languageButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8",
  },
  languageButtonActive: { backgroundColor: "#071846", borderColor: "#071846" },
  languageText: { color: "#071846", fontWeight: "900" },
  languageTextActive: { color: "#FFF" },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: "#FFF", fontWeight: "900" },
  noticeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BDE8C5",
    backgroundColor: "#E8F7E9",
    padding: 12,
  },
  successText: { color: "#08742E", fontWeight: "900" },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2A7A7",
    backgroundColor: "#FFF0F0",
    padding: 12,
  },
  errorText: { color: "#9B1010", fontWeight: "800" },
});
