# Component workflow

Build bottom-up: atoms, then molecules, then organisms, then pages. Never build a level before the pieces below it exist and the owner has approved them.

1. Check the Components view and `component-status.md`. If the component exists (merged or on a branch), continue from it. Never rebuild one.
2. Write the failing test, then the minimal component using tokens only (no raw colour, size or font value; Stylelint enforces it).
3. Show it in the playground at `/playground/<level>/<name>` with every state: default, hover, focus-visible, disabled, loading, empty, error where they apply.
4. The owner validates it at 1280 px (label `design-approved`) before any page uses it. Then the screenshot baseline is committed.
5. Never delete a playground element unless the owner asks.

Molecules are built from approved atoms only. Organisms are screen sections that take props and never fetch data.

## Level map

| Level | Components |
|---|---|
| Atoms | Button, Card, Field, FilterTabs, Icon, IconBadge, IconButton, Logo, MealCheck, NavLink, Pill, ProgressBar, SearchField, Segmented, Select, SelectPill, StarRating, Stepper |
| Molecules | IngredientRow, MacroTile, MenuListItem, MetaRow, NoteItem, NutritionRow, PhotoOrPlaceholder, RecipeStep, SettingRow, ToolItem |
| Organisms | AppShell, IngredientEditor, IngredientList, RecipeDetail, RecipeEditor, RecipeList, SettingsDialog |

The Components view shows the ones merged to `main`. `component-status.md` is the full list with issue, branch and status.

## Controls and fields

- Text input, number input, select and search are native elements (`<input>`, `<select>`, `<input type="search">`) styled with tokens.
- A form field always has a visible label, and an error message that says what went wrong and how to fix it.
- Select pill wraps a native `<select>`. Filter tabs are a `role="tablist"` or a radio group. Stepper has min and max, keyboard arrows and 44 px targets. Rating is a radio group, 1 to 5, editable.
- Meal check is a native checkbox, 18 px visual with a 44 px hit area and the label "Mark breakfast as eaten".
- Progress bar is `role="progressbar"` with `aria-valuenow`, always next to a numeric label.
