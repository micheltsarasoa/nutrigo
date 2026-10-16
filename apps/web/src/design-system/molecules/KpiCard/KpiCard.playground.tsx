import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { KpiCard } from "./KpiCard.tsx";

const frame: CSSProperties = { maxWidth: "calc(var(--size-badge-lg) * 4)" };

export default {
  title: "KpiCard",
  level: "molecule",
  states: {
    "delta up": (
      <div style={frame}>
        <KpiCard
          label="Estimated cost"
          value="€58.40"
          delta={{ direction: "up", text: "+€4.20 vs last week" }}
        />
      </div>
    ),
    "delta down": (
      <div style={frame}>
        <KpiCard
          label="Total items"
          value="24"
          delta={{ direction: "down", text: "−3 vs last week" }}
        />
      </div>
    ),
    "no previous week": (
      <div style={frame}>
        <KpiCard label="Total kcal" value="14 300" hint="No previous list" />
      </div>
    ),
    "excludes unpriced items": (
      <div style={frame}>
        <KpiCard
          label="Estimated cost"
          value="€41.10"
          hint="Estimate excludes 3 items"
        />
      </div>
    ),
  },
} satisfies Demo;
