# Layout and scope

## Breakpoints

| Width | Layout |
|---|---|
| 1200 px and up | `size-sidebar` 252 px sidebar plus main; at 1440 px and up a `size-aside` 340 px aside |
| 768 to 1199 px | One wider column, cards in 2 columns where they fit |
| Under 768 px | One column, bottom tab bar, page title in a top bar |

Until v1.0.0 only the 1200 px and up layout is built and validated (ADR-0013). Below that the app must not break, but it gets no mobile-only layouts or components. When mobile work starts, the rules are: only the grid changes, same tokens and atoms, a 5-item tab bar (Today, Recipes, Plan, Groceries, Targets), hit targets of at least 44 px, no reading text under 12 px, tables become grouped lists, and `env(safe-area-inset-bottom)` under the tab bar.

## What ships

| Screen | Route | Notes |
|---|---|---|
| Design system | `/playground` | Tokens, atoms, logo |
| Recipes | `/recipes` | Your recipe library, not a public menu. No reviews, no "Popular" |
| Recipe detail | `/recipes/:id` | No reviews; "Eat time" comes from the plan |
| Editors | `/recipes/new`, `/ingredients` | Derived from atoms, validated in the playground |
| Meal plan | `/plan/:isoWeek` | Monday start |
| Today | `/` | Calories card, macros, today's meals with check-off |
| Groceries | `/groceries/:isoWeek` | Estimated and actual cost in EUR |

## Deliberately not built

- Multi-user and marketing: logout, user menu, avatar, "Member" role, promo banner, footer social links, notification bell, messages (no auth, ADR-0002).
- Social: reviews, "by N people", popular menu, top authors, trending tags.
- Out-of-scope tracking: weight ruler, gauge and chart; steps, sleep and water bars; workouts and exercises; burned calories; health insights and articles.
