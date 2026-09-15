export function formatEur(value: number | string | null | undefined, locale = "fr") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

export function formatAoa(value: number | string | null | undefined, locale = "fr") {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value || 0))} AOA`;
}
