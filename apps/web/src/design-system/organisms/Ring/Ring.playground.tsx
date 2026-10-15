import type { Demo } from "../../../playground/types.ts";
import { Ring } from "./Ring.tsx";

export default {
  title: "Ring",
  level: "organism",
  states: {
    "0": <Ring kcal={0} target={2000} />,
    Typical: <Ring kcal={1380} target={2000} />,
    "100 %": <Ring kcal={2000} target={2000} />,
    "Over target": <Ring kcal={2340} target={2000} />,
    "No target": <Ring kcal={1380} target={0} />,
    "Reduced motion (arc drawn instantly)": (
      <Ring kcal={1380} target={2000} still />
    ),
  },
} satisfies Demo;
