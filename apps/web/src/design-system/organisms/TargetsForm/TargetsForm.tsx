import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { Field } from "../../atoms/Field/index.ts";
import styles from "./TargetsForm.module.css";

/** Daily targets; macros are optional (undefined = no target). */
export type Targets = {
  kcal: number;
  carbs?: number;
  protein?: number;
  fat?: number;
};

type Props = {
  /** Strings let a demo show unparsable text. */
  initial?: { [K in keyof Targets]?: number | string };
  /** Only called with valid values. */
  onSave: (targets: Targets) => void;
  saving?: boolean;
  /** A failure from the caller, e.g. the request failed. */
  error?: string;
  /** Show validation errors right away instead of after the first Save. */
  checked?: boolean;
};

const MACROS = [
  ["carbs", "Carbs", "250"],
  ["protein", "Protein", "120"],
  ["fat", "Fat", "70"],
] as const;

const num = (s: string) =>
  s.trim() === "" ? undefined : Number(s.replace(",", "."));

function check(v: Record<string, string>) {
  const errors: Record<string, string> = {};
  const k = num(v.kcal!);
  if (k === undefined)
    errors.kcal = "Enter your daily calories, for example 2000.";
  else if (Number.isNaN(k))
    errors.kcal = "Calories must be a number, for example 2000.";
  else if (k <= 0)
    errors.kcal = "Calories must be more than 0, for example 2000.";
  for (const [key, label, eg] of MACROS) {
    const n = num(v[key]!);
    if (n === undefined) continue;
    if (Number.isNaN(n))
      errors[key] = `${label} must be a number, for example ${eg}.`;
    else if (n < 0)
      errors[key] =
        `${label} can’t be negative. Enter 0 or more, or leave it empty.`;
  }
  return errors;
}

export function TargetsForm({
  initial,
  onSave,
  saving,
  error,
  checked,
}: Props) {
  const [v, setV] = useState<Record<string, string>>({
    kcal: String(initial?.kcal ?? ""),
    carbs: String(initial?.carbs ?? ""),
    protein: String(initial?.protein ?? ""),
    fat: String(initial?.fat ?? ""),
  });
  const [tried, setTried] = useState(false);
  const actions = useRef<HTMLDivElement>(null);
  const errors = check(v);
  const empty = v.kcal!.trim() === "";
  const shown = tried || checked ? errors : {};

  // Button sets aria-disabled only for `loading`, so mirror the empty-kcal state here.
  useEffect(() => {
    const b = actions.current?.querySelector("button");
    if (saving) return;
    if (empty) b?.setAttribute("aria-disabled", "true");
    else b?.removeAttribute("aria-disabled");
  }, [empty, saving]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setTried(true);
    if (Object.keys(errors).length) return;
    onSave({
      kcal: num(v.kcal!)!,
      carbs: num(v.carbs!),
      protein: num(v.protein!),
      fat: num(v.fat!),
    });
  }

  const field = (
    key: string,
    label: string,
    unit: string,
    placeholder: string,
  ) => (
    <Field
      label={label}
      unit={unit}
      inputMode="decimal"
      placeholder={placeholder}
      value={v[key]}
      error={shown[key]}
      onChange={(e) => setV({ ...v, [key]: e.target.value })}
    />
  );

  return (
    <Card title="Daily targets" headingLevel={3}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <p className={styles.hint}>
          Used by the Today ring and the week chart.
        </p>
        {field("kcal", "Calories", "kcal", "e.g. 2000")}
        <div className={styles.two}>
          {field("carbs", "Carbs", "g", "optional")}
          {field("protein", "Protein", "g", "optional")}
        </div>
        {field("fat", "Fat", "g", "optional")}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div ref={actions} className={styles.actions}>
          <Button type="submit" loading={saving}>
            Save targets
          </Button>
        </div>
      </form>
    </Card>
  );
}
