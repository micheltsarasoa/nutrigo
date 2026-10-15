import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Button } from "../../atoms/Button/index.ts";
import { MealActionsMenu } from "./MealActionsMenu.tsx";

const DAYS = [
  "Mon 5",
  "Tue 6",
  "Wed 7",
  "Thu 8",
  "Fri 9",
  "Sat 10",
  "Sun 11",
].map((label, i) => ({
  date: `2026-10-${String(5 + i).padStart(2, "0")}`,
  label,
}));

type Props = Partial<ComponentProps<typeof MealActionsMenu>> & {
  /** Opens on this action, as if its button was clicked. */
  start?: string;
};

// The dialog is modal (top layer): a trigger button plus the dialog, closed until
// clicked. Handlers only log, so it can be tried here.
function Live({ start, ...props }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const say = (text: string) => () => {
    setLog(text);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || !start) return;
    [...(wrapperRef.current?.querySelectorAll("dialog button") ?? [])]
      .find((b) => b.textContent === start)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, [open, start]);

  return (
    <div ref={wrapperRef}>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Open meal actions
      </Button>
      <MealActionsMenu
        open={open}
        title="Chicken curry with basmati rice"
        servings={2}
        date="2026-10-06"
        slot="lunch"
        days={DAYS}
        onServings={(n) => say(`Servings ${n}`)()}
        onMove={(d, s) => say(`Moved to ${d} ${s}`)()}
        onDuplicate={(d, s) => say(`Duplicated to ${d} ${s}`)()}
        onRemove={say("Removed")}
        {...props}
        onClose={() => setOpen(false)}
      />
      {log && <p role="status">{log}</p>}
    </div>
  );
}

export default {
  title: "MealActionsMenu",
  level: "organism",
  states: {
    "the actions (Esc or Cancel closes, focus returns to the button★)": (
      <Live />
    ),
    "change servings (Save waits for a change)": (
      <Live start="Change servings" />
    ),
    "move (Tue lunch now; the button waits for another slot)": (
      <Live start="Move" />
    ),
    "duplicate (the same slot is allowed)": <Live start="Duplicate" />,
    "remove, to confirm": <Live start="Remove" />,
    "saving (the confirm button busy)": <Live start="Remove" saving />,
    "action error (the step stays)": (
      <Live
        start="Remove"
        error="Couldn’t update the meal. Check your connection and try again."
      />
    ),
  },
} satisfies Demo;
