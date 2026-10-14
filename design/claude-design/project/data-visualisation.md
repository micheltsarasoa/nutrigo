# Data visualisation

Charts are hand-written React and inline SVG. Adding a chart library needs an ADR. Colours come from semantic tokens through CSS variables; components never receive hex values.

## Pick the form

| Show | Use |
|---|---|
| One number | A stat tile (recipe macros, KPI tiles), not a chart |
| Two-slice comparison | A sentence: "1 750 of 2 990 kcal eaten" |
| Close values (within 5 %) | Bars, never a donut |
| Progress to a target | Progress ring with a hero number, or a labelled bar |
| Spend over weeks | Column chart (one y-axis) |
| Share of a whole, at most 6 parts | Donut or stacked bar with a legend |

## Colour by job

- Macros are categorical in a fixed order: `macro-kcal`, `macro-carbs`, `macro-protein`, `macro-fat`. Same order in lists, tiles, bars and tooltips.
- Food categories are categorical in a fixed order: grains, veggies, protein, fruits, dairy, others. Six is the ceiling; a seventh folds into Others. Colour follows the category, never its rank.
- Magnitude is a single orange hue, light to dark, for one highlighted bar in a single-series column chart.
- Over target: the fill stays full, the ring or bar turns orange (`status-attention`) and the label says "+120 kcal over" with an up triangle. State is never shown by colour alone.
- The brand palette fails colour-blind checks (kcal and carbs are nearly identical for deutan vision). The owner kept it (ADR-0008), so a second encoding is mandatory on every chart.

## Non-negotiable rules

- Identity never by colour alone. With 2 or more series a legend is always present; with 4 or fewer, also label directly. Macro tiles and bars carry their word ("Carbs"). Donut and stacked-bar legends show name, value and percent. The 45 degree hatch is the backup channel.
- Columns are at most 24 px wide, with a 4 px rounded data end and a square baseline. Leave a 2 px surface-coloured gap between touching segments. Lines are 2 px with round caps; markers are at least 8 px with a 2 px surface ring.
- Gridlines are 1 px solid `color-neutral-line`; axis text is `color-neutral-muted`. One y-axis only, never dual axes.
- Values and labels use text tokens (ink, muted), never the series colour. kcal as integers with a thin space (`1 240 kcal`), grams as integers (`35 g`), EUR with 2 decimals, locale set once in a shared formatter, estimates prefixed `~`.
- Every bar, segment and point has a hover or tap tooltip with the exact value, with a hit area larger than the mark. Each chart has a visually hidden `<table>` (or a "Show as table" toggle) with the same data. The SVG has `role="img"` and an `aria-label` that states the takeaway. Filters sit in one row above the chart.
- Respect `prefers-reduced-motion`: no ring animation.

## Empty and edge states

- No data: a placeholder with the reason and the action ("Plan meals to see nutrition").
- Target not set: show totals without a ring, with a link to Targets.
- 0 percent: the track only, with a "0 of 325 g" label.
- Over 100 percent: the fill caps at 100 percent and the label shows the overshoot.

## Implementation

Chart components (`Ring`, `ColumnChart`, `Donut`, `StackedBar`, `Legend`, `ChartTable`) live in `design-system/organisms/charts/`. Geometry (arc lengths, scales, over-target flags) is pure functions in `packages/shared/chart-math.ts`. Every chart has a playground page with the states: empty, 0 percent, typical, 100 percent, over target, and 1 and max categories.
