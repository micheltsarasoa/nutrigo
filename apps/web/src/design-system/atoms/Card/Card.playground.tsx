import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Card } from "./Card.tsx";

const body: CSSProperties = {
  margin: 0,
  color: "var(--color-neutral-muted)",
};

const noop = () => {};

export default {
  title: "Card",
  level: "atom",
  states: {
    "with header + more menu (press Tab to see the focus ring★)": (
      <Card title="Calories Intake" onMore={noop}>
        <p style={body}>
          White surface, 20 px radius, card shadow, 20 px padding.
        </p>
      </Card>
    ),
    "with header, no more menu, heading level 3": (
      <Card title="Recommended Menu" headingLevel={3}>
        <p style={body}>The title is a real heading; the level is a prop.</p>
      </Card>
    ),
    "without header": (
      <Card>
        <p style={body}>
          Only content: a plain container, no heading, no region.
        </p>
      </Card>
    ),
    "more menu without a title": (
      <Card onMore={noop}>
        <p style={body}>The button is named "More options".</p>
      </Card>
    ),
    "320 px, long title and long content (wraps, no sideways scroll)": (
      <div style={{ maxWidth: "320px" }}>
        <Card
          title="Recommended exercises for the whole week, including rest days and Supercalifragilisticexpialidocious"
          onMore={noop}
        >
          <p style={body}>
            Grilled chicken with quinoa, roasted vegetables and a lemon tahini
            dressing. Pneumonoultramicroscopicsilicovolcanoconiosis never
            overflows the card.
          </p>
        </Card>
      </div>
    ),
    "1280 px (shrinks to the screen when narrower)": (
      <div style={{ maxWidth: "1280px" }}>
        <Card title="Weight Data" onMore={noop}>
          <p style={body}>A wide card on a desktop page.</p>
        </Card>
      </div>
    ),
  },
} satisfies Demo;
