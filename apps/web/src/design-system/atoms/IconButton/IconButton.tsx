import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./IconButton.module.css";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  /** Accessible name: the button shows no text. */
  label: string;
};

// Derived (SPEC-008 §4): a round, icon-only ghost button with Button's focus ring.
export function IconButton({ icon, label, type = "button", ...rest }: Props) {
  return (
    <button {...rest} type={type} aria-label={label} className={styles.button}>
      <Icon name={icon} size="md" />
    </button>
  );
}
