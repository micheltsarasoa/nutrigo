# Data model (SQLite)

This draft covers v1. The source of truth is `apps/api/src/db/schema.ts`, and this document must be updated in the same PR as any schema change.

## 1. Entity-relationship diagram

```mermaid
erDiagram
    INGREDIENT ||--o{ RECIPE_INGREDIENT : "used in"
    RECIPE ||--|{ RECIPE_INGREDIENT : contains
    RECIPE ||--o{ RECIPE_STEP : "has"
    RECIPE ||--o{ RECIPE_TOOL : "needs"
    RECIPE ||--o{ RECIPE_TAG : "tagged"
    TAG ||--o{ RECIPE_TAG : ""
    RECIPE ||--o{ MEAL_ENTRY : "planned as"
    MEAL_ENTRY }o--|| PLAN_WEEK : "belongs to"
    PLAN_WEEK ||--o| SHOPPING_LIST : "generates"
    SHOPPING_LIST ||--|{ SHOPPING_ITEM : contains
    INGREDIENT ||--o{ SHOPPING_ITEM : "refers to"
    CIQUAL_FOOD ||..o{ INGREDIENT : "copied into (no FK)"

    INGREDIENT {
        integer id PK
        text name "UNIQUE"
        text category "grains|veggies|protein|fruits|dairy|others"
        text source "manual|off|ciqual|ai_estimate"
        text external_id "nullable, OFF barcode or CIQUAL alim_code"
        text image_url "nullable, from OFF import"
        text image_path "nullable, local cached copy"
        real kcal_100g
        real carbs_100g
        real protein_100g
        real fat_100g
        real fibre_100g "nullable"
        real sugars_100g "nullable"
        real sodium_mg_100g "nullable"
        text default_unit "g|ml|piece"
        real grams_per_unit "nullable, for piece/ml"
        integer price_cents "nullable, EUR"
        real price_pack_qty "nullable, e.g. 500"
        text price_pack_unit "nullable, g|ml|piece"
        text updated_at
    }
    CIQUAL_FOOD {
        integer alim_code PK "CIQUAL food code"
        text name "alim_nom_fr"
        text name_search "lower case, no accents"
        text group_name "alim_grp_nom_fr"
        text subgroup_name "alim_ssgrp_nom_fr"
        real kcal_100g
        real carbs_100g
        real protein_100g
        real fat_100g
        real fibre_100g "nullable"
        real sugars_100g "nullable"
        real sodium_mg_100g "nullable"
    }
    RECIPE {
        integer id PK
        text name
        text description "nullable"
        text meal_type "breakfast|lunch|snack|dinner"
        integer servings "CHECK > 0"
        text difficulty "nullable, easy|medium|hard"
        integer prep_min "nullable"
        integer cook_min "nullable"
        integer rating "nullable, 1-5, own rating"
        text notes_md "nullable"
        text photo_path "nullable, own upload"
        text updated_at
    }
    RECIPE_INGREDIENT {
        integer recipe_id PK, FK
        integer ingredient_id PK, FK
        real quantity "CHECK > 0"
        text unit
        integer position
    }
    RECIPE_STEP {
        integer id PK
        integer recipe_id FK
        integer position
        text title
        text body
    }
    RECIPE_TOOL {
        integer id PK
        integer recipe_id FK
        integer position
        text name
    }
    TAG {
        integer id PK
        text name "UNIQUE"
    }
    RECIPE_TAG {
        integer recipe_id PK, FK
        integer tag_id PK, FK
    }
    PLAN_WEEK {
        text iso_week PK "e.g. 2026-W40, Monday start"
    }
    MEAL_ENTRY {
        integer id PK
        text iso_week FK
        text date "YYYY-MM-DD"
        text slot "breakfast|lunch|snack|dinner"
        integer recipe_id FK
        real servings "planned, CHECK > 0"
        integer position
        text eaten_at "nullable, set when ticked"
        real eaten_servings "nullable, defaults to servings"
    }
    TARGETS {
        integer id PK "always 1 (single user)"
        real kcal
        real carbs_g
        real protein_g
        real fat_g
    }
    SETTINGS {
        integer id PK "always 1 (single user)"
        text locale "fr-FR|en-IE, default fr-FR"
        integer source_ciqual "0|1, default 1"
        integer source_off "0|1, default 1"
        text ai_provider "anthropic|mistral|deepseek"
        text ai_model "nullable, provider default"
        integer ai_monthly_cap_cents "nullable = no cap"
    }
    AI_USAGE {
        integer id PK
        text at "ISO timestamp"
        text provider
        text model
        integer input_tokens
        integer output_tokens
        integer cost_micro_eur "estimate frozen at call time"
    }
    SHOPPING_LIST {
        integer id PK
        text iso_week FK "UNIQUE"
        text generated_at
    }
    SHOPPING_ITEM {
        integer id PK
        integer list_id FK
        integer ingredient_id FK "nullable for manual items"
        text label
        text category
        real quantity
        text unit
        integer est_cost_cents "nullable, computed at generation"
        integer actual_cost_cents "nullable, entered at purchase"
        text purchased_at "nullable"
        text updated_at "last-write-wins for offline sync"
    }
```

## 2. Decisions reflected in the schema

| Decision | Reason |
|---|---|
| No `user` table | Single user (ADR-0002) |
| Nutrition is stored per 100 g and computed, never stored per recipe | A single source of truth. The math lives in `packages/shared` |
| The health score is **computed, not stored** | Derived from nutrition per serving (SPEC-002 §7), so it can't drift |
| `ingredient.source` | Track where the data came from; show a badge on `ai_estimate` values |
| `ingredient.image_url` + a cached `image_path` | "Photos from imports" (PRD §5.8); the local copy keeps them offline |
| Money as integer **cents**, EUR only | No floating-point money errors; the single currency is PRD §5.9 |
| The price is stored per pack (`price_cents` / `price_pack_qty`) | Matches how prices appear in stores; estimated cost = quantity ÷ pack × price, rounded up to whole packs (SPEC-005) |
| `meal_entry.eaten_at` / `eaten_servings` | Food diary: planned vs eaten (N-5, N-6) without a separate table |
| `shopping_item.est_cost_cents` is frozen at generation | Later price edits don't rewrite past weeks' estimates |
| Titled steps and tools in their own tables | They are ordered lists (the design shows numbered items); positions let you reorder them |
| `targets` is a single-row table with `CHECK (id = 1)` | The simplest way to store settings |
| `settings` is also a single-row table, stored in the DB rather than in the browser | The laptop and phone share one locale, source switches and AI choice (SPEC-008). API keys are **not** stored here; they stay in env (ADR-0010) |
| `ai_usage.cost_micro_eur` in integer millionths of a euro | One AI call often costs less than a cent. It's still integer money, and the estimate is frozen so price-table updates don't rewrite past months (SPEC-008, owner-approved) |
| `ingredient.source` has `ciqual`, not `usda` | USDA dropped; CIQUAL bundled (ADR-0011) |
| `ciqual_food` is read-only seed data, shipped in a migration | CIQUAL has no API. A local table works offline; a new CIQUAL release is a new migration (SPEC-004 §6) |
| An import copies CIQUAL values into `ingredient`, with no foreign key | CIQUAL updates don't rewrite the owner's ingredients or their edits; `external_id` keeps the `alim_code` |
| `ciqual_food.name_search` is stored lower case without accents | SQLite's `LIKE` ignores case for ASCII only, so "epeautre" must find "Épeautre" |
| Dates are ISO text; weeks are ISO (Monday start) | SQLite has no date type; ISO strings sort correctly |
| `ON DELETE RESTRICT` from recipe_ingredient to ingredient | You can't delete an ingredient that a recipe uses (the API returns 409) |
| `tag` and `recipe_tag` are **not created yet** | S1 decision (SPEC-002 §10): the meal type covers the filters; the tables arrive with a tag filter |
| `ON DELETE CASCADE` from recipe to its ingredients, steps, tools and tags | Their rows have no meaning without the recipe |
| `ON DELETE RESTRICT` from meal_entry to recipe | You can't delete a recipe that's in a plan; archive or remove it from the plan first |

## 3. Migrations

```mermaid
flowchart LR
    edit[Edit schema.ts] --> gen[npm run db:generate] --> review[Review SQL in PR] --> merge[Merge] --> boot[App boot runs pending migrations]
```

- Migrations only go forward. To roll back, write a new migration.
- CI runs every migration on an empty DB **and** on a fixture DB copied from the previous release, to catch migrations that break existing data.

## 4. Backups and restore

| What | How | Where |
|---|---|---|
| Local (from Sprint 1) | `sqlite3 data/nutrigo.db ".backup data/backups/$(date +%F).db"` via an npm script, daily, keeping 30 | Laptop + copy to a second disk or cloud folder |
| Railway (from v1.1.0) | A daily scheduled job runs `.backup`, then uploads it to object storage. Details in ADR-0004 | Off-platform |
| Restore drill | Once per release from Sprint 1 on: copy the latest backup over the DB, start the built app with Node and run the smoke e2e (no Docker needed) | Checklist in `docs/process/release.md` |

Pragmas set at connection: `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`.
