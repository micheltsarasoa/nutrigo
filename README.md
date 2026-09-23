# NutriGo

A personal, mobile-first PWA to plan weekly meals, manage recipes, track nutrition and build shopping lists.

> Status: **Sprint 0: foundations**. No application code yet. See the [roadmap](docs/roadmap.md).

## Documentation

| Doc | What's in it |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Rules for agents working on this repo |
| [PRD](docs/prd/PRD.md) | Vision, goals, scope, requirements |
| [Roadmap](docs/roadmap.md) | Sprints and releases |
| [Specs](docs/specs/) | One spec per feature |
| [Architecture](docs/architecture/overview.md) | System, frontend, backend, data model, ADRs |
| [Coding policy](docs/process/coding-policy.md) | Atomic design, test-first, playground validation |
| [Workflow](docs/process/workflow.md) | Sprints, board, Definition of Ready and Definition of Done |
| [Release](docs/process/release.md) | Versioning, changelog, deployment |
| [Testing](docs/testing/strategy.md) | Test pyramid, tools, CI gates |
| [Design system](docs/design-system/) | Tokens, components, data-visualisation rules |

## First-time setup

```bash
# GitHub board, labels and milestones (needs gh CLI with the 'project' scope)
gh auth refresh -s project
./scripts/setup-github.sh
```
