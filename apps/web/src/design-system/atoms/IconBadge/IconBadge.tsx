import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./IconBadge.module.css";

// .icon-badge from design/source/nutrigo.css. Solid for headline KPIs, light inside cards.
export const ICON_BADGE_VARIANTS = [
  "green",
  "yellow",
  "orange",
  "green-light",
  "yellow-light",
  "orange-light",
  "grey",
] as const;

type Props = {
  variant: (typeof ICON_BADGE_VARIANTS)[number];
  icon: IconName;
  size?: "sm" | "lg";
};

// Decorative: the text next to it carries the meaning.
export function IconBadge({ variant, icon, size = "sm" }: Props) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${styles[size]}`}
      aria-hidden
    >
      <Icon name={icon} size={size === "sm" ? "sm" : "lg"} />
    </span>
  );
}
