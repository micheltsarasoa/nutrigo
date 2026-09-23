# CLAUDE.md

Guidance for Claude (and any other agent) working in this repository. Read this first, every session.

## What NutriGo is

A personal, single-user, mobile-first PWA to plan weekly meals, manage recipes & ingredients, track nutrition, and generate shopping lists. Full product context: [`docs/prd/PRD.md`](docs/prd/PRD.md).

## Stack (see [`docs/architecture/overview.md`](docs/architecture/overview.md))

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite, PWA (`vite-plugin-pwa`), mobile-first |
| Backend | Node (LTS) + Hono, TypeScript |
| Database | SQLite via `better-sqlite3` + Drizzle ORM / drizzle-kit migrations |
| Contract | Zod schemas in `packages/shared`, used by both web and api |
| Tests | Vitest, Testing Library, Playwright, axe-core |
| Deploy | Docker → local compose up to v1.0.0; Railway (SQLite on a volume) from v1.1.0 |
| Auth | **None**, single user. Protection is at the edge (see ADR-0002) |

Repository layout (npm workspaces):

```
apps/web        React PWA (includes the /playground route)
apps/api        Hono API + SQLite + migrations
packages/shared Zod schemas, types, pure domain functions (nutrition math)
docs/           PRD, specs, architecture, ADRs, process, design system
design/source/  Raw exports from Claude Design (read-only source of truth)
```

## Commands

> The app is not scaffolded yet (Sprint 0). Keep this table up to date when it is.

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev (web + api) | `npm run dev` |
| Lint / format | `npm run lint` / `npm run format` |
| Typecheck | `npm run typecheck` |
| Unit + component tests | `npm test` |
| E2E | `npm run test:e2e` |
| DB migration | `npm run db:generate` then `npm run db:migrate` |
| Local prod-like run | `docker compose up --build` |

Before saying a task is done, run lint, typecheck and tests. Say so if any of them fail.

## Non-negotiable rules

1. **Ponytail mode is on** (plugin `ponytail@ponytail`). Write the least code that works: platform built-ins first, then stdlib, then already-installed deps, and a new dependency only with an ADR. Run `/ponytail-review` on your diff before opening a PR.
2. **Process stays rigorous even though the code stays lean.** Every change needs an issue, a spec (for features), tests, and a PR that meets the Definition of Done.
3. **Atomic design, bottom-up**: atoms → molecules → organisms → pages. Never build a level before the pieces below it exist and are approved. See [`docs/process/coding-policy.md`](docs/process/coding-policy.md).
4. **Test first**. Write the failing test, then the code. No PR without tests for the code it adds or changes.
5. **Playground before product**. Every new UI component is shown at `/playground/<level>/<name>` with all its states. The owner validates it (label `design-approved`) **before** it's used in a page.
6. **Design tokens only**. No raw colors, sizes or font values in components. Use the CSS custom properties from the design system. `design/source/` is read-only.
7. **No auth code**: no login, sessions or user tables. Single user by design (ADR-0002).
8. **No logging libraries**. Errors go to stderr only on the API; the web app shows user-facing error states.
9. **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`). PR titles follow the same format because PRs are squash-merged. Versions and the changelog come from them (release-please).
10. **Never** skip, disable or `.only` a test to get green. Never commit secrets. `ANTHROPIC_API_KEY` and `RAILWAY_TOKEN` live in env / GitHub secrets.
11. Mermaid for every diagram in docs. Pick the right diagram type (see [`docs/README.md`](docs/README.md#diagram-conventions)).

## Workflow for a task

1. Pick an issue in **Ready** on the board. It must meet the Definition of Ready.
2. Branch `feat/<issue#>-short-name` (or `fix/`, `docs/`, …).
3. Feature? Check that a spec exists in `docs/specs/`. If not, use `/write-spec` first.
4. UI component? Use `/new-component`: test → playground → owner validation → implementation.
5. Open a PR using the template. Link it with `Closes #n`. CI must be green.
6. Squash-merge. At the end of the sprint, `/cut-release` merges the release-please PR.

## Project skills (`.claude/skills/`)

| Skill | Use it when |
|---|---|
| `/new-component` | Creating any atom, molecule, organism |
| `/write-spec` | Starting a feature with no spec yet |
| `/sprint-plan` | Planning or closing a sprint |
| `/cut-release` | Shipping the sprint's version |
| `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt` | Keeping the code minimal (plugin) |

## Where things are documented

- Product: `docs/prd/PRD.md`, `docs/roadmap.md`
- Feature specs: `docs/specs/SPEC-xxx-*.md`
- Architecture: `docs/architecture/*`, decisions in `docs/architecture/adr/`
- Process: `docs/process/*` (coding policy, workflow, release)
- Testing: `docs/testing/strategy.md`
- Design system: `docs/design-system/` (HTML, generated from the Claude Design export)

If a decision changes, write a new ADR. Don't silently edit old ones.
