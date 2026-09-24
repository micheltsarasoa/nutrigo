import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { IconBadge } from "./IconBadge.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

export default {
  title: "IconBadge",
  level: "atom",
  states: {
    "solid, sm 28 px (headline KPIs)": (
      <div style={row}>
        <IconBadge variant="green" icon="kcal" />
        <IconBadge variant="yellow" icon="carbs" />
        <IconBadge variant="orange" icon="protein" />
      </div>
    ),
    "light, sm 28 px (inside cards)": (
      <div style={row}>
        <IconBadge variant="green-light" icon="kcal" />
        <IconBadge variant="yellow-light" icon="carbs" />
        <IconBadge variant="orange-light" icon="protein" />
        <IconBadge variant="grey" icon="fat" />
      </div>
    ),
    "lg 44 px": (
      <div style={row}>
        <IconBadge variant="green" icon="kcal" size="lg" />
        <IconBadge variant="yellow" icon="carbs" size="lg" />
        <IconBadge variant="orange" icon="protein" size="lg" />
        <IconBadge variant="green-light" icon="kcal" size="lg" />
        <IconBadge variant="yellow-light" icon="carbs" size="lg" />
        <IconBadge variant="orange-light" icon="protein" size="lg" />
        <IconBadge variant="grey" icon="fat" size="lg" />
      </div>
    ),
    "next to its text (decorative, the text is read)": (
      <p style={row}>
        <IconBadge variant="orange-light" icon="protein" /> Protein 42 g
      </p>
    ),
  },
} satisfies Demo;
