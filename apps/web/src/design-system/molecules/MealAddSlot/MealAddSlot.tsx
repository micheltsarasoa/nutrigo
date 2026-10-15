import { Icon } from "../../atoms/Icon/index.ts";
import styles from "./MealAddSlot.module.css";

type Props = {
  /** Names the slot, e.g. "Add lunch on Tue": the grid has 28 of these. */
  label: string;
  onAdd: () => void;
};

// .meal-add from Meal Plan: the empty slot's dashed "+".
export function MealAddSlot({ label, onAdd }: Props) {
  return (
    <button
      type="button"
      className={styles.slot}
      aria-label={label}
      onClick={onAdd}
    >
      <Icon name="add" size="md" />
    </button>
  );
}
