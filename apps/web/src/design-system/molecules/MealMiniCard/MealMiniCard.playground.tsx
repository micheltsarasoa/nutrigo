import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MealMiniCard } from "./MealMiniCard.tsx";

// Stand-in image for the demo only.
const photo = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#C2E66E"/><stop offset="1" stop-color="#FFA257"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><circle cx="80" cy="50" r="30" fill="#fff" fill-opacity=".35"/></svg>`,
)}`;

// One plan column is about this wide.
const column: CSSProperties = { width: "calc(var(--size-aside) * 0.5)" };

const base = {
  kcalPerServing: 450,
  servings: 1,
  mosaic: [],
  mealType: "lunch" as const,
  onOpen: () => {},
};

export default {
  title: "MealMiniCard",
  level: "molecule",
  states: {
    "with photo (Tab to see the focus ring★)": (
      <div style={column}>
        <MealMiniCard {...base} name="Grilled Chicken Salad" photo={photo} />
      </div>
    ),
    "without photo (meal-type placeholder)": (
      <div style={column}>
        <MealMiniCard
          {...base}
          name="Quinoa and Kale Bowl"
          photo={null}
          mealType="dinner"
        />
      </div>
    ),
    "long recipe name (two lines, full name on hover)": (
      <div style={column}>
        <MealMiniCard
          {...base}
          name="Slow-roasted lemon and thyme chicken with charred greens"
          photo={null}
        />
      </div>
    ),
    "2 servings (kcal doubles, badge)": (
      <div style={column}>
        <MealMiniCard
          {...base}
          name="Grilled Chicken Salad"
          photo={photo}
          servings={2}
        />
      </div>
    ),
  },
} satisfies Demo;
