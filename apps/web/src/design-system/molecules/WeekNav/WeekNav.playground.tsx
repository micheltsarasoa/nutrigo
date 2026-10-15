import type { Demo } from "../../../playground/types.ts";
import { WeekNav } from "./WeekNav.tsx";

const noop = () => {};
const handlers = { onPrevious: noop, onNext: noop, onToday: noop };

export default {
  title: "WeekNav",
  level: "molecule",
  states: {
    "other week (Tab to see the focus ring★)": (
      <WeekNav label="Oct 5 – 11, 2026" isCurrentWeek={false} {...handlers} />
    ),
    "current week (green label, no 'This week')": (
      <WeekNav label="Sep 28 – Oct 4, 2026" isCurrentWeek {...handlers} />
    ),
    "loading (label dimmed, buttons still work)": (
      <WeekNav
        label="Oct 5 – 11, 2026"
        isCurrentWeek={false}
        loading
        {...handlers}
      />
    ),
    "week across two years": (
      <WeekNav
        label="Dec 28, 2026 – Jan 3, 2027"
        isCurrentWeek={false}
        {...handlers}
      />
    ),
  },
} satisfies Demo;
