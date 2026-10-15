import type { Demo } from "../../../playground/types.ts";
import { CaloriesCard } from "./CaloriesCard.tsx";

const targets = { carbs: 250, protein: 120, fat: 70 };

export default {
  title: "CaloriesCard",
  level: "organism",
  states: {
    Typical: (
      <CaloriesCard
        kcal={1380}
        target={2000}
        macros={{ carbs: 160, protein: 68, fat: 41 }}
        targets={targets}
      />
    ),
    "Ring over, macros mixed": (
      <CaloriesCard
        kcal={2340}
        target={2000}
        macros={{ carbs: 260, protein: 122, fat: 92 }}
        targets={targets}
      />
    ),
    "Empty day": (
      <CaloriesCard
        kcal={0}
        target={2000}
        macros={{ carbs: 0, protein: 0, fat: 0 }}
        targets={targets}
      />
    ),
    "No targets": (
      <CaloriesCard
        kcal={1380}
        target={0}
        macros={{ carbs: 160, protein: 68, fat: 41 }}
      />
    ),
  },
} satisfies Demo;
