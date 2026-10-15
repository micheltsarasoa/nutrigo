import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Button } from "../../atoms/Button/index.ts";
import { RecipePicker, type PickerRecipe } from "./RecipePicker.tsx";

const RECIPES: PickerRecipe[] = [
  ["Greek yoghurt bowl", "breakfast", 320],
  ["Lentil and spinach soup", "lunch", 410],
  ["Chicken curry with basmati rice", "dinner", 640],
  ["Apple and almond snack", "snack", 180],
].map(([title, mealType, kcalPerServing], i) => ({
  id: i + 1,
  title: title as string,
  mealType: mealType as PickerRecipe["mealType"],
  kcalPerServing: kcalPerServing as number,
  photo: null,
  mosaic: [],
}));

type Props = Partial<ComponentProps<typeof RecipePicker>> & {
  /** Opens on the servings step, as if the first listed recipe was clicked. */
  pick?: boolean;
};

// The dialog is modal (top layer): a trigger button plus the dialog, closed until
// clicked. The search filters the sample recipes; handlers only log.
function Live({ pick, query: initial = "", ...props }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initial);
  const [log, setLog] = useState<string | null>(null);

  useEffect(() => {
    if (open && pick)
      wrapperRef.current
        ?.querySelector<HTMLButtonElement>("ul button")
        ?.click();
  }, [open, pick]);

  return (
    <div ref={wrapperRef}>
      <Button icon="add" onClick={() => setOpen(true)}>
        Add meal
      </Button>
      <RecipePicker
        open={open}
        heading="Add to Tuesday · Lunch"
        recipes={RECIPES.filter((r) =>
          r.title.toLowerCase().includes(query.toLowerCase()),
        )}
        query={query}
        onQueryChange={setQuery}
        onPick={(r, servings) => {
          setLog(`Added ${r.title} × ${servings}`);
          setOpen(false);
        }}
        {...props}
        onClose={() => setOpen(false)}
      />
      {log && <p role="status">{log}</p>}
    </div>
  );
}

export default {
  title: "RecipePicker",
  level: "organism",
  states: {
    "search with results (type to filter; click a recipe; Esc or Cancel closes★)":
      <Live />,
    "filtered (curry)": <Live query="curry" />,
    "no results": <Live query="pizza" />,
    loading: <Live loading />,
    "picking servings (the kcal follows the stepper)": <Live pick />,
    "saving (Add busy)": <Live pick saving />,
    "add error (the servings step stays)": (
      <Live
        pick
        error="Couldn’t add the meal. Check your connection and try again."
      />
    ),
  },
} satisfies Demo;
