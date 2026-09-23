# Design system

The source is the Claude Design project (pages *Design System*, *Dashboard*, *Meal Plan*, *Healthy Menu*, *Recipe Details*, *Grocery List*, …), exported on 2026-09-23 into [`design/source/`](../../design/source/). That folder is **read-only**; re-export to update it.

| File | Content |
|---|---|
| [`index.html`](index.html) | Living design system: colour, semantic colour, contrast audit, type, space, icons and logo, atoms, molecules, organisms, layout and mobile rules, screen inventory, removed patterns, known issues |
| [`dataviz.html`](dataviz.html) | Chart inventory, colour by job, validator results, non-negotiable rules, reference renderings |
| [`tokens.json`](tokens.json) | Tokens (source, derived and proposed), the source for `apps/web/src/design-system/tokens.css` |

Open the HTML files locally (e.g. `npx serve .` at the repo root, then `/docs/design-system/`). They load `design/source/nutrigo.css` by relative path.

## Key decisions (2026-09-23 review)

| Topic | Decision |
|---|---|
| Scope | Recipes, meal plan, Today (calories, macros, food diary), groceries with costs. **Out:** progress/weight, activity/steps/sleep/water/workouts, insights/articles, messages, social, promo, logout |
| Contrast | Kept as designed for now; fix later by changing token values only (ADR-0008) |
| Semantic colours | Taken from the Design System page's stat chips: kcal green, carbs yellow, protein orange, fat grey |
| Mobile | Derived from the design's own mobile rules; each screen is validated in `/playground` |
| Week | Monday start (ISO), which changes the design's Sunday start |
| Currency / units | EUR; always `g` |
| Photos | From imports (OFF ingredient images) + own upload; placeholder otherwise |
| Theme | Light only (no dark theme in the design) |
| Font | Poppins, self-hosted for offline use |

## Rules

- `design/source/` is **read-only**, the raw truth from Claude Design.
- Components use tokens only (Stylelint enforces this); raw hex values in the export are promoted to `derived` tokens.
- Any design change starts in Claude Design and is then re-exported. Never "fix the design" only in code; a deviation is recorded in `index.html` §13.
- `support.js` and `image-slot.js` are the Claude Design preview runtime. They are **never** imported into the app.
