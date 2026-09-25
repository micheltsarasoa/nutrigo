import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MetaRow } from "./MetaRow.tsx";

const list: CSSProperties = { margin: 0 };

export default {
  title: "MetaRow",
  level: "molecule",
  states: {
    "each meta type": (
      <dl style={list}>
        <MetaRow icon="time" label="Prep time" value="10 min" />
        <MetaRow icon="time" label="Cook time" value="15 min" />
        <MetaRow icon="difficulty" label="Difficulty" value="Medium" />
        <MetaRow icon="steps" label="Steps" value="5 steps" />
        <MetaRow icon="health-score" label="Health score" value="9/10" />
      </dl>
    ),
    "missing value": (
      <dl style={list}>
        <MetaRow icon="time" label="Cook time" value={null} />
      </dl>
    ),
    "long value": (
      <dl style={list}>
        <MetaRow
          icon="difficulty"
          label="Difficulty"
          value="Medium, needs a food processor and a very sharp knife"
        />
      </dl>
    ),
  },
} satisfies Demo;
