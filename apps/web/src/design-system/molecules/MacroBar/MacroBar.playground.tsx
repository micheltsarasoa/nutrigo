import type { Demo } from "../../../playground/types.ts";
import { MacroBar } from "./MacroBar.tsx";

export default {
  title: "MacroBar",
  level: "molecule",
  states: {
    "0 %": <MacroBar macro="carbs" label="Carbs" value={0} target={250} />,
    typical: (
      <MacroBar macro="protein" label="Protein" value={68} target={120} />
    ),
    "100 %": <MacroBar macro="carbs" label="Carbs" value={250} target={250} />,
    "over target": <MacroBar macro="fat" label="Fat" value={92} target={70} />,
    "no target": <MacroBar macro="protein" label="Protein" value={68} />,
  },
} satisfies Demo;
