import styles from "./IngredientRow.module.css";

type Props = {
  n: number;
  // Already scaled and formatted, e.g. "200 g" or "1.5 piece".
  quantity: string;
  name: string;
};

// .ingredient from Recipe Details. Goes inside an <ol>, which already
// announces the order, so the number is decorative.
export function IngredientRow({ n, quantity, name }: Props) {
  return (
    <li className={styles.row}>
      <span className={styles.n} aria-hidden>
        {n}
      </span>
      <span className={styles.text}>{`${quantity} ${name}`}</span>
    </li>
  );
}
