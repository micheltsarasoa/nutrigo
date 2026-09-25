import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Segmented } from "./Segmented.tsx";

const VIEWS = [
  { value: "list", icon: "steps", label: "List view" },
  { value: "grid", icon: "dashboard", label: "Grid view" },
] as const;

function Live({ start }: { start: "list" | "grid" }) {
  const [view, setView] = useState<"list" | "grid">(start);
  return (
    <Segmented label="View" options={VIEWS} value={view} onChange={setView} />
  );
}

export default {
  title: "Segmented",
  level: "atom",
  states: {
    "list active (tap an option; Tab then ← → for the keyboard★)": (
      <Live start="list" />
    ),
    "grid active": <Live start="grid" />,
  },
} satisfies Demo;
