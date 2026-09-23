# Data model (SQLite)

This draft covers v1. The source of truth is `apps/api/src/db/schema.ts`, and this document must be updated in the same PR as any schema change.

## 1. Entity-relationship diagram

```mermaid
erDiagram
    INGREDIENT ||--o{ RECIPE_INGREDIENT : "used in"
    RECIPE ||--|{ RECIPE_INGREDIENT : contains
    RECIPE ||--o{ RECIPE_TAG : "tagged"
    TAG ||--o{ RECIPE_TAG : ""
    RECIPE ||--o{ MEAL_ENTRY : "planned as"
    MEAL_ENTRY }o--|| PLAN_WEEK : "belongs to"
    PLAN_WEEK ||--o| SHOPPING_LIST : "generates"
    SHOPPING_LIST ||--|{ SHOPPING_ITEM : contains
    INGREDIENT ||--o{ SHOPPING_ITEM : "refers to"

    INGREDIENT {
        integer id PK
        text name "UNIQUE"
        text source "manual|off|usda|ai_estimate"
        text external_id "nullable, OFF/USDA id"
        real kcal_100g
        real protein_100g
        real carbs_100g
        real fat_100g
        real fibre_100g
        text default_unit "g|ml|piece"
        real grams_per_unit "nullable, for piece/ml"
        text category "for aisle grouping"
        text updated_at
    }
    RECIPE {
        integer id PK
        text name
        integer servings "CHECK > 0"
        text steps_md
        text photo_path "nullable"
        text updated_at
    }
    RECIPE_INGREDIENT {
        integer recipe_id PK, FK
        integer ingredient_id PK, FK
        real quantity "CHECK > 0"
        text unit
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
        text iso_week PK "e.g. 2026-W40"
    }
    MEAL_ENTRY {
        integer id PK
        text iso_week FK
        text date "YYYY-MM-DD"
        text slot "breakfast|lunch|dinner|snack"
        integer recipe_id FK
        real servings "CHECK > 0"
        integer position
    }
    TARGETS {
        integer id PK "always 1 (single user)"
        real kcal
        real protein_g
        real carbs_g
        real fat_g
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
        real quantity
        text unit
        integer checked "0|1"
        text updated_at "last-write-wins for offline sync"
    }
```

## 2. Decisions reflected in the schema

| Decision | Reason |
|---|---|
| No `user` table | Single user (ADR-0002) |
| Nutrition is stored per 100 g and computed, never stored per recipe | A single source of truth. The math lives in `packages/shared` |
| `ingredient.source` | Track where the data came from; show a badge on `ai_estimate` values |
| `targets` is a single-row table with `CHECK (id = 1)` | The simplest way to store settings |
| Dates are ISO text | SQLite has no date type; ISO strings sort correctly |
| `ON DELETE RESTRICT` from recipe_ingredient to ingredient | You can't delete an ingredient that a recipe uses (the API returns 409) |
| `ON DELETE CASCADE` from recipe to recipe_ingredient and recipe_tag | Their rows have no meaning without the recipe |

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
| Local | `sqlite3 data/nutrigo.db ".backup data/backups/$(date +%F).db"` via an npm script | Laptop |
| Railway | A daily scheduled job runs `.backup`, then uploads it to object storage. Details in ADR-0004 | Off-platform |
| Restore drill | Once per release from Sprint 4 on: restore the latest backup into a local container and run the smoke e2e | Checklist in `docs/process/release.md` |

Pragmas set at connection: `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`.
