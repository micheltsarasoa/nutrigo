import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Icon, ICON_NAMES } from "./Icon.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-4)",
};
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(calc(var(--size-control) * 2), 1fr))",
  gap: "var(--space-4)",
};
const cell: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "var(--space-1)",
  fontSize: "var(--font-size-micro)",
};
const caption: CSSProperties = {
  color: "var(--color-neutral-muted)",
  overflowWrap: "break-word",
  textAlign: "center",
};

export default {
  title: "Icon",
  level: "atom",
  states: {
    "all 20 icons (md, 18 px)": (
      <div style={grid}>
        {ICON_NAMES.map((name) => (
          <div key={name} style={cell}>
            <Icon name={name} />
            <span style={caption}>{name}</span>
          </div>
        ))}
      </div>
    ),
    "sizes: xs 12 · sm 16 · md 18 · lg 20 (proposed tokens)": (
      <div style={row}>
        {(["xs", "sm", "md", "lg"] as const).map((size) => (
          <span key={size} style={row}>
            <Icon name="kcal" size={size} /> <Icon name="search" size={size} />{" "}
            {size}
          </span>
        ))}
      </div>
    ),
    "colour follows the text (currentColor)": (
      <div style={row}>
        <span style={{ color: "var(--color-neutral-ink)" }}>
          <Icon name="time" /> ink
        </span>
        <span style={{ color: "var(--color-neutral-muted)" }}>
          <Icon name="time" /> muted
        </span>
        <span style={{ color: "var(--color-green-on-light)" }}>
          <Icon name="check" /> green on light
        </span>
        <span style={{ color: "var(--color-orange-on-light)" }}>
          <Icon name="protein" /> orange on light
        </span>
      </div>
    ),
    "inline with text (decorative) and labelled (screen readers say “Health score”)":
      (
        <p style={row}>
          <span>
            <Icon name="time" size="sm" /> 25 min
          </span>
          <Icon name="health-score" label="Health score" />
        </p>
      ),
  },
} satisfies Demo;
