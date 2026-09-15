export function formatDate(value: string | Date | null | undefined, locale = 'fr') { return value ? new Intl.DateTimeFormat(locale).format(new Date(value)) : ''; }
