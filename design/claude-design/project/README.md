Use this system for NutriGo, a personal single-user PWA to plan weekly meals, manage recipes and ingredients, track nutrition and build shopping lists. Light theme only. Desktop-first (1200 px and up) until v1.0.0. Every value below is a token from `tokens.json`; never write a raw colour, size or font value.

## Content fundamentals

- Write short, plain UI copy. Controls say what happens: "Add to Meal Plan", "Add Recipe", "Add Item". Names are Title Case on buttons and pills, sentence case in body text.
- Units are always `g`, never "gr". Calories are `kcal`, integers, with a thin space for thousands: `1 240 kcal`. Grams are integers: `35 g`.
- Money is EUR, shown with 2 decimals (`€57.40`), stored as integer cents. Estimated values start with `~` (`~€1.00`).
- Weeks start on Monday (ISO) and have 7 days.
- A status or delta is never shown by colour alone: it carries a word or an icon (`+120 kcal over ▲`, "Purchased").
- No reviews, no social proof, no promo copy, no "Popular" labels, no avatars: there is one user and no login.

## Visual foundations

### Colour

- Three families, each in three tints: lime green (`color-green-base`, `-medium`, `-light`), sunny yellow (`color-yellow-*`), vibrant orange (`color-orange-*`). Warm neutrals sit under them.
- Page ground is `color-neutral-cream`; cards are `color-neutral-surface`; subtle fills use `color-neutral-subtle`; hairlines use `color-neutral-line`; tracks use `color-neutral-track`.
- Text is `color-neutral-ink`; secondary text is `color-neutral-muted`. `color-neutral-faint` is decorative only, never for text a user must read.
- Put ink text on any base colour. Use `*-on-light` tokens for coloured text or icons on a light tint. Hover states are `color-green-hover` and `color-orange-hover`.
- Red (`color-red-base`) is only for destructive actions and errors.

### One meaning, one colour

| Meaning | Tokens |
|---|---|
| Calories | `macro-kcal` (green) |
| Carbs | `macro-carbs` (yellow) |
| Protein | `macro-protein` (orange) |
| Fat | `macro-fat` (grey) |
| Meal slots | `meal-slot-breakfast` green, `meal-slot-lunch` yellow, `meal-slot-snack` grey, `meal-slot-dinner` orange |
| Grocery aisles | `food-category-grains`, `-veggies`, `-protein`, `-fruits`, `-dairy`, `-others` (six is the ceiling; a seventh folds into Others) |
| Status | `status-done` green, `status-todo` yellow, `status-attention` orange, `status-danger` red |

Always list macros in the order kcal, carbs, protein, fat. Use the semantic token, never the base colour it points to.

### Typography

- Poppins carries all type, self-hosted as woff2 in 5 weights (400, 500, 600, 700, 800) so the app works offline. Use `font-sans`.
- The scale has 7 steps: `page` 26/800, `figure` 28/800, `figure-sm` 20/800, `title` 16/600, `body` 14/400, `caption` 12/500, `micro` 11/500 (desktop only). Never put reading text below 12 px.
- Titles use `font-tracking-tight` (`-0.02em`); card titles use `font-tracking-card-title`.

### Space, radius, elevation

- Spacing is a 4 px base: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-5` 20, `space-6` 24, `space-8` 32, `space-10` 40. Snap any other value to the nearest token.
- Radius: `radius-xs` 6, `radius-sm` 8, `radius-md` 12, `radius-lg` 16, `radius-xl` 20 (cards), `radius-2xl` 24, `radius-pill` 999.
- Two elevation levels only: `shadow-soft` for tooltips and `shadow-card` for cards. `shadow-outline` and `shadow-hairline` are inset rings, not elevation.
- Cards are `color-neutral-surface`, `radius-xl`, `shadow-card`, `space-5` padding.

### States, focus and motion

- Focus is a visible ring: `focus-width` 2 px, `focus-offset` 2 px, `focus-color` ink. Never remove it.
- Disabled controls use `opacity-disabled`.
- Transitions use `motion-fast` (150 ms ease). Respect `prefers-reduced-motion`: no ring or chart animation.
- Hit targets are at least `size-touch-target` (44 px). Small controls keep a 44 px hit area around a smaller visual.
- Every component needs default, hover, focus-visible, disabled, loading, empty and error states where they apply. The design only drew the default; the others are proposed in the playground.

### Layout

- At 1200 px and up: a `size-sidebar` (252 px) sidebar plus the main column; at 1440 px and up a `size-aside` (340 px) aside is added.
- Below 1200 px the app must not break, but it gets no mobile-only layouts until v1.0.0.

## Iconography

- Icons are inline SVG on a 24 px grid with round caps and 1.9 to 2 px strokes, drawn with `stroke="currentColor"` so they inherit text colour. There is no icon library and no emoji in the UI.
- Use the `Icon` component by name. Sizes: `size-icon-xs` 12, `size-icon-sm` 16, `size-icon-md` 18, `size-icon-lg` 20.
- Icons are decorative (`aria-hidden`) unless they carry meaning alone; then give them a label.
- Put an icon on a solid green or yellow badge in ink, never white (white fails contrast).
- `assets/Icons/` holds every icon as a single-ink SVG in `color-neutral-ink` (#1F2937). Recolour by editing the file, not by CSS.

### Logo

- The mark is two stacked bowls on a 26 px grid. `assets/Logos/` holds the mark.
- Keep clear space of half the mark height on every side. Minimum size is 20 px for the mark and 15 px for the wordmark.
- Never rotate, recolour or stretch it. Wordmark is "NutriGo", set in Poppins.

## How components are built

Atoms, then molecules, then organisms, then pages; read `component-workflow.md`. Every component shows all its states in this system's Components view. Reuse an existing component; do not rebuild one.

## Not synced

Fonts are the Latin subset of Poppins. The product has no dark theme. Contrast failures listed in `known-issues.md` are kept on purpose (ADR-0008).
