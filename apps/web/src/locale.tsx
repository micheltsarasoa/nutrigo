// PRD C-1 / SPEC-008 §7: one locale setting drives numbers and money. Components read it here
// instead of taking a prop each; without a provider (tests, playground) numbers stay unformatted.
import { type Locale, formatEUR, formatNumber } from "@nutrigo/shared";
import { createContext, useContext } from "react";

const LocaleContext = createContext<Locale | null>(null);
export const LocaleProvider = LocaleContext.Provider;

/** The saved locale, or the default while settings are loading. */
export const useLocale = (): Locale => useContext(LocaleContext) ?? "fr-FR";

/** Whole numbers (kcal, grams) in the saved locale; raw digits without a provider. */
export function useNumber(fallback: (n: number) => string = String) {
  const locale = useContext(LocaleContext);
  return (n: number) => (locale ? formatNumber(n, locale) : fallback(n));
}

export function useEUR() {
  const locale = useLocale();
  return (cents: number) => formatEUR(cents, locale);
}
