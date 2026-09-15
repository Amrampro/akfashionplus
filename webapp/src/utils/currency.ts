export function formatEur(value: number | string | null | undefined, locale = "fr") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

export function formatAoa(value: number | string | null | undefined, locale = "fr") {
  return (
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value || 0)) +
    ` ${getDisplayCurrency()}`
  );
}

export function convertEurToAoa(value: number | string | null | undefined, rate: number) {
  return Number(value || 0) * Number(rate || 0);
}

export function getDisplayCurrency() {
  return localStorage.getItem("ak_display_currency") || "AOA";
}
