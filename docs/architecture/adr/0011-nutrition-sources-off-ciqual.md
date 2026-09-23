# ADR-0011: Nutrition sources are manual, Open Food Facts and CIQUAL (USDA dropped), each switchable in settings

- Status: Proposed (Accepted when the PR is approved)
- Date: 2026-09-23
- Deciders: Owner

## Context
PRD §5.7 planned manual entry → Open Food Facts / USDA → an AI estimate, and PRD Q3 asked which database should be primary for French products (a spike was planned for Sprint 3). The owner shops in France. USDA covers American generic foods and not French products. ANSES publishes **CIQUAL**, the French reference table of about 3,500 generic foods, as open data (Excel/XML on data.gouv / recherche.data.gouv). **CIQUAL has no search API.** It's a downloadable table.

## Decision
- **Sources:** manual entry, Open Food Facts (branded and barcoded products, live API) and **CIQUAL** (generic foods, raw ingredients). **USDA is dropped.** The AI estimate stays as the last fallback (A-2), flagged as estimated.
- **CIQUAL is bundled, not called.** A one-off script converts the official file into a `ciqual_food` table that ships in a migration (seed data). Searching it is a local `LIKE` query that works offline. Updating to a new CIQUAL release means a new migration.
- **Each source can be turned on or off in Settings** (SPEC-008); both are on by default. When both are on, their results are **merged into one list** ranked by name match (`mergeCandidates`, SPEC-008 §7). Manual entry is always available.
- `ingredient.source` becomes `manual | off | ciqual | ai_estimate`, and `external_id` holds the OFF barcode or the CIQUAL `alim_code`.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| OFF + USDA (the original plan) | Two live APIs, symmetric code | USDA doesn't know French products and uses American generic names |
| OFF only | One integration | Raw ingredients (e.g. "courgette crue") are poorly covered and quality varies |
| Call CIQUAL through a third-party API | Nothing to bundle | No official API; a third-party dependency for public data |
| Keep the Sprint 3 spike | Decide with evidence | The owner decided now; the spike is no longer needed |

## Consequences
- The Sprint 3 spike "OFF vs USDA" is cancelled.
- The seed adds roughly 3,500 rows to the image and the DB. That's small for SQLite.
- CIQUAL is published as open data. The exact licence and attribution terms are confirmed when writing the import script; plan an "Open Food Facts · CIQUAL (ANSES)" credit on the import sheet.
- **Follow-ups (not done in this ADR's PR):** SPEC-004 (`search?source=off|usda`, the upstream sequence diagram, `normaliseImport` fixtures), `data-model.md` (the `ciqual_food` table; the `source` enum is already updated), `backend.md` (`integrations/usda.ts`, routes), `overview.md`, `testing/strategy.md`, `process/workflow.md` (spike example) and `scripts/setup-github.sh` (milestone text) still say USDA. Update them when SPEC-004 is revised.
