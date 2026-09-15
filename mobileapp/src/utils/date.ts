export function formatDate(value?: string | Date | null, locale = 'fr') { return value ? new Intl.DateTimeFormat(locale).format(new Date(value)) : ''; }
