import type { InputHTMLAttributes } from "react";
import { Icon } from "../Icon/index.ts";
import styles from "./SearchField.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  /** Accessible name, also the default placeholder (the design shows no visible label). */
  label: string;
  size?: "md" | "sm";
  filled?: boolean;
};

// .search-bar from design/source/nutrigo.css: a native search input in a label, so the icon focuses it.
export function SearchField({
  label,
  size = "md",
  filled = false,
  placeholder = label,
  ...rest
}: Props) {
  const classes = [styles.field, styles[size]];
  if (filled) classes.push(styles.filled);
  return (
    <label className={classes.join(" ")}>
      <Icon name="search" size="sm" />
      <input
        {...rest}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className={styles.input}
      />
    </label>
  );
}
