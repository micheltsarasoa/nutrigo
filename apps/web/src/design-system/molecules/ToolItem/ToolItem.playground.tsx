import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { ToolItem } from "./ToolItem.tsx";

// Two columns once each can hold about seven badges' width, one on a phone.
const list: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(max(calc(var(--size-badge-lg) * 7), 40%), 1fr))",
  gap: "var(--space-4) var(--space-6)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export default {
  title: "ToolItem",
  level: "molecule",
  states: {
    "four tools": (
      <ol style={list}>
        <ToolItem n={1} name="Grill pan or outdoor grill" />
        <ToolItem n={2} name="Medium pot for steaming" />
        <ToolItem n={3} name="Saucepan for cooking brown rice" />
        <ToolItem n={4} name="Tongs for turning turkey" />
      </ol>
    ),
    "long tool name": (
      <ol style={list}>
        <ToolItem
          n={1}
          name="Saucepan with a tight-fitting lid, large enough to cook brown rice for four people"
        />
      </ol>
    ),
    "single tool": (
      <ol style={list}>
        <ToolItem n={1} name="Knife" />
      </ol>
    ),
  },
} satisfies Demo;
