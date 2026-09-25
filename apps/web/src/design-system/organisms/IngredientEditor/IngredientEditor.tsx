import {
  IngredientInput,
  type Category,
  type Source,
  type Unit,
} from "@nutrigo/shared";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { Field } from "../../atoms/Field/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { Select } from "../../atoms/Select/index.ts";
import styles from "./IngredientEditor.module.css";

const CATEGORIES = [
  { value: "grains", text: "Grains" },
  { value: "veggies", text: "Veggies" },
  { value: "protein", text: "Protein" },
  { value: "fruits", text: "Fruits" },
  { value: "dairy", text: "Dairy" },
  { value: "others", text: "Others" },
];
const UNITS = [
  { value: "g", text: "g" },
  { value: "ml", text: "ml" },
  { value: "piece", text: "piece" },
];
const SOURCES: Record<Source, string> = {
  manual: "Manual",
  off: "Open Food Facts",
  ciqual: "Ciqual",
  ai_estimate: "AI estimate",
};

// The per-100 g values, in form order.
const NUTRIENTS = [
  { key: "kcal100g", label: "Calories", unit: "kcal" },
  { key: "carbs100g", label: "Carbs", unit: "g" },
  { key: "protein100g", label: "Protein", unit: "g" },
  { key: "fat100g", label: "Fat", unit: "g" },
  { key: "fibre100g", label: "Fibre", unit: "g", optional: true },
  { key: "sugars100g", label: "Sugars", unit: "g", optional: true },
  { key: "sodiumMg100g", label: "Sodium", unit: "mg", optional: true },
] as const;
type Nutrient = (typeof NUTRIENTS)[number]["key"];

// By the Zod issue path.
const AMOUNT = "Enter a number, 0 or more.";
const MESSAGES: Record<string, string> = {
  name: "Enter a name, up to 100 characters.",
  category: "Choose a category.",
  gramsPerUnit: "Enter a weight above 0.",
  ...Object.fromEntries(NUTRIENTS.map((n) => [n.key, AMOUNT])),
};

type Draft = Record<Nutrient, string> & {
  name: string;
  category: Category | "";
  defaultUnit: Unit;
  gramsPerUnit: string;
};

const text = (n: number | null | undefined) => (n == null ? "" : String(n));
const numOrNull = (s: string) => (s === "" ? null : Number(s));

function toDraft(i: IngredientInput | undefined): Draft {
  return {
    name: i?.name ?? "",
    category: i?.category ?? "",
    ...(Object.fromEntries(
      NUTRIENTS.map((n) => [n.key, text(i?.[n.key])]),
    ) as Record<Nutrient, string>),
    defaultUnit: i?.defaultUnit ?? "g",
    gramsPerUnit: text(i?.gramsPerUnit),
  };
}

// Empty numbers become null and an empty category goes missing, so Zod decides.
function toInput(d: Draft) {
  return {
    name: d.name,
    category: d.category || undefined,
    ...Object.fromEntries(NUTRIENTS.map((n) => [n.key, numOrNull(d[n.key])])),
    defaultUnit: d.defaultUnit,
    gramsPerUnit: numOrNull(d.gramsPerUnit),
  };
}

type Props = {
  /** The saved ingredient to edit; leave it out for a new one. */
  ingredient?: IngredientInput & { source: Source };
  saving?: boolean;
  /** A save or delete that failed on the server; the input stays as it is. */
  error?: string | null;
  /** The recipes that block a delete (AC-9's 409), shown under the error. */
  usedBy?: string[] | null;
  onSave: (ingredient: IngredientInput) => void;
  onCancel: () => void;
  /** Edit only: shows Delete, which asks first. */
  onDelete?: () => void;
};

// Derived (SPEC-002 §4, editor flow). A native form, validated with IngredientInput;
// props only: the page saves, deletes and navigates. Plain h2s instead of Card
// titles, which would turn every card into a landmark.
export function IngredientEditor({
  ingredient,
  saving = false,
  error,
  usedBy,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const [initial] = useState(() => toDraft(ingredient));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<"discard" | "delete">("discard");
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useId();

  // After a failed Save, focus the first field with an error.
  useEffect(() => {
    form.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [errors]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const result = IngredientInput.safeParse(toInput(draft));
    if (result.success) {
      setErrors({});
      onSave(result.data);
      return;
    }
    const found: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      found[path] ??= MESSAGES[path] ?? issue.message;
    }
    setErrors(found);
  }

  function ask(what: "discard" | "delete") {
    setConfirm(what);
    dialog.current?.showModal();
  }

  function cancel() {
    if (JSON.stringify(draft) === JSON.stringify(initial)) onCancel();
    else ask("discard");
  }

  const close = () => dialog.current?.close();

  return (
    <form ref={form} className={styles.editor} noValidate onSubmit={submit}>
      <div className={styles.head}>
        <h1 className={styles.title}>
          {ingredient ? "Edit ingredient" : "New ingredient"}
        </h1>
        <Pill variant="grey">{SOURCES[ingredient?.source ?? "manual"]}</Pill>
      </div>

      <Card>
        <h2 className={styles.cardTitle}>Ingredient</h2>
        <div className={styles.fields}>
          <Field
            label="Name"
            value={draft.name}
            error={errors.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Select
            label="Category"
            placeholder="Choose…"
            options={CATEGORIES}
            value={draft.category}
            error={errors.category}
            onChange={(e) => set({ category: e.target.value as Category })}
          />
        </div>
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Nutrition per 100 g</h2>
        <div className={styles.fields}>
          {NUTRIENTS.map((n) => (
            <Field
              key={n.key}
              label={"optional" in n ? `${n.label} (optional)` : n.label}
              type="number"
              min={0}
              unit={n.unit}
              value={draft[n.key]}
              error={errors[n.key]}
              onChange={(e) => set({ [n.key]: e.target.value })}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Units</h2>
        <div className={styles.fields}>
          <Select
            label="Default unit"
            options={UNITS}
            value={draft.defaultUnit}
            onChange={(e) => set({ defaultUnit: e.target.value as Unit })}
          />
          <Field
            label="Grams per unit (optional)"
            type="number"
            min={0}
            unit="g"
            value={draft.gramsPerUnit}
            error={errors.gramsPerUnit}
            onChange={(e) => set({ gramsPerUnit: e.target.value })}
          />
        </div>
      </Card>

      {(error || usedBy?.length) && (
        <div role="alert" className={styles.alert}>
          {error && <p>{error}</p>}
          {usedBy?.length ? (
            <>
              <p>Used by these recipes:</p>
              <ul>
                {usedBy.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      )}
      <div className={styles.actions}>
        {ingredient && onDelete && (
          <button
            type="button"
            className={styles.delete}
            onClick={() => ask("delete")}
          >
            <BinIcon />
            Delete
          </button>
        )}
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" icon="check" loading={saving}>
          Save
        </Button>
      </div>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={dialogTitle}
      >
        <h2 id={dialogTitle} className={styles.dialogTitle}>
          {confirm === "delete"
            ? "Delete this ingredient?"
            : "Discard your changes?"}
        </h2>
        <p>
          {confirm === "delete"
            ? "It will be removed from your ingredient library."
            : "Your edits to this ingredient will be lost."}
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" autoFocus onClick={close}>
            {confirm === "delete" ? "Keep it" : "Keep editing"}
          </Button>
          {confirm === "delete" ? (
            <button
              type="button"
              className={styles.confirmDelete}
              onClick={() => {
                close();
                onDelete?.();
              }}
            >
              <BinIcon />
              Delete
            </button>
          ) : (
            <Button
              variant="primary-orange"
              onClick={() => {
                close();
                onCancel();
              }}
            >
              Discard
            </Button>
          )}
        </div>
      </dialog>
    </form>
  );
}

// The Icon set has no bin, so it's drawn here, as in RecipeEditor.
function BinIcon() {
  return (
    <svg
      className={styles.binIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden
    >
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  );
}
