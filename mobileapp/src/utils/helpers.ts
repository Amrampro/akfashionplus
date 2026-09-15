export function initials(name = 'AK') { return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }
