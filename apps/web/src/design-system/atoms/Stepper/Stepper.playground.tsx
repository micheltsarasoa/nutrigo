import { useState, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Stepper } from "./Stepper.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-6)",
};

// Stepper is controlled; this keeps the demos clickable.
function Live(props: {
  label: string;
  start: number;
  min: number;
  max: number;
  step?: number;
}) {
  const { start, ...rest } = props;
  const [value, setValue] = useState(start);
  return <Stepper {...rest} value={value} onChange={setValue} />;
}

export default {
  title: "Stepper",
  level: "atom",
  states: {
    "default, 1 to 10 (hover the buttons)": (
      <div style={row}>
        <Live label="Servings" start={2} min={1} max={10} />
      </div>
    ),
    "at min: − disabled": (
      <div style={row}>
        <Live label="Guests" start={1} min={1} max={10} />
      </div>
    ),
    "at max: + disabled": (
      <div style={row}>
        <Live label="Meals per day" start={6} min={1} max={6} />
      </div>
    ),
    "focus★: press Tab to reach the value, then ArrowUp/ArrowDown, Home/End": (
      <div style={row}>
        <Live label="Portions" start={4} min={0} max={12} />
      </div>
    ),
    "44 px touch target★ around each 26 px button (invisible)": (
      <div style={row}>
        <Live label="Days" start={3} min={1} max={7} />
      </div>
    ),
    "long value: step 50 g, up to 1000": (
      <div style={row}>
        <Live label="Quantity in g" start={500} min={0} max={1000} step={50} />
      </div>
    ),
  },
} satisfies Demo;
