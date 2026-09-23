# Architecture Decision Records

These use the Michael Nygard format. An ADR is **immutable once Accepted**: to change a decision, write a new ADR that supersedes it.

| # | Title | Status |
|---|---|---|
| [0000](0000-template.md) | Template | n/a |
| [0001](0001-sqlite.md) | SQLite as the only database | Accepted |
| [0002](0002-no-auth-edge-protection.md) | No in-app auth; protect at the edge | Accepted (edge mechanism open) |
| [0003](0003-ponytail-minimal-code.md) | Ponytail: minimal code, rigorous process | Accepted |
| [0004](0004-railway-deployment.md) | Local Docker until v1.0.0, then Railway with a volume | Accepted |
| [0005](0005-monorepo-single-image.md) | npm-workspaces monorepo, single Docker image | Proposed |
| [0006](0006-in-app-playground.md) | In-app `/playground` route instead of Storybook | Accepted |
| [0007](0007-release-please-semver.md) | SemVer + Conventional Commits + release-please | Accepted |
| [0008](0008-contrast-deviation.md) | Keep the design's colour contrast for now (temporary WCAG exception) | Accepted (temporary) |

```mermaid
stateDiagram-v2
    [*] --> Proposed
    Proposed --> Accepted
    Proposed --> Rejected
    Accepted --> Superseded: new ADR replaces it
    Accepted --> Deprecated
```
