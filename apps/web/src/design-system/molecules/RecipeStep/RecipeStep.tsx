import styles from "./RecipeStep.module.css";

type Props = {
  n: number;
  title: string;
  body: string;
};

// .step from Recipe Details (Directions). Goes inside an <ol>, which already
// announces the order, so the number and the rail are decorative.
export function RecipeStep({ n, title, body }: Props) {
  return (
    <li className={styles.step}>
      <span className={styles.n} aria-hidden>
        {n}
      </span>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {body && <p className={styles.body}>{body}</p>}
      </div>
      <span className={styles.rail} aria-hidden />
    </li>
  );
}
