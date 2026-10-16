import { useState, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MoneyField } from "./MoneyField.tsx";

const stack: CSSProperties = { display: "grid", gap: "var(--space-4)" };

// The playground has no page state, so each demo keeps its own cents.
function Live({
  start,
  ...rest
}: {
  start: number | null;
  label: string;
  disabled?: boolean;
  error?: string;
}) {
  const [cents, setCents] = useState(start);
  return (
    <div style={stack}>
      <MoneyField {...rest} value={cents} onChange={setCents} />
      <small>Stored: {cents === null ? "nothing" : `${cents} cents`}</small>
    </div>
  );
}

export default {
  title: "MoneyField",
  level: "atom",
  states: {
    "empty and filled (type 3,5 or 3.50; leave the box to tidy it)": (
      <div style={stack}>
        <Live label="Pack price" start={null} />
        <Live label="Actual price" start={300} />
      </div>
    ),
    "error: a bad amount (type 3,0,0) or a message from the parent": (
      <div style={stack}>
        <Live label="Pack price" start={null} />
        <Live label="Pack price" start={null} error="Enter a pack size too" />
      </div>
    ),
    disabled: <Live label="Pack price" start={120} disabled />,
  },
} satisfies Demo;
