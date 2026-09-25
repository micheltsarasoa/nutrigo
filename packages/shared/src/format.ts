// SPEC-008 §7. One locale setting drives numbers and money (EUR in integer cents).
type Locale = "fr-FR" | "en-IE";

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

export function formatEUR(cents: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
