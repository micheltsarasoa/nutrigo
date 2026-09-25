import styles from "./ToolItem.module.css";

type Props = {
  n: number;
  name: string;
};

// .numbered from Recipe Details (Tools & Equipment). Goes inside an <ol>,
// which already announces the order, so the number is decorative.
export function ToolItem({ n, name }: Props) {
  return (
    <li className={styles.item}>
      <span className={styles.n} aria-hidden>
        {n}
      </span>
      <span className={styles.name}>{name}</span>
    </li>
  );
}
