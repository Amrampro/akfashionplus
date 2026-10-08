import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { appConfig } from "../config/app";
import { storage } from "../utils/storage";

export async function downloadOrderReceipt(id: number, language: "pt" | "fr" | "en") {
  const token = await storage.get("auth_token");
  if (!token || !FileSystem.cacheDirectory) throw new Error("Session unavailable");
  const path = `${FileSystem.cacheDirectory}receipt-order-${id}-${language}.pdf`;
  const file = await FileSystem.downloadAsync(`${appConfig.apiUrl}/receipts/order/${id}.pdf?lang=${language}`, path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (file.status !== 200) {
    await FileSystem.deleteAsync(path, { idempotent: true });
    throw new Error("Receipt unavailable");
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing unavailable");
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
}
