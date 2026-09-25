import type { ReactNode } from "react";
import type { IconName } from "../../atoms/Icon/index.ts";
import { IconButton } from "../../atoms/IconButton/index.ts";
import { Logo } from "../../atoms/Logo/index.ts";
import { NavLink } from "../../atoms/NavLink/index.ts";
import styles from "./AppShell.module.css";

// .app + .sidebar from design/source/nutrigo.css (≥ 1200 px); the bottom tab bar is .tabbar from Dashboard Mobile.
// The app picks the layout from the viewport; the shell itself only takes props.
export const APP_SHELL_LAYOUTS = ["tabs", "sidebar"] as const;

export type NavItem = { href: string; icon: IconName; label: string };

type Props = {
  items: readonly NavItem[];
  /** The current path; the item whose href starts it (at a "/") is marked as the page. */
  current: string;
  layout: (typeof APP_SHELL_LAYOUTS)[number];
  /** The navigation landmark's name. */
  label?: string;
  /** Shows the settings IconButton; called when it is pressed. Without it, no button. */
  onSettings?: () => void;
  /** The settings dialog is open: the button gets aria-expanded="true". */
  settingsOpen?: boolean;
  /** The page. Each page renders its own <main>, so the shell never nests one. */
  children: ReactNode;
};

const isCurrent = (href: string, path: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

export function AppShell({
  items,
  current,
  layout,
  label = "Main",
  onSettings,
  settingsOpen,
  children,
}: Props) {
  const variant = layout === "tabs" ? "tab" : "sidebar";
  const settingsButton = onSettings && (
    <IconButton
      icon="settings"
      label="Settings"
      aria-haspopup="dialog"
      aria-expanded={settingsOpen ?? false}
      onClick={onSettings}
    />
  );
  const nav = (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href} className={styles.item}>
            <NavLink
              href={item.href}
              icon={item.icon}
              variant={variant}
              active={isCurrent(item.href, current)}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
  const page = <div className={styles.page}>{children}</div>;

  return layout === "sidebar" ? (
    <div className={`${styles.shell} ${styles.sidebar}`}>
      {/* The banner landmark, so the lockup isn't content outside every landmark. */}
      <header className={styles.side}>
        <div className={styles.brand}>
          <Logo wordmark />
        </div>
        {nav}
        {settingsButton && (
          <div className={styles.settings}>{settingsButton}</div>
        )}
      </header>
      {page}
    </div>
  ) : (
    <div className={`${styles.shell} ${styles.tabs}`}>
      {settingsButton && (
        <header className={styles.topbar}>{settingsButton}</header>
      )}
      {page}
      <div className={styles.tabbar}>{nav}</div>
    </div>
  );
}
