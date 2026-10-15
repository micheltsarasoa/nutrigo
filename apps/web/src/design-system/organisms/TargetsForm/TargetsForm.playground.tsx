import type { Demo } from "../../../playground/types.ts";
import { TargetsForm } from "./TargetsForm.tsx";

const noop = () => {};

export default {
  title: "TargetsForm",
  level: "organism",
  states: {
    Empty: <TargetsForm onSave={noop} />,
    Filled: (
      <TargetsForm
        initial={{ kcal: 2000, carbs: 250, protein: 120, fat: 70 }}
        onSave={noop}
      />
    ),
    Errors: (
      <TargetsForm
        checked
        initial={{ kcal: "", carbs: "abc", protein: -20, fat: 70 }}
        onSave={noop}
      />
    ),
    Saving: (
      <TargetsForm
        saving
        initial={{ kcal: 2000, carbs: 250, protein: 120, fat: 70 }}
        onSave={noop}
      />
    ),
    "Save failed": (
      <TargetsForm
        error="Couldn’t save your targets. Try again."
        initial={{ kcal: 2000 }}
        onSave={noop}
      />
    ),
  },
} satisfies Demo;
