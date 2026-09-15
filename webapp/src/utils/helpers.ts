export function cx(...items: Array<string | false | null | undefined>) { return items.filter(Boolean).join(' '); }
export function initials(name = 'AK') { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
