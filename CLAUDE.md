# CLAUDE.md

Guidance for Claude (and any other agent) working in this repository. Read this first, every session.

## What NutriGo is

A personal, single-user PWA to plan weekly meals, manage recipes & ingredients, track nutrition, and generate shopping lists. It's **desktop-first until v1.0.0** (ADR-0013). Product: [`docs/prd/PRD.md`](docs/prd/PRD.md), plan: [`docs/roadmap.md`](docs/roadmap.md).

## Stack (see [`docs/architecture/overview.md`](docs/architecture/overview.md))

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite, PWA (`vite-plugin-pwa`) |
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
docs/           PRD, specs (docs/specs), architecture + ADRs, process, testing, design system
design/source/  Raw exports from Claude Design (read-only source of truth)
```

## Commands

Keep this table up to date. The API runs its TypeScript directly on Node 24 (type stripping), so it has no build step.

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev (web + api) | `npm run dev` |
| Lint / format | `npm run lint` / `npm run format` |
| Typecheck | `npm run typecheck` |
| Unit + component tests | `npm test` (coverage: `npm test -- --coverage`) |
| E2E | `npm run build` then `npm run test:e2e` (first time: `npx -w @nutrigo/web playwright install chromium`) |
| DB migration | `npm run db:generate` then `npm run db:migrate` (the API also migrates at boot) |
| DB backup | `npm run db:backup` writes `data/backups/YYYY-MM-DD.db` and keeps the latest 30 |
| Restore drill (smoke e2e) | `npm run build` then `npm run test:e2e:smoke`, on a restored backup via `E2E_DATABASE_PATH` (steps in [release.md](docs/process/release.md)) |
| Local prod-like run | `docker compose up --build`, then http://localhost:3000 (data in `./data`) |
| Open it on the phone | `tailscale serve --bg 3000`, then `https://<laptop>.<tailnet>.ts.net` ([guide](docs/guides/phone-access.md)); stop with `tailscale serve reset` |

Before saying a task is done, run lint, typecheck and tests. Say so if any of them fail.

## Non-negotiable rules

1. **Ponytail mode is on** (plugin `ponytail@ponytail`). Write the least code that works: platform built-ins first, then stdlib, then already-installed deps, and a new dependency only with an ADR. Run `/ponytail-review` on your diff before opening a PR.
2. **Process stays rigorous even though the code stays lean.** Every change needs an issue, a spec (for features), tests, and a PR that meets the Definition of Done ([`workflow.md`](docs/process/workflow.md)).
3. **Atomic design, bottom-up**: atoms → molecules → organisms → pages. Never build a level before the pieces below it exist and are approved. See [`docs/process/coding-policy.md`](docs/process/coding-policy.md).
4. **Test first**. Write the failing test, then the code. No PR without tests for the code it adds or changes ([`docs/testing/strategy.md`](docs/testing/strategy.md)).
5. **Playground before product**. Every new UI component is shown at `/playground/<level>/<name>` with all its states. The owner validates it (label `design-approved`) **before** it's used in a page.
   **Never delete a playground element** unless the owner asks. Push each component to GitHub (branch + draft PR) as soon as its first file exists, and keep [`docs/design-system/components-status.md`](docs/design-system/components-status.md) up to date in the same commit. Read that list before building any component; never rebuild one that exists on `main` or a branch.
6. **Design tokens only**. No raw colors, sizes or font values in components. Use the CSS custom properties generated from `docs/design-system/tokens.json`. `design/source/` is read-only (the Claude Design export), and its `support.js`/`image-slot.js` are never imported. Semantic colours: kcal green · carbs yellow · protein orange · fat grey. Weeks start Monday; money is EUR in integer cents; units are written `g`.
7. **No auth code**: no login, sessions or user tables. Single user by design (ADR-0002).
8. **No logging libraries**. Errors go to stderr only on the API; the web app shows user-facing error states.
9. **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`). PR titles follow the same format because PRs are squash-merged. Versions and the changelog come from them (release-please). **Keep them short.** A commit body is empty or 1–3 lines. A PR body fills the short template and nothing more: no feature tour, no restating the diff.
10. **Never** skip, disable or `.only` a test to get green. Never commit secrets. The AI keys (`ANTHROPIC_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`; ADR-0010) and `RAILWAY_TOKEN` live in env / GitHub secrets, never in the DB or settings.
11. Mermaid for every diagram in docs. Pick the right diagram type (see [`docs/README.md`](docs/README.md#diagram-conventions)).
12. **No AI attribution.** Commits get no `Co-Authored-By: Claude …` trailer, and PRs, issues and comments get no "🤖 Generated with Claude Code" footer. Don't write either line into prompts or instructions for other agents either.
13. **Desktop-first until v1.0.0 (ADR-0013).** Build and validate only the ≥ 1200 px layout. Below that, the app must not break, but it gets no mobile-only layouts or components. This overrides the mobile-only ACs and components in SPEC-003/004/005.
14. If a decision changes, write a new ADR. Don't silently edit old ones.

## Workflow for a task

1. Pick an issue in **Ready** on the board. It must meet the Definition of Ready.
2. Branch `feat/<issue#>-short-name` (or `fix/`, `docs/`, …).
3. Feature? Check that a spec exists in `docs/specs/`. If not, use `/write-spec` first.
4. UI component? Use `/new-component`: test → playground → owner validation → implementation.
5. Open a PR using the template. Link it with `Closes #n`. CI must be green.
6. Squash-merge. At the end of the sprint, `/cut-release` merges the release-please PR.

Skills in `.claude/skills/`: `/new-component` (any atom, molecule, organism), `/write-spec` (feature with no spec), `/sprint-plan` (plan or close a sprint), `/cut-release` (ship the sprint's version). From the plugin: `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`.

## Token budget

- **Read only what the task needs**: its issue, its spec, the files it touches. Use grep to find the section you need in a large file.
- **Never read these whole:** `docs/design-system/index.html` (55 kB), `docs/design-system/dataviz.html`, and the `design/source/*.dc.html` exports. Grep them for the component or rule you need. Never read `design/source/support.js` or `image-slot.js`.
- **One session per issue.** Hand work off through the issue or PR, not the chat.
- **Models:** plan, spec and debug with Opus; implement with Sonnet.
- **Subagents:** only for wide searches (Explore on Haiku) or for independent, mechanical tasks with a precise brief (a visual baseline, status rows). A subagent starts cold, so never use one for work you can finish in a few tool calls.

## Reply formats

Lead with what the owner has to do or decide. Stay short and skip preambles.

| Reply | Format |
|---|---|
| Plan | ≤ 10 numbered steps, the files touched, the risks, the open questions |
| Explanation | The answer in the first line, then at most 5 lines or a small table |
| End of task | Done (1–3 lines) · lint / typecheck / tests ✅/❌ · the PR link · the next action |
| End of sprint | Shipped · carried over · tech debt found · the next sprint's goal |
