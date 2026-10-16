import {
  type MealEntry,
  type MealType,
  type Plan,
  plannedKcal,
} from "@nutrigo/shared";
import { Fragment } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { DayHead } from "../../molecules/DayHead/index.ts";
import { MealAddSlot } from "../../molecules/MealAddSlot/index.ts";
import { MealMiniCard } from "../../molecules/MealMiniCard/index.ts";
import { useNumber } from "../../../locale.tsx";
import styles from "./MealPlanGrid.module.css";

const SLOTS = [
  { slot: "breakfast", label: "Breakfast", pill: "green" },
  { slot: "lunch", label: "Lunch", pill: "yellow" },
  { slot: "snack", label: "Snack", pill: "grey" },
  { slot: "dinner", label: "Dinner", pill: "orange" },
] as const;

type Props = {
  plan: Plan;
  /** The date to highlight as today, if it is in this week. */
  today: string | null;
  selectedDate: string;
  loading?: boolean;
  error?: boolean;
  onSelectDay: (date: string) => void;
  onAdd: (date: string, slot: MealType) => void;
  onOpenEntry: (entry: MealEntry) => void;
  onRetry: () => void;
};

const dow = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00Z`));
const kcal = (entries: MealEntry[]) => Math.round(plannedKcal(entries));

// .plan from Meal Plan: a slot column × 7 day columns. The slot column shows the selected
// day's kcal (SPEC-003 §4). Props only: the page fetches and mutates.
export function MealPlanGrid({
  plan,
  today,
  selectedDate,
  loading = false,
  error = false,
  onSelectDay,
  onAdd,
  onOpenEntry,
  onRetry,
}: Props) {
  const n = useNumber();
  if (loading) {
    return (
      <p role="status" className={styles.status}>
        Loading the meal plan…
      </p>
    );
  }
  if (error) {
    return (
      <div role="alert" className={styles.status}>
        <p>Couldn’t load the meal plan.</p>
        <Button onClick={onRetry}>Try again</Button>
      </div>
    );
  }

  const selected = plan.days.find((d) => d.date === selectedDate);
  return (
    // Not a landmark: the page's <main> is one.
    <div className={styles.plan} role="group" aria-label="Meal plan">
      <div className={styles.grid}>
        <div />
        {plan.days.map((day) => (
          <DayHead
            key={day.date}
            dow={dow(day.date)}
            dayNumber={Number(day.date.slice(8))}
            kcal={kcal(Object.values(day.slots).flat())}
            isToday={day.date === today}
            isSelected={day.date === selectedDate}
            onSelect={() => onSelectDay(day.date)}
          />
        ))}
        {SLOTS.map(({ slot, label, pill }) => (
          <Fragment key={slot}>
            <div className={styles.slotCell}>
              <Pill variant={pill}>{label}</Pill>
              <span className={styles.slotKcal} data-slot-kcal>
                {n(kcal(selected?.slots[slot] ?? []))} kcal
              </span>
            </div>
            {plan.days.map((day) => {
              const entries = day.slots[slot];
              return (
                <div key={day.date} className={styles.cell}>
                  {entries.length === 0 ? (
                    <MealAddSlot
                      label={`Add ${slot} on ${dow(day.date)}`}
                      onAdd={() => onAdd(day.date, slot)}
                    />
                  ) : (
                    entries.map((e) => (
                      <MealMiniCard
                        key={e.id}
                        name={e.recipeName}
                        kcalPerServing={e.kcalPerServing}
                        servings={e.servings}
                        photo={null}
                        mosaic={[]}
                        mealType={slot}
                        onOpen={() => onOpenEntry(e)}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
