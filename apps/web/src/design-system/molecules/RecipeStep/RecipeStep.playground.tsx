import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { RecipeStep } from "./RecipeStep.tsx";

const list: CSSProperties = { margin: 0, padding: 0, listStyle: "none" };

export default {
  title: "RecipeStep",
  level: "molecule",
  states: {
    "three steps (rail between, none after the last)": (
      <ol style={list}>
        <RecipeStep
          n={1}
          title="Prepare the turkey"
          body="Season the turkey breast with olive oil, salt and pepper. Set aside."
        />
        <RecipeStep
          n={2}
          title="Cook the rice"
          body="Rinse the brown rice, then simmer it covered for 25 minutes."
        />
        <RecipeStep
          n={3}
          title="Grill"
          body="Grill the turkey for 6 minutes a side, until cooked through."
        />
      </ol>
    ),
    "long title and long body": (
      <ol style={list}>
        <RecipeStep
          n={1}
          title="Steam the asparagus while the turkey rests on a warm plate under foil"
          body="Bring a medium pot with a steamer basket to a boil. Add the asparagus, cover and steam for four to five minutes, until bright green and just tender. Drain, season with a pinch of salt and a squeeze of lemon, and keep warm until the turkey is sliced and ready to serve."
        />
        <RecipeStep n={2} title="Serve" body="Plate and serve." />
      </ol>
    ),
    "single step": (
      <ol style={list}>
        <RecipeStep
          n={1}
          title="Serve"
          body="Slice the turkey and serve with the rice."
        />
      </ol>
    ),
    "title only (empty body)": (
      <ol style={list}>
        <RecipeStep n={1} title="Let it rest for 5 minutes" body="" />
      </ol>
    ),
  },
} satisfies Demo;
