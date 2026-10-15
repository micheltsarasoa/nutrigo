import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MealAddSlot } from "./MealAddSlot.tsx";

// One plan column is about this wide.
const column: CSSProperties = { width: "calc(var(--size-aside) * 0.5)" };

export default {
  title: "MealAddSlot",
  level: "molecule",
  states: {
    "idle (Tab to see the focus ring★, Enter adds)": (
      <div style={column}>
        <MealAddSlot label="Add lunch on Tue" onAdd={() => {}} />
      </div>
    ),
  },
} satisfies Demo;
