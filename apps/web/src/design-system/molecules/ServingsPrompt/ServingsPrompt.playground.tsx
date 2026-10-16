import type { Demo } from "../../../playground/types.ts";
import { ServingsPrompt } from "./ServingsPrompt.tsx";

const props = {
  title: "Chickpea curry with rice",
  kcalPerServing: 305,
  onSave: () => {},
  onCancel: () => {},
};

export default {
  title: "ServingsPrompt",
  level: "molecule",
  states: {
    default: <ServingsPrompt {...props} planned={2} />,
    "custom value": <ServingsPrompt {...props} planned={2} initial={1.5} />,
    invalid: <ServingsPrompt {...props} planned={2} initial={0} />,
  },
} satisfies Demo;
