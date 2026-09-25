import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { IconButton } from "./IconButton.tsx";

const row: CSSProperties = {
  display: "flex",
  gap: "var(--space-4)",
  alignItems: "center",
};

export default {
  title: "IconButton",
  level: "atom",
  states: {
    "default (hover it, or Tab for the focus ring★)": (
      <div style={row}>
        <IconButton icon="settings" label="Settings" />
      </div>
    ),
    "active: its dialog is open": (
      <div style={row}>
        <IconButton
          icon="settings"
          label="Settings"
          aria-haspopup="dialog"
          aria-expanded
        />
      </div>
    ),
    disabled: (
      <div style={row}>
        <IconButton icon="settings" label="Settings" disabled />
      </div>
    ),
  },
} satisfies Demo;
