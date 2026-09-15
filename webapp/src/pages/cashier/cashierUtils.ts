export type CashierPageProps = {
  go: (page: string) => void;
  language: "fr" | "en" | "pt";
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
  setLanguage: (language: "fr" | "en" | "pt") => void;
};

export type CashierProfileSession = {
  role: "user" | "cashier" | "admin";
  name: string;
  email: string;
};

export function eur(value: number | string | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

export function aoa(value: number | string | null | undefined) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} ${
    localStorage.getItem("ak_display_currency") || "AOA"
  }`;
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function dateOnly(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function statusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    active: "Active",
    approved: "Approuvee",
    cancelled: "Annulee",
    completed: "Terminee",
    damaged: "Endommagee",
    delivered: "Livree",
    lost: "Perdue",
    paid: "Payee",
    pending: "En attente",
    pending_payment: "Paiement attendu",
    ready_for_payout: "Prete a payer",
    ready_for_pickup: "Prete au retrait",
    rejected: "Refusee",
    reserved: "Reservee",
    return_due: "Retour attendu",
    returned: "Retournee",
    overdue: "En retard",
  };
  return labels[value || ""] || value || "-";
}

export function isPastRental(endDate: string | null | undefined) {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return end < today;
}

export function initials(name = "AK") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AK"
  );
}
