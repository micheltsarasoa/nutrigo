import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Button } from "./Button.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

export default {
  title: "Button",
  level: "atom",
  states: {
    "variants, md 40 px (hover them; press Tab to see the focus ring★)": (
      <div style={row}>
        <Button>Add to Meal Plan</Button>
        <Button variant="primary-orange">Emphasis</Button>
        <Button variant="ghost">Filter</Button>
      </div>
    ),
    "sm 32 px (44 px touch target)": (
      <div style={row}>
        <Button size="sm">Add Item</Button>
        <Button size="sm" variant="primary-orange">
          Emphasis
        </Button>
        <Button size="sm" variant="ghost">
          See All
        </Button>
      </div>
    ),
    "with an icon": (
      <div style={row}>
        <Button icon="add">Add Recipe</Button>
        <Button variant="ghost" icon="filter">
          Filter
        </Button>
        <Button size="sm" icon="add">
          Add Item
        </Button>
      </div>
    ),
    "disabled★": (
      <div style={row}>
        <Button disabled>Add to Meal Plan</Button>
        <Button variant="primary-orange" disabled>
          Emphasis
        </Button>
        <Button variant="ghost" disabled>
          Filter
        </Button>
      </div>
    ),
    "loading★ (still focusable, clicks ignored)": (
      <div style={row}>
        <Button loading>Saving…</Button>
        <Button size="sm" variant="ghost" loading>
          Loading…
        </Button>
      </div>
    ),
    "block and a long label (ends in …)": (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "var(--space-3)",
        }}
      >
        <Button block>Add to Meal Plan</Button>
        <Button block variant="ghost">
          Generate the shopping list for the whole week, including snacks and
          drinks
        </Button>
      </div>
    ),
  },
} satisfies Demo;
