# ADR-0017: Deleting a planned recipe takes it off the plan

- Status: Accepted (2026-10-24)
- Date: 2026-10-24
- Deciders: Owner
- Amends: SPEC-003 AC-12 (and SPEC-002 AC-8), the `meal_entry → recipe` rule in `data-model.md`

## Context
SPEC-003 AC-12 refuses to delete a planned recipe (409), and the API does that since S2. The Recipes page proposal (2026-10-23) instead warns, lists the planned meals and deletes them with the recipe. The owner chose to keep the proposal. Eaten meals are diary history (SPEC-004) and must not disappear.

## Decision
1. `DELETE /api/recipes/:id` still answers 409 when the recipe has meals not yet eaten. The 409 body lists them (`plannedMeals: [{ date, slot }]`) and counts the eaten ones (`eatenCount`).
2. `DELETE /api/recipes/:id?unplan=true` deletes, in one transaction, the recipe's meals not yet eaten, then the recipe.
3. If eaten meals remain, the recipe is archived (`recipe.archived_at`) instead of deleted. Archived recipes are hidden from the list, search and the RecipePicker, and still resolve for the diary.
4. The UI: confirm, then on 409 show the planned meals ("Deleting also takes them off the plan. N already eaten stay in your history.") and a "Delete anyway" button.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Keep the 409 (SPEC-003 as written) | Already built | The owner must unplan each meal by hand first |
| Cascade delete every meal | Simplest | Erases eaten meals from the diary |
| Snapshot the recipe into each eaten meal | No archived rows | A new copy of nutrition per meal; much more code |

## Consequences
- Migration: `recipe.archived_at` (nullable text). Recipe list and picker queries filter on it.
- The existing 409 path stays; only its body and the `?unplan=true` branch are new.
- Undo and multi-select delete from the proposal are not part of this decision.
