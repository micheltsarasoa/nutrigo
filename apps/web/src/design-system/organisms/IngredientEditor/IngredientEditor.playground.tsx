import type { IngredientInput, Source } from "@nutrigo/shared";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import type { Demo } from "../../../playground/types.ts";
import { IngredientEditor } from "./IngredientEditor.tsx";

// AC-1: oats, as the owner enters them.
const OATS: IngredientInput & { source: Source } = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  fibre100g: null,
  sugars100g: null,
  sodiumMg100g: null,
  defaultUnit: "g",
  gramsPerUnit: null,
  source: "manual",
};

// AC-2: an empty kcal and a negative fat. The cast stands for what the owner
// typed: the prop's type can't hold a missing kcal.
const INVALID = {
  ...OATS,
  kcal100g: null,
  fat100g: -1,
} as unknown as typeof OATS;

type Props = Partial<ComponentProps<typeof IngredientEditor>>;

// Handlers that only log, so the form can be tried here.
function Live(props: Props) {
  const [done, setDone] = useState<string | null>(null);
  return (
    <>
      <IngredientEditor
        onSave={(i) => setDone(`Saved "${i.name}"`)}
        onCancel={() => setDone("Cancelled")}
        {...(props.ingredient && { onDelete: () => setDone("Deleted") })}
        {...props}
      />
      {done && <p role="status">{done}</p>}
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
  title: "IngredientEditor",
  level: "organism",
  states: {
    "new (empty, source Manual; press Save for the errors, Tab for the focus ring★)":
      <Live />,
    "edit (Oats, AC-1 values; press Delete for the confirmation, or change a field and press Cancel)":
      <Live ingredient={OATS} />,
    "validation errors (empty kcal, negative fat, after Save)": (
      <Submitted ingredient={INVALID} />
    ),
    "saving (Save busy)": <Live ingredient={OATS} saving />,
    "server error (input kept)": (
      <Live
        ingredient={OATS}
        error="The ingredient couldn't be saved. Check your connection and try again."
      />
    ),
    "server error: delete refused, used by recipes (AC-9's 409)": (
      <Live
        ingredient={OATS}
        error="Oats can't be deleted while recipes use it."
        usedBy={["Overnight oats with berries", "Oat pancakes", "Granola bars"]}
      />
    ),
    "1280 px (on a phone, scroll this frame sideways)": (
      <div style={wideScroll}>
        <div style={wide}>
          <Live ingredient={OATS} />
        </div>
      </div>
    ),
  },
} satisfies Demo;
