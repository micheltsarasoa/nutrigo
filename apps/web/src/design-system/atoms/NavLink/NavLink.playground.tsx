import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { NavLink } from "./NavLink.tsx";

// Stands in for the 252 px sidebar and the bottom tab bar the app shell (#32) will build.
const sidebar: CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
  width: "var(--size-sidebar)",
  maxWidth: "100%",
};

const tabBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  minWidth: 0,
  maxWidth: "var(--size-aside)",
  padding: "var(--space-2)",
  background: "var(--color-neutral-surface)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-card)",
};

export default {
  title: "NavLink",
  level: "atom",
  states: {
    "sidebar: default · active (hover them; press Tab to see the focus ring★)":
      (
        <div style={sidebar}>
          <NavLink href="#today" icon="dashboard">
            Today
          </NavLink>
          <NavLink href="#recipes" icon="menu">
            Recipes
          </NavLink>
          <NavLink href="#plan" icon="calendar" active>
            Plan
          </NavLink>
          <NavLink href="#groceries" icon="items">
            Groceries
          </NavLink>
          <NavLink href="#targets" icon="time">
            Targets
          </NavLink>
        </div>
      ),
    "tab bar: default · active (hover★ them; 44 px touch targets)": (
      <div style={tabBar}>
        <NavLink href="#today" icon="dashboard" variant="tab">
          Today
        </NavLink>
        <NavLink href="#recipes" icon="menu" variant="tab">
          Recipes
        </NavLink>
        <NavLink href="#plan" icon="calendar" variant="tab">
          Plan
        </NavLink>
        <NavLink href="#groceries" icon="items" variant="tab" active>
          Groceries
        </NavLink>
        <NavLink href="#targets" icon="time" variant="tab">
          Targets
        </NavLink>
      </div>
    ),
    "long label (ends in …)": (
      <div style={sidebar}>
        <NavLink href="#long" icon="diary">
          Weekly nutrition targets and shopping preferences
        </NavLink>
      </div>
    ),
  },
} satisfies Demo;
