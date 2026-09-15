export function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function toAoa(eur, rate) {
  return Math.round(Number(eur || 0) * Number(rate || 0) * 100) / 100;
}
