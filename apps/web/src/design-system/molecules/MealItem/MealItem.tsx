import { useId, type ComponentProps } from "react";
import { MealCheck } from "../../atoms/MealCheck/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { PhotoOrPlaceholder } from "../PhotoOrPlaceholder/index.ts";
import styles from "./MealItem.module.css";

type Props = Pick<
  ComponentProps<typeof PhotoOrPlaceholder>,
  "photo" | "mosaic" | "mealType"
> & {
  name: string;
  /** Total kcal for the servings counted (eaten if eaten, else planned). */
  kcal: number;
  /** Planned servings. */
  servings: number;
  /** Servings actually eaten, when they differ from the plan. */
  eatenServings?: number;
  eaten: boolean;
  /** The next meal to eat: green outline, "<slot> · next". */
  next?: boolean;
  /** A future day: dimmed, the check cannot be used. */
  disabled?: boolean;
  onToggle: (eaten: boolean) => void;
};

const plural = (n: number) => `${n} serving${n === 1 ? "" : "s"}`;

// SPEC-004 AC-2/4/11: the MealMiniCard content as a row, with a MealCheck in front.
export function MealItem({
  name,
  mealType,
  kcal,
  servings,
  eatenServings,
  eaten,
  next = false,
  disabled = false,
  photo,
  mosaic,
  onToggle,
}: Props) {
  const hintId = useId();
  const slot = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const differs = eaten && eatenServings != null && eatenServings !== servings;
  const cls = [styles.row, next && styles.next, disabled && styles.off]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <MealCheck
        meal={mealType}
        next={next}
        checked={eaten}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-labelledby={disabled ? hintId : undefined}
        onChange={(e) => !disabled && onToggle(e.target.checked)}
      />
      {disabled && (
        <span id={hintId} hidden>
          Mark {mealType} as eaten, available on the day
        </span>
      )}
      <div className={styles.thumb}>
        <PhotoOrPlaceholder
          photo={photo}
          mosaic={mosaic}
          mealType={mealType}
          size="mini"
        />
      </div>
      <div className={styles.body}>
        <div className={styles.slot}>{next ? `${slot} · next` : slot}</div>
        <div
          className={eaten ? `${styles.title} ${styles.muted}` : styles.title}
          title={name}
        >
          {name}
        </div>
        <div className={styles.meta}>
          {differs ? `Planned ${servings}` : plural(servings)}
        </div>
      </div>
      {differs && <Pill variant="yellow">{eatenServings} eaten</Pill>}
      <div className={styles.kcal}>{kcal} kcal</div>
    </div>
  );
}
