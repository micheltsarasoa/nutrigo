import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Logo } from "./Logo.tsx";

const SIZES = ["sm", "md", "lg"] as const;

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-6)",
};
const tile = (background: string, color?: string): CSSProperties => ({
  display: "grid",
  placeItems: "center",
  padding: "var(--space-6)",
  borderRadius: "var(--radius-lg)",
  background,
  color,
});

export default {
  title: "Logo",
  level: "atom",
  states: {
    "mark: sm 20 · md 26 · lg 52 (screen readers say “NutriGo”)": (
      <div style={row}>
        {SIZES.map((size) => (
          <Logo key={size} size={size} />
        ))}
      </div>
    ),
    "lockup: mark + wordmark (the sidebar uses md)": (
      <div style={row}>
        {SIZES.map((size) => (
          <Logo key={size} size={size} wordmark />
        ))}
      </div>
    ),
    "on the green-light background (PWA icons)": (
      <div style={tile("var(--color-green-light)")}>
        <Logo size="lg" />
      </div>
    ),
    "wordmark follows the text colour (on ink)": (
      <div
        style={tile("var(--color-neutral-ink)", "var(--color-neutral-surface)")}
      >
        <Logo size="lg" wordmark />
      </div>
    ),
  },
} satisfies Demo;
