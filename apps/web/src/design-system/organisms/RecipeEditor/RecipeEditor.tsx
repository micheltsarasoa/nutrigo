import {
  RecipeInput,
  type Difficulty,
  type MealType,
  type Unit,
} from "@nutrigo/shared";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { Field } from "../../atoms/Field/index.ts";
import { Select } from "../../atoms/Select/index.ts";
import { StarRating } from "../../atoms/StarRating/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import styles from "./RecipeEditor.module.css";

const MEALS = [
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "snack", text: "Snack" },
  { value: "dinner", text: "Dinner" },
];
const DIFFICULTIES = [
  { value: "", text: "Not set" },
  { value: "easy", text: "Easy" },
  { value: "medium", text: "Medium" },
  { value: "hard", text: "Hard" },
];
const UNITS = [
  { value: "g", text: "g" },
  { value: "ml", text: "ml" },
  { value: "piece", text: "piece" },
];

// By the last key of the Zod issue path; custom issues keep their own message.
const MESSAGES: Record<string, string> = {
  name: "Enter a name, up to 100 characters.",
  mealType: "Choose a meal type.",
  description: "Up to 2000 characters.",
  prepMin: "Enter whole minutes, 0 or more.",
  cookMin: "Enter whole minutes, 0 or more.",
  notes: "Up to 5000 characters.",
  ingredientId: "Choose an ingredient.",
  quantity: "Enter a quantity above 0.",
  title: "Enter a title, up to 100 characters.",
  body: "Up to 2000 characters.",
};

type Line = { key: number; ingredientId: string; quantity: string; unit: Unit };
type Step = { key: number; title: string; body: string };
type Tool = { key: number; name: string };
type Draft = {
  name: string;
  description: string;
  mealType: MealType | "";
  servings: number;
  difficulty: Difficulty | "";
  prepMin: string;
  cookMin: string;
  rating: number;
  notes: string;
  ingredients: Line[];
  steps: Step[];
  tools: Tool[];
};

// Stable React keys for lines that move.
let nextKey = 0;
const key = () => nextKey++;

const text = (n: number | null | undefined) => (n == null ? "" : String(n));

function toDraft(r: RecipeInput | undefined): Draft {
  return {
    name: r?.name ?? "",
    description: r?.description ?? "",
    mealType: r?.mealType ?? "",
    servings: r?.servings ?? 1,
    difficulty: r?.difficulty ?? "",
    prepMin: text(r?.prepMin),
    cookMin: text(r?.cookMin),
    rating: r?.rating ?? 0,
    notes: r?.notes ?? "",
    ingredients: (r?.ingredients ?? []).map((l) => ({
      key: key(),
      ingredientId: String(l.ingredientId),
      quantity: String(l.quantity),
      unit: l.unit,
    })),
    steps: (r?.steps ?? []).map((s) => ({ key: key(), ...s })),
    tools: (r?.tools ?? []).map((t) => ({ key: key(), ...t })),
  };
}

// Empty text becomes null (or missing, for the required meal type) so Zod decides.
const orNull = (s: string) => (s.trim() === "" ? null : s);
const numOrNull = (s: string) => (s === "" ? null : Number(s));

function toInput(d: Draft) {
  return {
    name: d.name,
    description: orNull(d.description),
    mealType: d.mealType || undefined,
    servings: d.servings,
    difficulty: d.difficulty || null,
    prepMin: numOrNull(d.prepMin),
    cookMin: numOrNull(d.cookMin),
    rating: d.rating || null,
    notes: orNull(d.notes),
    ingredients: d.ingredients.map((l) => ({
      ingredientId: Number(l.ingredientId),
      quantity: Number(l.quantity),
      unit: l.unit,
    })),
    steps: d.steps.map(({ title, body }) => ({ title, body })),
    tools: d.tools.map(({ name }) => ({ name })),
  };
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

type Props = {
  /** The saved recipe to edit; leave it out for a new one. */
  recipe?: RecipeInput;
  /** The ingredient library, for the ingredient lines. */
  ingredients: { id: number; name: string; defaultUnit: Unit }[];
  saving?: boolean;
  /** A save that failed on the server; the input stays as it is. */
  error?: string | null;
  onSave: (recipe: RecipeInput) => void;
  onCancel: () => void;
};

// Derived (SPEC-002 §4, editor flow). A native form, validated with RecipeInput;
// props only: the page saves and navigates. Plain h2s instead of Card titles,
// which would turn every card into a landmark.
export function RecipeEditor({
  recipe,
  ingredients,
  saving = false,
  error,
  onSave,
  onCancel,
}: Props) {
  const [initial] = useState(() => toDraft(recipe));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useId();

  // After a failed Save, focus the first field with an error.
  useEffect(() => {
    form.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [errors]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const options = ingredients.map((i) => ({
    value: String(i.id),
    text: i.name,
  }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const result = RecipeInput.safeParse(toInput(draft));
    if (result.success) {
      setErrors({});
      onSave(result.data);
      return;
    }
    const found: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      found[path] ??=
        issue.code === "custom"
          ? issue.message
          : (MESSAGES[String(issue.path.at(-1))] ?? issue.message);
    }
    setErrors(found);
  }

  function cancel() {
    if (JSON.stringify(draft) === JSON.stringify(initial)) onCancel();
    else dialog.current?.showModal();
  }

  const setLine = (i: number, patch: Partial<Line>) =>
    set({
      ingredients: draft.ingredients.map((l, j) =>
        j === i ? { ...l, ...patch } : l,
      ),
    });
  const setStep = (i: number, patch: Partial<Step>) =>
    set({
      steps: draft.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const setTool = (i: number, name: string) =>
    set({ tools: draft.tools.map((t, j) => (j === i ? { ...t, name } : t)) });

  return (
    <form ref={form} className={styles.editor} noValidate onSubmit={submit}>
      <h1 className={styles.title}>{recipe ? "Edit recipe" : "New recipe"}</h1>

      <Card>
        <h2 className={styles.cardTitle}>Recipe</h2>
        <div className={styles.fields}>
          <span className={styles.wide}>
            <Field
              label="Name"
              value={draft.name}
              error={errors.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </span>
          <span className={styles.wide}>
            <Field
              label="Description"
              multiline
              rows={3}
              value={draft.description}
              error={errors.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </span>
          <Select
            label="Meal type"
            placeholder="Choose…"
            options={MEALS}
            value={draft.mealType}
            error={errors.mealType}
            onChange={(e) => set({ mealType: e.target.value as MealType })}
          />
          <Select
            label="Difficulty"
            options={DIFFICULTIES}
            value={draft.difficulty}
            onChange={(e) =>
              set({ difficulty: e.target.value as Difficulty | "" })
            }
          />
          <Field
            label="Prep time"
            type="number"
            min={0}
            unit="min"
            value={draft.prepMin}
            error={errors.prepMin}
            onChange={(e) => set({ prepMin: e.target.value })}
          />
          <Field
            label="Cook time"
            type="number"
            min={0}
            unit="min"
            value={draft.cookMin}
            error={errors.cookMin}
            onChange={(e) => set({ cookMin: e.target.value })}
          />
          <div className={styles.servings}>
            <span className={styles.label} aria-hidden="true">
              Servings
            </span>
            <Stepper
              label="Servings"
              value={draft.servings}
              min={1}
              max={12}
              onChange={(servings) => set({ servings })}
            />
          </div>
          <div className={styles.rating}>
            <StarRating
              label="Your rating"
              value={draft.rating}
              onChange={(rating) => set({ rating })}
            />
            {draft.rating > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => set({ rating: 0 })}
              >
                Clear rating
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Ingredients</h2>
        <Lines
          noun="ingredient"
          items={draft.ingredients}
          onChange={(ingredients) => set({ ingredients })}
          onAdd={() =>
            set({
              ingredients: [
                ...draft.ingredients,
                { key: key(), ingredientId: "", quantity: "", unit: "g" },
              ],
            })
          }
          render={(line, i) => (
            <div className={styles.line}>
              <span className={styles.grow}>
                <Select
                  label="Ingredient"
                  placeholder="Choose…"
                  options={options}
                  value={line.ingredientId}
                  error={errors[`ingredients.${i}.ingredientId`]}
                  onChange={(e) => {
                    const unit = ingredients.find(
                      (x) => String(x.id) === e.target.value,
                    )?.defaultUnit;
                    setLine(i, {
                      ingredientId: e.target.value,
                      ...(unit && { unit }),
                    });
                  }}
                />
              </span>
              <span className={styles.short}>
                <Field
                  label="Quantity"
                  type="number"
                  min={0}
                  value={line.quantity}
                  error={errors[`ingredients.${i}.quantity`]}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
              </span>
              <span className={styles.short}>
                <Select
                  label="Unit"
                  options={UNITS}
                  value={line.unit}
                  onChange={(e) => setLine(i, { unit: e.target.value as Unit })}
                />
              </span>
            </div>
          )}
        />
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Steps</h2>
        <Lines
          noun="step"
          items={draft.steps}
          onChange={(steps) => set({ steps })}
          onAdd={() =>
            set({
              steps: [...draft.steps, { key: key(), title: "", body: "" }],
            })
          }
          render={(step, i) => (
            <div className={styles.stack}>
              <Field
                label="Title"
                value={step.title}
                error={errors[`steps.${i}.title`]}
                onChange={(e) => setStep(i, { title: e.target.value })}
              />
              <Field
                label="Instructions"
                multiline
                rows={3}
                value={step.body}
                error={errors[`steps.${i}.body`]}
                onChange={(e) => setStep(i, { body: e.target.value })}
              />
            </div>
          )}
        />
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Tools</h2>
        <Lines
          noun="tool"
          items={draft.tools}
          onChange={(tools) => set({ tools })}
          onAdd={() =>
            set({ tools: [...draft.tools, { key: key(), name: "" }] })
          }
          render={(tool, i) => (
            <Field
              label="Tool"
              value={tool.name}
              error={errors[`tools.${i}.name`]}
              onChange={(e) => setTool(i, e.target.value)}
            />
          )}
        />
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Notes</h2>
        <Field
          label="Notes"
          multiline
          rows={4}
          value={draft.notes}
          error={errors.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Card>

      {error && (
        <p role="alert" className={styles.alert}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
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
          Discard your changes?
        </h2>
        <p>Your edits to this recipe will be lost.</p>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            Keep editing
          </Button>
          <Button
            variant="primary-orange"
            onClick={() => {
              dialog.current?.close();
              onCancel();
            }}
          >
            Discard
          </Button>
        </div>
      </dialog>
    </form>
  );
}

// Pointer travel before a press on the grip counts as a drag, not a tap.
const DRAG_START = 6;

// A numbered list of fieldsets ("Step 2") that can be added, reordered and removed.
// Each line's grip is dragged (mouse or touch), moved with the arrow keys, or
// tapped to show Move up / Move down for anyone who can't drag (WCAG 2.5.7).
function Lines<T extends { key: number }>({
  noun,
  items,
  onChange,
  onAdd,
  render,
}: {
  noun: string;
  items: T[];
  onChange: (items: T[]) => void;
  onAdd: () => void;
  render: (item: T, i: number) => ReactNode;
}) {
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const list = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  // The latest lines, for the window listeners of a drag in progress.
  const latest = useRef({ items, onChange });
  latest.current = { items, onChange };

  const toggle = (key: number) => setOpen((o) => (o === key ? null : key));
  const reorder = (from: number, to: number) => {
    const { items, onChange } = latest.current;
    if (to >= 0 && to < items.length) onChange(move(items, from, to));
  };

  function startDrag(
    e: PointerEvent<HTMLButtonElement>,
    index: number,
    key: number,
  ) {
    if (e.button !== 0) return;
    const startY = e.clientY;
    let moved = false;
    // On window, not the grip: moving the line in the DOM drops pointer capture.
    const onMove = (ev: globalThis.PointerEvent) => {
      if (!moved && Math.abs(ev.clientY - startY) < DRAG_START) return;
      moved = true;
      setDragging(key);
      // The new place is after every other line whose middle is above the pointer.
      let to = 0;
      [...(list.current?.children ?? [])].forEach((line, j) => {
        const box = line.getBoundingClientRect();
        if (j !== index && ev.clientY > box.top + box.height / 2) to++;
      });
      if (to !== index) {
        reorder(index, to);
        index = to;
      }
    };
    const onEnd = (ev: globalThis.PointerEvent) => {
      // A press that didn't move is a tap. Browsers don't always follow a
      // touch drag with a click, so the tap isn't left to the click event.
      if (!moved && ev.type === "pointerup") toggle(key);
      setDragging(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  return (
    <>
      {items.length > 0 && (
        <ol ref={list} className={styles.list}>
          {items.map((item, i) => (
            <li
              key={item.key}
              className={
                dragging === item.key
                  ? `${styles.row} ${styles.dragging}`
                  : styles.row
              }
            >
              <button
                type="button"
                className={styles.grip}
                aria-label={`Reorder ${noun} ${i + 1}`}
                aria-expanded={open === item.key}
                aria-keyshortcuts="ArrowUp ArrowDown"
                onKeyDown={(e) => {
                  const to = { ArrowUp: i - 1, ArrowDown: i + 1 }[e.key];
                  if (to === undefined) return;
                  e.preventDefault();
                  reorder(i, to);
                }}
                onPointerDown={(e) => startDrag(e, i, item.key)}
                // Keyboard only (detail 0); pointer taps toggle in startDrag.
                onClick={(e) => e.detail === 0 && toggle(item.key)}
              >
                {/* The Icon set has no grip, so its 6 dots are drawn here. */}
                <svg
                  className={styles.dots}
                  viewBox="0 0 10 16"
                  fill="currentColor"
                  focusable="false"
                  aria-hidden
                >
                  {[2, 8, 14].flatMap((y) =>
                    [2, 8].map((x) => (
                      <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
                    )),
                  )}
                </svg>
              </button>
              <fieldset className={styles.item}>
                <legend className={styles.legend}>{`${Noun} ${i + 1}`}</legend>
                {render(item, i)}
                <div className={styles.tools}>
                  {open === item.key && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move up ${noun} ${i + 1}`}
                        disabled={i === 0}
                        onClick={() => reorder(i, i - 1)}
                      >
                        Move up
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move down ${noun} ${i + 1}`}
                        disabled={i === items.length - 1}
                        onClick={() => reorder(i, i + 1)}
                      >
                        Move down
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${noun} ${i + 1}`}
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}
      <Button variant="ghost" size="sm" icon="add" onClick={onAdd}>
        {`Add ${noun}`}
      </Button>
    </>
  );
}
