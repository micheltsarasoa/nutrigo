import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary-green" | "primary-orange" | "ghost";
  size?: "md" | "sm";
  /** Full width. */
  block?: boolean;
  icon?: IconName;
  /** Busy: ignores clicks but keeps focus, unlike `disabled`. */
  loading?: boolean;
};

// .btn from design/source/nutrigo.css.
export function Button({
  variant = "primary-green",
  size = "md",
  block = false,
  icon,
  loading = false,
  type = "button",
  onClick,
  children,
  ...rest
}: Props) {
  const classes = [styles.button, styles[variant], styles[size]];
  if (block) classes.push(styles.block);
  return (
    <button
      {...rest}
      type={type}
      className={classes.join(" ")}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
    >
      {icon && <Icon name={icon} size={size} />}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
