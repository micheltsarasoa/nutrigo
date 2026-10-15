import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import styles from "./ServingsPrompt.module.css";

type Props = {
  /** Recipe name, shown in the hint. */
  title: string;
  planned: number;
  /** Starting value, if not the planned servings (playground states). */
  initial?: number;
  kcalPerServing?: number;
  onSave: (servings: number) => void;
  onCancel: () => void;
};

const MIN = 0.5;
const MAX = 20;

// SPEC-004 AC-3: opens when a meal is ticked. Enter saves, Escape cancels.
export function ServingsPrompt({
  title,
  planned,
  initial = planned,
  kcalPerServing,
  onSave,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initial);
  const root = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      root.current?.querySelector<HTMLElement>("[role=spinbutton]")?.focus(),
    [],
  );
  const invalid = !(value >= MIN && value <= MAX);
  const save = () => !invalid && onSave(value);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    else if (
      e.key === "Enter" &&
      (e.target as HTMLElement).role === "spinbutton"
    )
      save();
  };
  return (
    <div ref={root} className={styles.prompt} onKeyDown={onKeyDown}>
      <Card title="Servings eaten" headingLevel={3}>
        <div className={styles.body}>
          <p className={styles.hint}>{`${title}, planned ${planned}`}</p>
          <div
            className={
              invalid ? `${styles.value} ${styles.invalid}` : styles.value
            }
          >
            <Stepper
              label="Servings eaten"
              value={value}
              min={MIN}
              max={MAX}
              step={MIN}
              onChange={setValue}
            />
          </div>
          {invalid && (
            <p role="alert" className={styles.error}>
              Enter a number from 0.5 to 20.
            </p>
          )}
          {!invalid && kcalPerServing !== undefined && value !== planned && (
            <p
              className={styles.hint}
            >{`≈ ${Math.round(kcalPerServing * value)} kcal`}</p>
          )}
          <div className={styles.actions}>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button loading={invalid} onClick={save}>
              Mark as eaten
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
