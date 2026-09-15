import { formatAoa, formatEur } from '../utils/currency'; export function useCurrency(locale = 'fr') { return { eur: (v: number) => formatEur(v, locale), aoa: (v: number) => formatAoa(v, locale) }; }
