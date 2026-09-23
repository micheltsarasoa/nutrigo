# SPEC-NNN: Title

| | |
|---|---|
| Status | Draft / Approved / Implemented in vX.Y.Z |
| Sprint | S? |
| PRD refs | e.g. P-1, P-2 |
| Epic | #issue |
| Design | Link to the Claude Design page or `design/source/...` |

## 1. Summary
Two or three sentences: what, and why now.

## 2. User stories
- **US-1** As the owner, I want … so that …

## 3. Acceptance criteria
Each criterion becomes at least one e2e test titled with its ID.

| ID | Given | When | Then |
|---|---|---|---|
| AC-1 | | | |

## 4. UI
- Screens and routes
- **Component inventory** (drives the Component issues, bottom-up):

| Level | Component | New / existing | States |
|---|---|---|---|
| Atom | | | |
| Molecule | | | |
| Organism | | | |
| Page | | | |

- Empty, loading and error states for each screen
- Flow (use a `flowchart` or `stateDiagram-v2`)

## 5. API
| Method | Path | Request (Zod) | Response | Errors |
|---|---|---|---|---|

Include a `sequenceDiagram` if more than one call or service is involved.

## 6. Data
Schema changes (update `docs/architecture/data-model.md` in the same PR), migration notes, backfill.

## 7. Business rules
Pure functions to add to `packages/shared`, with worked examples. These become unit tests.

## 8. Out of scope

## 9. Test plan
| Layer | What |
|---|---|
| Unit | |
| Integration | |
| Component | |
| E2E | AC-1… |

## 10. Open questions
