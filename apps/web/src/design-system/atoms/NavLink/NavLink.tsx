import type { AnchorHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./NavLink.module.css";

// .nav-link from design/source/nutrigo.css (sidebar); the tab variant is .tabbar__item from Dashboard Mobile.
export const NAV_LINK_VARIANTS = ["sidebar", "tab"] as const;

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  icon: IconName;
  variant?: (typeof NAV_LINK_VARIANTS)[number];
  /** The current page: sets aria-current="page", which the styles key on. */
  active?: boolean;
};

export function NavLink({
  href,
  icon,
  variant = "sidebar",
  active = false,
  children,
  ...rest
}: Props) {
  return (
    <a
      {...rest}
      href={href}
      className={`${styles.link} ${styles[variant]}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={icon} size="md" />
      <span className={styles.label}>{children}</span>
    </a>
  );
}
