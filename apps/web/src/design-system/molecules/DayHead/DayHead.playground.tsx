import type { Demo } from "../../../playground/types.ts";
import { DayHead } from "./DayHead.tsx";

const base = { dow: "Mon", dayNumber: 5, onSelect: () => {} };

export default {
  title: "DayHead",
  level: "molecule",
  states: {
    "normal, planned kcal (Tab to see the focus ring★)": (
      <DayHead {...base} kcal={1850} isToday={false} isSelected={false} />
    ),
    "today (green day name and number)": (
      <DayHead
        {...base}
        dow="Tue"
        dayNumber={6}
        kcal={1620}
        isToday
        isSelected={false}
      />
    ),
    selected: (
      <DayHead
        {...base}
        dow="Wed"
        dayNumber={7}
        kcal={2100}
        isToday={false}
        isSelected
      />
    ),
    "today and selected": (
      <DayHead
        {...base}
        dow="Tue"
        dayNumber={6}
        kcal={1620}
        isToday
        isSelected
      />
    ),
    "empty day": (
      <DayHead
        {...base}
        dow="Sun"
        dayNumber={11}
        kcal={0}
        isToday={false}
        isSelected={false}
      />
    ),
  },
} satisfies Demo;
