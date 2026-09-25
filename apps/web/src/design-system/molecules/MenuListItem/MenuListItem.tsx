import type { ReactNode } from "react";
import { Icon } from "../../atoms/Icon/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { StarRating } from "../../atoms/StarRating/index.ts";
import styles from "./MenuListItem.module.css";

const MEAL_PILL = {
  breakfast: "green",
  lunch: "yellow",
  snack: "grey",
  dinner: "orange",
} as const;

type Props = {
  href: string;
  // Usually a PhotoOrPlaceholder.
  media: ReactNode;
  title: string;
  mealType: keyof typeof MEAL_PILL;
  mealLabel: string;
  kcal: number;
  totalTime: string | null;
  healthScore: number;
  rating: number | null;
  variant: "list" | "grid";
};

// .menu-item from Healthy Menu; the grid variant is .menu-list--grid .menu-item.
export function MenuListItem({
  href,
  media,
  title,
  mealType,
  mealLabel,
  kcal,
  totalTime,
  healthScore,
  rating,
  variant,
}: Props) {
  return (
    <a className={`${styles.item} ${styles[variant]}`} href={href}>
      <div className={styles.media}>{media}</div>
      <div className={styles.body}>
        <div className={styles.top}>
          <Pill variant={MEAL_PILL[mealType]}>{mealLabel}</Pill>
          <span className={styles.score}>
            Health score <b>{healthScore}/10</b>
          </span>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.foot}>
          <span className={styles.fact}>
            <Icon name="kcal" size="sm" />
            {kcal} kcal
          </span>
          <span className={styles.fact}>
            <Icon name="time" size="sm" />
            {totalTime ?? "–"}
          </span>
          <span className={styles.rating}>
            {rating === null ? "–" : <StarRating value={rating} />}
          </span>
        </div>
      </div>
    </a>
  );
}
