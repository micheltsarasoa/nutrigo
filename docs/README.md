# Documentation index

```
docs/
├── prd/PRD.md                 Product requirements (the "why" and "what")
├── roadmap.md                 Sprints, releases, milestones
├── specs/                     One spec per feature (the "how", testable)
├── architecture/
│   ├── overview.md            C4 context + containers, deployment
│   ├── frontend.md            React PWA structure, atomic design, playground
│   ├── backend.md             Hono API, endpoints, error model
│   ├── data-model.md          SQLite schema (ER diagram), migrations, backups
│   └── adr/                   Architecture Decision Records
├── process/
│   ├── coding-policy.md       How code is written
│   ├── workflow.md            Agile workflow, board, Definition of Ready and Definition of Done
│   └── release.md             SemVer, release-please, deployment, rollback
├── testing/strategy.md        What is tested, how, and CI gates
└── design-system/             HTML design system + data-visualisation rules
```

## Document lifecycle

| Doc type | Owner | Changes when | How |
|---|---|---|---|
| PRD | Owner | Scope or goals change | PR, bump the "Revision" table |
| Spec | Author of the feature | Before implementation, then frozen at release | PR; status `Draft → Approved → Implemented` |
| ADR | Whoever makes the decision | Never edited once `Accepted`; superseded by a new ADR | New file `NNNN-title.md` |
| Process docs | Owner | Retro action items | PR |

## Diagram conventions

All diagrams are Mermaid, embedded in Markdown so GitHub renders them. Use the type that fits the question:

| Question | Mermaid type |
|---|---|
| What talks to what (system, containers) | `C4Context`, `C4Container` or `flowchart` |
| In what order do calls happen | `sequenceDiagram` |
| How is data stored | `erDiagram` |
| What states can a thing be in | `stateDiagram-v2` |
| How do branches and releases flow | `gitGraph` |
| When will it happen | `gantt`, `timeline` |
| How does work move on the board | `kanban` or `flowchart LR` |
| What does the user go through | `journey` |
| How do types relate (shared package) | `classDiagram` |

Rules: one diagram answers one question. Put a sentence above it that says what to look at. Keep it under ~15 nodes, and split it if it grows.
