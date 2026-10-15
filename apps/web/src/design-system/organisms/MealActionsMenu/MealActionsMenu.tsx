import type { MealType } from "@nutrigo/shared";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Select } from "../../atoms/Select/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import styles from "./MealActionsMenu.module.css";

const SLOTS: { value: MealType; text: string }[] = [
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "snack", text: "Snack" },
  { value: "dinner", text: "Dinner" },
];

type Step = "menu" | "servings" | "move" | "duplicate" | "remove";

type Props = {
  open: boolean;
  /** The planned recipe's name: it names the dialog. */
  title: string;
  servings: number;
  /** Where the meal is now. */
  date: string;
  slot: MealType;
  /** The week's days, Monday first; `label` is e.g. "Mon 5". */
  days: { date: string; label: string }[];
  /** An action failed: shown above the buttons, the step stays. */
  error?: string | null;
  saving?: boolean;
  /** The dialog doesn't close itself on an action: the page sets open=false on success. */
  onServings: (servings: number) => void;
  onMove: (date: string, slot: MealType) => void;
  onDuplicate: (date: string, slot: MealType) => void;
  onRemove: () => void;
  /** Called once whenever the dialog closes: Cancel, Esc, or open turning false. */
  onClose: () => void;
};

// Derived from SettingsDialog (dialog shell) and RecipePicker; no sketch of its own
// (owner decision, 2026-10-15). SPEC-003 AC-4 to AC-6: a menu of actions, then the
// one picked as a step. Props only, no fetching.
export function MealActionsMenu({
  open,
  title,
  servings,
  date,
  slot,
  days,
  error,
  saving = false,
  onServings,
  onMove,
  onDuplicate,
  onRemove,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [step, setStep] = useState<Step>("menu");
  const [count, setCount] = useState(servings);
  const [toDate, setToDate] = useState(date);
  const [toSlot, setToSlot] = useState(slot);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Every opening starts at the menu, from where the meal is now.
  useEffect(() => {
    if (!open) return;
    setStep("menu");
    setCount(servings);
    setToDate(date);
    setToSlot(slot);
  }, [open, servings, date, slot]);

  const same = toDate === date && toSlot === slot;
  const dayLabel = days.find((d) => d.date === date)?.label ?? date;
  const slotLabel = SLOTS.find((s) => s.value === slot)?.text.toLowerCase();

  let body;
  let confirm;
  if (step === "servings") {
    body = (
      <Stepper
        label="Servings"
        value={count}
        min={1}
        max={12}
        onChange={setCount}
      />
    );
    confirm = (
      <Button
        icon="check"
        loading={saving}
        disabled={count === servings}
        onClick={() => onServings(count)}
      >
        Save
      </Button>
    );
  } else if (step === "move" || step === "duplicate") {
    const move = step === "move";
    body = (
      <div className={styles.fields}>
        <Select
          label="Day"
          options={days.map((d) => ({ value: d.date, text: d.label }))}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Select
          label="Slot"
          options={SLOTS}
          value={toSlot}
          onChange={(e) => setToSlot(e.target.value as MealType)}
        />
      </div>
    );
    confirm = (
      <Button
        icon="check"
        loading={saving}
        disabled={move && same}
        onClick={() => (move ? onMove : onDuplicate)(toDate, toSlot)}
      >
        {move ? "Move" : "Duplicate"}
      </Button>
    );
  } else if (step === "remove") {
    body = (
      <p className={styles.text}>
        Remove {title} from {dayLabel}, {slotLabel}?
      </p>
    );
    confirm = (
      <Button icon="check" loading={saving} onClick={onRemove}>
        Remove
      </Button>
    );
  } else {
    body = (
      <div className={styles.menu}>
        <Button variant="ghost" onClick={() => setStep("servings")}>
          Change servings
        </Button>
        <Button variant="ghost" onClick={() => setStep("move")}>
          Move
        </Button>
        <Button variant="ghost" onClick={() => setStep("duplicate")}>
          Duplicate
        </Button>
        <Button variant="ghost" onClick={() => setStep("remove")}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClose={onClose}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {body}
        {error && (
          <div role="alert" className={styles.alert}>
            <p>{error}</p>
          </div>
        )}
        <div className={styles.actions}>
          {confirm && (
            <Button variant="ghost" onClick={() => setStep("menu")}>
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          {confirm}
        </div>
      </div>
    </dialog>
  );
}
