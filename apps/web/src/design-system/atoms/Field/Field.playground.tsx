import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Field } from "./Field.tsx";

const stack: CSSProperties = { display: "grid", gap: "var(--space-4)" };

export default {
  title: "Field",
  level: "atom",
  states: {
    "text: empty, filled (click or Tab for the focus ring★)": (
      <div style={stack}>
        <Field label="Name" placeholder="e.g. Oats" />
        <Field label="Name" defaultValue="Oats" />
      </div>
    ),
    "text: error and disabled": (
      <div style={stack}>
        <Field label="Name" error="Enter a name" />
        <Field label="Source" defaultValue="manual" disabled />
      </div>
    ),
    "number with a unit: empty, filled": (
      <div style={stack}>
        <Field label="Energy per 100 g" type="number" unit="kcal" />
        <Field
          label="Protein per 100 g"
          type="number"
          unit="g"
          defaultValue={17}
        />
        <Field label="Prep time" type="number" unit="min" defaultValue={10} />
      </div>
    ),
    "number with a unit: error": (
      <div style={stack}>
        <Field
          label="Fat per 100 g"
          type="number"
          unit="g"
          defaultValue={-1}
          error="Must be 0 or more"
        />
      </div>
    ),
    "multi-line: empty, long text": (
      <div style={stack}>
        <Field label="Notes" multiline rows={3} />
        <Field
          label="Description"
          multiline
          rows={3}
          defaultValue="A quick weekday lunch: seared turkey breast over rice with steamed asparagus, a squeeze of lemon and a spoon of yoghurt. It keeps two days in the fridge and reheats well in a pan with a splash of water."
        />
      </div>
    ),
    "long label wraps": (
      <div style={stack}>
        <Field
          label="Grams per unit (how much one piece or one millilitre weighs, used to convert quantities)"
          type="number"
          unit="g"
        />
      </div>
    ),
  },
} satisfies Demo;
