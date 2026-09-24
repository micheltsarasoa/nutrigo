import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { AppShell, type NavItem } from "./AppShell.tsx";

// The app's 5 destinations (frontend.md §6). Groceries and Targets use the closest icons for now.
const items: NavItem[] = [
  { href: "#today", icon: "dashboard", label: "Today" },
  { href: "#recipes", icon: "menu", label: "Recipes" },
  { href: "#plan", icon: "calendar", label: "Plan" },
  { href: "#groceries", icon: "items", label: "Groceries" },
  { href: "#targets", icon: "time", label: "Targets" },
];

// A phone-wide frame, and a 1200 px frame that scrolls on its own on a narrow screen.
const phone: CSSProperties = {
  maxWidth: "var(--size-aside)",
  boxShadow: "var(--shadow-hairline)",
};
const desktopScroll: CSSProperties = { overflowX: "auto" };
const desktop: CSSProperties = { minWidth: "var(--breakpoint-desktop)" };
const block: CSSProperties = {
  padding: "var(--space-4)",
  marginBottom: "var(--space-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-neutral-surface)",
};

const page = (lines: number) =>
  Array.from({ length: lines }, (_, i) => (
    <p key={i} style={block}>
      Page content {i + 1}
    </p>
  ));

export default {
  title: "AppShell",
  level: "organism",
  states: {
    "tab bar, < 1200 px: Plan is current; the bar stays at the bottom while the page scrolls (press Tab for the focus ring★)":
      (
        <div style={phone}>
          <AppShell
            items={items}
            current="#plan"
            layout="tabs"
            label="Main, tab bar"
          >
            {page(8)}
          </AppShell>
        </div>
      ),
    "sidebar, ≥ 1200 px: Today is current (on a phone, scroll this frame sideways)":
      (
        <div style={desktopScroll}>
          <div style={desktop}>
            <AppShell
              items={items}
              current="#today"
              layout="sidebar"
              label="Main, sidebar"
            >
              {page(3)}
            </AppShell>
          </div>
        </div>
      ),
  },
} satisfies Demo;
