import { useState, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { StarRating } from "./StarRating.tsx";

const column: CSSProperties = {
  display: "grid",
  gap: "var(--space-3)",
  justifyItems: "start",
};

// The playground has no app state, so this demo keeps the value itself.
function Editable({ initial, label }: { initial: number; label: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div style={column}>
      <StarRating value={value} onChange={setValue} label={label} />
      <span>Value: {value}</span>
    </div>
  );
}

export default {
  title: "StarRating",
  level: "atom",
  states: {
    "read-only, 0 to 5 (screen readers say “Rated 3 out of 5”)": (
      <div style={column}>
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <StarRating key={value} value={value} />
        ))}
      </div>
    ),
    "editable★ (press Tab to see the focus ring, then the arrow keys; click a star)":
      <Editable initial={3} label="Your rating" />,
    "editable★, nothing rated yet (0)": (
      <Editable initial={0} label="Rate this recipe" />
    ),
  },
} satisfies Demo;
