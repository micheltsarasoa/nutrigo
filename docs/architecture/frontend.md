# Frontend architecture

React + TypeScript + Vite, as a mobile-first PWA.

## 1. Folder structure

```
apps/web/src/
├── design-system/
│   ├── tokens.css          CSS custom properties generated from the Claude Design export
│   ├── atoms/              Button, Input, Icon, Tag, NumberField, …
│   ├── molecules/          MacroBadge, IngredientRow, SearchField, …
│   └── organisms/          RecipeCard, DayColumn, MacroChart, ShoppingListGroup, …
├── pages/                  Route-level screens (MealPlanPage, RecipesPage, …)
├── playground/             /playground route: one demo per component (dev + preview builds only)
├── api/                    Typed fetch wrappers built on the shared Zod schemas
├── lib/                    Tiny helpers (no business rules; those live in packages/shared)
├── app.tsx                 Router + layout
└── sw.ts                   Service worker (vite-plugin-pwa)
```

Each component lives in its own folder:

```
atoms/Button/
├── Button.tsx
├── Button.test.tsx         written FIRST
├── Button.playground.tsx   every variant and state, registered in /playground
└── index.ts
```

## 2. Atomic levels

Each level may only import from the levels below it. ESLint enforces this with `import/no-restricted-paths`.

```mermaid
flowchart BT
    tokens[tokens.css] --> atoms
    atoms --> molecules
    molecules --> organisms
    organisms --> pages
    atoms --> pages
    molecules --> pages
```

| Level | Definition | Example (NutriGo) | May use state/data? |
|---|---|---|---|
| Atom | One HTML element with styling, no domain meaning | `Button`, `Input`, `Chip` | Local UI state only |
| Molecule | A few atoms with one small purpose | `MacroBadge` (label, value, bar), `IngredientRow` | Props only |
| Organism | A self-contained section of a screen, and may know domain types | `RecipeCard`, `DayColumn`, `MacroChart` | Props only; no fetching |
| Page | A route that fetches data and composes organisms | `MealPlanPage` | Yes: data fetching and mutations |

Only **pages** talk to the API. Every other level is pure and driven by props, so each one can be shown in the playground with fake data.

## 3. Component lifecycle

Every component goes through these states, which are tracked by labels on its GitHub issue.

```mermaid
stateDiagram-v2
    [*] --> Specified: issue from template "Component"
    Specified --> TestWritten: failing test committed
    TestWritten --> InPlayground: component + playground demo
    InPlayground --> AwaitingValidation: label awaiting-validation
    AwaitingValidation --> InPlayground: owner requests changes
    AwaitingValidation --> Approved: owner adds design-approved
    Approved --> Integrated: used in a higher level or page
    Integrated --> [*]
```

## 4. The /playground route

- URL: `/playground` (index) → `/playground/<level>/<name>`.
- It's built into dev builds and **preview** builds. In production it's excluded by `import.meta.env.VITE_PLAYGROUND !== 'true'`.
- Each `*.playground.tsx` exports `{ title, level, states: Record<string, ReactNode> }`, and the index page discovers them with `import.meta.glob`. There's no registry to maintain by hand.
- It shows every state: default, hover/focus, disabled, loading, empty, error, long content, and dark mode if the design system has one.
- Mobile first: the preview frame defaults to a 390 px width.

## 5. State and data

| Need | Solution | Why |
|---|---|---|
| Server data | Thin `api/` wrappers + React's `use`/Suspense or a small hook. TanStack Query only if caching pain shows up (needs an ADR) | Ponytail: no dependency until there's a real need |
| Forms | Native `<form>` + `FormData` + the shared Zod schema | The platform already does this |
| Global UI state | None at first; React context if needed | YAGNI |
| Routing | React Router (data routers) | Standard, small |
| Offline | Service worker cache + IndexedDB queue for shopping-list writes | Spec in Sprint 4 |

## 6. Styling

- The only source of design values is the CSS custom properties in `tokens.css`, generated from the design system.
- Components use CSS Modules. There's no CSS-in-JS runtime.
- Mobile-first media queries, with touch targets of at least 44 px.
- Charts follow `docs/design-system/dataviz.html`.

## 7. Quality gates specific to the frontend

- Every component has a `*.test.tsx` that covers behaviour and states (Testing Library). Every state is checked with axe.
- Every playground page has a Playwright screenshot test, and approved screenshots are committed.
- Lighthouse CI budgets: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, PWA installable.
