import { useState, type InputHTMLAttributes } from "react";
import { Field } from "../Field/index.ts";

type Locale = "fr-FR" | "en-IE";
type Props = {
  label: string;
  /** Integer cents (money is never a float); null when empty. */
  value: number | null;
  /** Called with the cents of a valid amount, or null when the box is cleared. */
  onChange: (cents: number | null) => void;
  /** A message from the parent; it wins over the format error. */
  error?: string;
  locale?: Locale;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "disabled" | "placeholder">;

const show = (cents: number | null, locale: Locale) =>
  cents === null
    ? ""
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        useGrouping: false,
      }).format(cents / 100);

// Digits with at most two decimals, a comma or a dot; parsed as text so 1,15 is exactly 115.
function parse(text: string) {
  const t = text.trim();
  if (!t) return null;
  const m = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(t);
  return m ? Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0")) : NaN;
}

// Derived (SPEC-005 §4): a Field with a € suffix that talks in integer cents.
export function MoneyField({
  value,
  onChange,
  error,
  locale = "fr-FR",
  ...rest
}: Props) {
  const [text, setText] = useState(show(value, locale));
  const parsed = parse(text);
  // A value changed from outside replaces the text; typing keeps it as typed.
  if (!Number.isNaN(parsed) && parsed !== value) setText(show(value, locale));
  return (
    <Field
      {...rest}
      unit="€"
      inputMode="decimal"
      value={text}
      error={
        error ??
        (Number.isNaN(parsed) ? "Enter an amount like 3,50." : undefined)
      }
      onChange={(e) => {
        setText(e.target.value);
        const cents = parse(e.target.value);
        if (!Number.isNaN(cents)) onChange(cents);
      }}
      onBlur={() => !Number.isNaN(parsed) && setText(show(parsed, locale))}
    />
  );
}
