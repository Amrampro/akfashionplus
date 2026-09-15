import * as ImagePicker from "expo-image-picker";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
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
import type { SecondHandProposalForm } from "../../types";

export type ProposalPhoto = {
  uri: string;
  name?: string;
  type?: string;
};

type Props = {
  form: SecondHandProposalForm;
  onBack: () => void;
  onContinue: (photos: ProposalPhoto[]) => void;
};

export default function SecondHandProposalPhotosScreen({ onBack, onContinue }: Props) {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<ProposalPhoto[]>([]);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("secondHand.photosTitle"), t("profile.photoPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.82,
    });

    if (result.canceled) return;
    const selected = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `second-hand-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || "image/jpeg",
    }));
    setPhotos((current) => [...current, ...selected].slice(0, 8));
  };

  const removePhoto = (uri: string) => {
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t("secondHand.photosTitle")}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>{t("secondHand.sell")}</Text>
          <Text style={styles.title}>{t("secondHand.photosTitle")}</Text>
          <Text style={styles.body}>{t("secondHand.photosText")}</Text>

          <View style={styles.grid}>
            {photos.map((photo) => (
              <View key={photo.uri} style={styles.photoWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <TouchableOpacity style={styles.remove} onPress={() => removePhoto(photo.uri)}>
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBox} onPress={pickPhotos}>
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.addText}>{t("secondHand.addPhoto")}</Text>
            </TouchableOpacity>
          </View>

          {photos.length < 3 ? <Text style={styles.notice}>{t("secondHand.minPhotos")}</Text> : null}
          <TouchableOpacity
            style={[styles.primary, photos.length < 3 ? styles.primaryDisabled : null]}
            disabled={photos.length < 3}
            onPress={() => onContinue(photos)}
          >
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
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: "#FFF", padding: 16, gap: 14 },
  eyebrow: { color: "#A87500", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#071846", fontSize: 30, lineHeight: 34, fontWeight: "900" },
  body: { color: "#61594E", lineHeight: 21 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoWrap: { width: "47%", aspectRatio: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#E6DED0" },
  photo: { width: "100%", height: "100%" },
  remove: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  removeText: { color: "#FFF", fontSize: 20, fontWeight: "900", lineHeight: 20 },
  addBox: { width: "47%", aspectRatio: 1, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "#A87500", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8E7" },
  addPlus: { color: "#071846", fontSize: 38, fontWeight: "400" },
  addText: { color: "#071846", fontWeight: "900" },
  notice: { color: "#7A5A00", fontWeight: "800" },
  primary: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#071846" },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: "#FFF", fontWeight: "900" },
});
