# SPEC-001: Foundations

| | |
|---|---|
| Status | Draft |
| Sprint | S0 → v0.1.0 |
| PRD refs | G4, NFRs |
| Design | Claude Design → "Design System" page (to be exported to `design/source/`) |

## 1. Summary
Set up everything the feature sprints depend on: the monorepo skeleton, CI/CD, local Docker, SQLite with migrations, the design tokens, the `/playground` route and the first approved atoms. No user-facing feature ships in v0.1.0.

## 2. User stories
- **US-1** As the owner, I can run `docker compose up` and open the app on my phone on the local network.
- **US-2** As the owner, I can open `/playground` and review every atom in every state.
- **US-3** As the developer, every PR is checked automatically and each sprint produces a tagged release.

## 3. Acceptance criteria
| ID | Given | When | Then |
|---|---|---|---|
| AC-1 | A fresh clone | `npm ci && npm test` | All tests pass |
| AC-2 | A fresh clone | `docker compose up --build` | `GET /health` returns `200 {"status":"ok","db":"ok"}` and `/` serves the PWA shell |
| AC-3 | The dev server | Open `/playground` | The index lists every atom grouped by level; each page shows all states |
| AC-4 | A production build | Open `/playground` | 404 (the playground is excluded) |
| AC-5 | A PR with a failing test | CI runs | The PR can't be merged |
| AC-6 | A PR titled `update stuff` | CI runs | The PR title check fails |
| AC-7 | The release PR is merged | release.yml runs | Tag `v0.1.0`, a GitHub Release and an image on GHCR exist |
| AC-8 | The app shell on a phone | "Add to Home screen" | Installs as a PWA with the NutriGo name and icon |

## 4. UI: component inventory
**Blocked on the design-system export.** The atoms are taken from the Claude Design "Design System" page. The expected candidates are:

| Level | Component | States |
|---|---|---|
| Tokens | colour, type scale, spacing, radius, elevation, motion | light (+ dark if designed) |
| Atom | Button | primary, secondary, ghost, icon-only · default, focus, disabled, loading |
| Atom | TextInput, NumberInput | empty, filled, focus, error, disabled |
| Atom | Icon | set from the design |
| Atom | Chip/Tag | default, selected, removable |
| Atom | Checkbox | unchecked, checked, disabled |
| Atom | ProgressBar | 0 %, partial, 100 %, over target |

Confirm or replace this list once the design is in the repo.

## 5. API
| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{status:"ok", db:"ok", version:"0.1.0"}` |

## 6. Data
The initial migration creates only a `meta` table (schema version). Domain tables arrive with their feature spec.

## 7. Deliverables checklist
- [ ] npm workspaces `apps/web`, `apps/api`, `packages/shared`; TS strict; ESLint (with import boundaries), Prettier, Stylelint (tokens only)
- [ ] Vitest in all three; Playwright in web
- [ ] `Dockerfile` (multi-stage) + `docker-compose.yml` with the `./data` volume
- [ ] `tokens.css` generated from the design export
- [ ] `/playground` with `import.meta.glob` discovery
- [ ] Atoms: test → playground → approved
- [ ] CI, release and deploy workflows active and green
- [ ] Board, labels and milestones created (`scripts/setup-github.sh`)
- [ ] `CLAUDE.md` commands table filled in

## 8. Out of scope
Any domain feature, Railway deployment (S4) and backups (S4).

## 9. Open questions
- Q1: Does the design system define a dark theme?
- Q2: Which icon set does the design use (custom SVGs or a library)?
