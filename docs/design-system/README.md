# Design system

> **Status: blocked**. The source is the **"Design System" page in the Claude Design project** (`b755ccdd-…`). That page needs a claude.ai login, so it can't be read from the repo or CI yet.

## What goes here once the source is available

| File | Content |
|---|---|
| `index.html` | A self-contained, living design system: tokens (colour, type, spacing, radius, elevation, motion), atoms, molecules and organisms rendered with every state, plus do's and don'ts. Light and dark |
| `dataviz.html` | Data-visualisation rules for NutriGo charts: macro colours (protein, carbs, fat, fibre), kcal against target, weekly trend, a colour-blind-safe palette, stat tiles and progress rings |
| `tokens.json` | Tokens extracted from the export; the source for generating `apps/web/src/design-system/tokens.css` |

## How to unblock (pick one)

1. **Export**: in Claude Design, open the *Design System* page (and *Meal Plan*), export or download the HTML, and commit it to `design/source/`. Then ask Claude to "build the design system from design/source".
2. **Design-sync**: set up the `/design-sync` workflow so the Claude Design project and `apps/web/src/design-system/` stay in sync, component by component.

## Rules (apply as soon as tokens exist)

- `design/source/` is **read-only**, the raw truth from Claude Design.
- Components use tokens only (Stylelint enforces this).
- Any design change starts in Claude Design, then is re-exported. Never "fix the design" only in code.
