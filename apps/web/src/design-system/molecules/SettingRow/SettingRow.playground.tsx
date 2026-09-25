import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { SettingRow } from "./SettingRow.tsx";

// A plain native select stands in for the control (the settings dialog decides which).
const selectStyle: CSSProperties = {
  minHeight: "var(--size-field)",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-sm)",
  font: "inherit",
  fontSize: "var(--font-size-title)",
};
const locale = (a11y: object) => (
  <select {...a11y} style={selectStyle} defaultValue="en-GB">
    <option value="en-GB">English (UK)</option>
    <option value="fr-FR">Français</option>
  </select>
);

export default {
  title: "SettingRow",
  level: "molecule",
  states: {
    "with help text": (
      <SettingRow
        label="Language"
        help="Used for dates, numbers and the interface."
      >
        {locale}
      </SettingRow>
    ),
    "without help text": <SettingRow label="Language">{locale}</SettingRow>,
    error: (
      <SettingRow
        label="Language"
        help="Used for dates, numbers and the interface."
        error="This language isn't available yet."
      >
        {locale}
      </SettingRow>
    ),
    "long label and help text": (
      <SettingRow
        label="Language and regional format for dates, numbers and money"
        help="NutriGo shows weeks starting on Monday and money in EUR whatever you choose here; this only changes how they are written, for example 25/09/2026 or 25 sept. 2026."
      >
        {locale}
      </SettingRow>
    ),
  },
} satisfies Demo;
