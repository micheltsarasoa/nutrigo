# Component status

Every component that has, or will have, a `/playground/<level>/<name>` page. **Read this before building any component**, and update it in the same commit that changes a component's status.

## Rules

1. **Never delete a playground element** (component, `.playground.tsx`, baseline) unless the owner asks.
2. **Push on creation.** A component's branch and draft PR go to GitHub as soon as its first file exists. Work that lives only in a session's container is lost when the session ends.
3. **Check before building.** Look here and at the open branches first. If the component exists (on `main` or on a branch), continue from it; never rebuild it.
4. A playground page shows on the deployed app only once its PR is merged. Until then it lives on its branch.

## Statuses

| Status | Meaning |
|---|---|
| `later` | Planned, not started |
| `draft` | Work started, pushed to its branch |
| `awaiting-validation` | PR open, waiting for the owner's `design-approved` |
| `design-approved` | Owner approved; baseline being added |
| `done` | Merged to `main` with its visual baseline |

## Atoms

| Component | Issue | Branch / PR | Status |
|---|---|---|---|
| Icon | #19, #130 | main; #131 adds prep and cook | `done` |
| Logo | #20 | main | `done` |
| Button | #21 | main | `done` |
| Pill | #22 | main | `done` |
| IconBadge | #23 | main | `done` |
| SearchField | #24 | main (16 px since #125) | `done` |
| ProgressBar | #25 | main | `done` |
| Stepper | #26 | main | `done` |
| StarRating | #27 | main | `done` |
| MealCheck | #28 | main | `done` |
| SelectPill | #29 | main (16 px since #125) | `done` |
| NavLink | #30 | main | `done` |
| Card | #31 | main | `done` |
| Field | #88 | #116 | `done` |
| Select | #89 | #117 | `done` |
| Segmented | #90 | #118 | `done` |
| FilterTabs | #91 | #119 | `done` |
| IconButton | #92 | #124 | `done` |

## Molecules

| Component | Issue | Branch / PR | Status |
|---|---|---|---|
| MenuListItem | #93 | #140 | `done` |
| MetaRow | #94 | #128; #131 switches prep and cook to their icons | `done` |
| MacroTile | #95 | #129 | `done` |
| IngredientRow | #96 | #138 | `done` |
| RecipeStep | #97 | #137 | `done` |
| ToolItem | #98 | #133, #136 | `done` |
| NoteItem | #99 | #135 | `done` |
| NutritionRow | #100 | #132, #134 | `done` |
| PhotoOrPlaceholder | #101 | #139 | `done` |
| SettingRow | #102 | #141 | `done` |

## Organisms

| Component | Issue | Branch / PR | Status |
|---|---|---|---|
| AppShell | – (#62, #65) | main | `done` |
| AppShell: settings entry | #108 | – | `later` |
| RecipeList | #103 | #143 | `done` |
| RecipeDetail | #104 | #146 | `done` |
| RecipeEditor | #105 | #147 | `done` |
| IngredientEditor | #106 | #148 | `done` |
| SettingsDialog | #107 | #149 | `design-approved` |
