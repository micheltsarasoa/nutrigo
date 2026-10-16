import type { ComponentProps } from "react";
import { Pill } from "../../atoms/Pill/index.ts";
import { PhotoOrPlaceholder } from "../PhotoOrPlaceholder/index.ts";
import { useNumber } from "../../../locale.tsx";
import styles from "./MealMiniCard.module.css";

type Props = Pick<
  ComponentProps<typeof PhotoOrPlaceholder>,
  "photo" | "mosaic" | "mealType"
> & {
  name: string;
  kcalPerServing: number;
  servings: number;
  /** Opens the meal's actions (move, servings, remove). */
  onOpen: () => void;
};

// .meal-mini from Meal Plan: the whole card is one button. The servings badge is added (SPEC-003 AC-4).
export function MealMiniCard({
  name,
  kcalPerServing,
  servings,
  photo,
  mosaic,
  mealType,
  onOpen,
}: Props) {
  const n = useNumber();
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <PhotoOrPlaceholder
        photo={photo}
        mosaic={mosaic}
        mealType={mealType}
        size="mini"
      />
      <span className={styles.title} title={name}>
        {name}
      </span>
      <span className={styles.kcal}>
        {n(Math.round(kcalPerServing * servings))} kcal
        {servings !== 1 && <Pill variant="outline">{servings} servings</Pill>}
      </span>
    </button>
  );
}
