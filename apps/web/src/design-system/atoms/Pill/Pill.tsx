import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./Pill.module.css";

// .pill from design/source/nutrigo.css: tone × style, flattened to the combinations the design has.
export const PILL_VARIANTS = [
  "green",
  "yellow",
  "orange",
  "grey",
  "solid-green",
  "solid-yellow",
  "solid-orange",
  "outline",
] as const;

type Props = {
  variant: (typeof PILL_VARIANTS)[number];
  icon?: IconName;
  children: ReactNode;
};

export function Pill({ variant, icon, children }: Props) {
  return (
    <span className={`${styles.pill} ${styles[variant]}`}>
      {icon && <Icon name={icon} size="xs" />}
      {children}
    </span>
  );
}
