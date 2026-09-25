import styles from "./NutritionRow.module.css";

type Props = {
  label: string;
  value: string | null;
  // Makes it the head row (Calories), with this caption above the value.
  caption?: string;
};

// .nutrition__row from Recipe Details. Goes inside a <tbody>.
export function NutritionRow({ label, value, caption }: Props) {
  return (
    <tr className={caption ? `${styles.row} ${styles.head}` : styles.row}>
      <th scope="row" className={styles.label}>
        {label}
      </th>
      <td className={styles.value}>
        {caption && <small className={styles.caption}>{caption}</small>}
        {value ?? "–"}
      </td>
    </tr>
  );
}
