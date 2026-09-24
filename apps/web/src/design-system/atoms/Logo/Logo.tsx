import styles from "./Logo.module.css";

type Props = {
  size?: "sm" | "md" | "lg";
  /** Adds the "NutriGo" wordmark next to the mark (the sidebar lockup). */
  wordmark?: boolean;
};

// The two-bowl mark from design/source (.sidebar__brand), on its own 26 grid.
export function Logo({ size = "md", wordmark = false }: Props) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 26 26"
        focusable="false"
        {...(wordmark
          ? { "aria-hidden": true }
          : { role: "img", "aria-label": "NutriGo" })}
      >
        <path className={styles.top} d="M4 3.5h18a9 9 0 0 1-18 0z" />
        <path className={styles.bottom} d="M4 14h18a9 9 0 0 1-18 0z" />
      </svg>
      {wordmark && <span className={styles.wordmark}>NutriGo</span>}
    </span>
  );
}
