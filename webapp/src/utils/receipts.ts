import { appConfig } from "../config/app";

type ReceiptType = "order" | "rental" | "resale";

export async function downloadReceipt(type: ReceiptType, id: number | string) {
  const token =
    localStorage.getItem("ak_auth_token") || localStorage.getItem("ak_token");
  const response = await fetch(`${appConfig.apiUrl}/receipts/${type}/${id}.pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Telechargement du recu impossible.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recu-${type}-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
