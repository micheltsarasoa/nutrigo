---
name: write-spec
description: Write a NutriGo feature spec (docs/specs/SPEC-NNN-*.md) from the PRD and the Claude Design export, then derive the GitHub issues bottom-up. Use before implementing any feature that has no Approved spec.
argument-hint: "<PRD section or feature name>"
---

# Write a spec

1. Read `docs/prd/PRD.md` (requirement IDs), `docs/roadmap.md`, `docs/architecture/*` and the relevant design in `design/source/`.
2. Copy `docs/specs/_TEMPLATE.md` to the next free `SPEC-NNN-slug.md` and fill in every section:
   - Acceptance criteria with IDs `AC-n` in Given/When/Then form. Each one must be testable by Playwright.
   - A **component inventory** table, bottom-up, marking which components already exist.
   - API table with Zod schema names; data changes, also reflected in `docs/architecture/data-model.md`.
   - Business rules as pure functions with worked examples (these become unit tests).
   - Mermaid diagrams where they help: `sequenceDiagram` for multi-call flows, `stateDiagram-v2` for UI states.
3. Put anything unclear under **Open questions** and **ask the owner**. Don't guess.
4. Add the spec to `docs/specs/README.md` with status `Draft`.
5. After the owner approves: propose the issue breakdown (epic → stories → component issues, ordered atoms → molecules → organisms → page → tasks). Create the issues only after the owner confirms.
