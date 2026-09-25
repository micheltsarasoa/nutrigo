import type { RecipeInput } from "@nutrigo/shared";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import type { Demo } from "../../../playground/types.ts";
import { RecipeEditor } from "./RecipeEditor.tsx";

const PANTRY = [
  { id: 1, name: "Turkey breast", defaultUnit: "g" as const },
  { id: 2, name: "Brown rice", defaultUnit: "g" as const },
  { id: 3, name: "Asparagus", defaultUnit: "g" as const },
  { id: 4, name: "Olive oil", defaultUnit: "ml" as const },
  { id: 5, name: "Lemon", defaultUnit: "piece" as const },
  { id: 6, name: "Rolled oats", defaultUnit: "g" as const },
];

const TURKEY: RecipeInput = {
  name: "Grilled turkey breast with steamed asparagus and brown rice",
  description:
    "A lean and balanced meal for a post-workout lunch, rich in protein and fibre.",
  mealType: "lunch",
  servings: 2,
  difficulty: "medium",
  prepMin: 10,
  cookMin: 15,
  rating: 4,
  notes: "Marinate the turkey in lemon juice and garlic for 30 minutes.",
  ingredients: [
    { ingredientId: 1, quantity: 250, unit: "g" },
    { ingredientId: 2, quantity: 100, unit: "g" },
    { ingredientId: 5, quantity: 1, unit: "piece" },
  ],
  steps: [
    {
      title: "Grill the turkey",
      body: "Season with olive oil, salt and pepper, then grill for 6 to 7 minutes on each side.",
    },
    {
      title: "Serve",
      body: "Plate with the rice, asparagus and a lemon wedge.",
    },
  ],
  tools: [{ name: "Grill pan" }, { name: "Medium pot with a steamer basket" }],
};

const INVALID: RecipeInput = {
  ...TURKEY,
  name: "",
  ingredients: [
    { ingredientId: 1, quantity: 0, unit: "g" },
    { ingredientId: 1, quantity: 50, unit: "g" },
  ],
  steps: [{ title: "", body: "Grill for 6 minutes." }],
};

type Props = Partial<ComponentProps<typeof RecipeEditor>>;

// Handlers that only log, so the form can be tried here.
function Live(props: Props) {
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <>
      <RecipeEditor
        ingredients={PANTRY}
        onSave={(r) => setSaved(`Saved "${r.name}"`)}
        onCancel={() => setSaved("Cancelled")}
        {...props}
      />
      {saved && <p role="status">{saved}</p>}
    </>
  );
}

// Presses Save once on load. The form then focuses the first error; the demo
// gives the focus back so the page doesn't open scrolled to this state.
function Submitted(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("form")?.requestSubmit();
    requestAnimationFrame(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo(0, 0);
    });
  }, []);
  return (
    <div ref={ref}>
      <Live {...props} />
    </div>
  );
}

// A 1280 px frame that scrolls on its own on a narrow screen.
const wideScroll: CSSProperties = { overflowX: "auto" };
const wide: CSSProperties = {
  minWidth: "calc(var(--breakpoint-desktop) + var(--space-10) * 2)",
};

export default {
  title: "RecipeEditor",
  level: "organism",
  states: {
    "new (empty; press Save for the errors, Tab for the focus ring★)": <Live />,
    "edit (3 ingredients, 2 steps, 2 tools; drag a grip ⠿ to reorder, or tap it for the move buttons)":
      <Live recipe={TURKEY} />,
    "validation errors (after Save)": <Submitted recipe={INVALID} />,
    "saving (Save busy)": <Live recipe={TURKEY} saving />,
    "server error (input kept)": (
      <Live
        recipe={TURKEY}
        error="The recipe couldn't be saved. Check your connection and try again."
      />
    ),
    "discard confirmation (change a field, then press Cancel)": (
      <Live recipe={TURKEY} />
    ),
    "1280 px (on a phone, scroll this frame sideways)": (
      <div style={wideScroll}>
        <div style={wide}>
          <Live recipe={TURKEY} />
        </div>
      </div>
    ),
  },
} satisfies Demo;
