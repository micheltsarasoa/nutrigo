# SPEC-001: Foundations

| | |
|---|---|
| Status | Draft |
| Sprint | S0 → v0.1.0 |
| PRD refs | G4, NFRs |
| Design | Claude Design → "Design System" page, exported to `design/source/Design System.dc.html` |

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
| AC-9 | `/playground` at 390 px | Open any atom | No horizontal scroll; every interactive atom has a ≥ 44 px target |
| AC-10 | The app shell < 1200 px / ≥ 1200 px | Resize | The bottom tab bar (5 items) switches to the sidebar |

## 4. UI: component inventory
Source: `design/source/Design System.dc.html` + `nutrigo.css`, documented in `docs/design-system/index.html`.

| Level | Component | Design class | States to show (★ = missing in design, proposed) |
|---|---|---|---|
| Tokens | colour (incl. derived), radius, space, shadow, type scale, breakpoints | `:root` + tokens.json | light only (no dark theme in the design) |
| Atom | Icon (inline SVG set, 24 grid) | inline `<svg>` | every in-scope icon |
| Atom | Logo (mark, lockup) | `.sidebar__brand` | sizes 20/26/52 |
| Atom | Button | `.btn` | primary-green, primary-orange, ghost × md/sm × default, hover, focus★, disabled★, loading★ |
| Atom | Pill | `.pill` | green/yellow/orange/grey × light/solid/outline, with icon |
| Atom | IconBadge | `.icon-badge` | 3 solid + 4 light, sizes 28/44 |
| Atom | SearchField | `.search-bar` | default, filled, sm, focus★ |
| Atom | ProgressBar | `.progress-bar` | green/yellow/orange, thin, 0 %, 100 %, over★ |
| Atom | Stepper | `.stepper` | min, max, focus★, 44 px mobile target★ |
| Atom | StarRating | `.star-rating` | 0–5, editable★ |
| Atom | MealCheck | `.meal-check` | done, todo, next |
| Atom | SelectPill | `.select-pill` | closed; wraps a native select★ |
| Atom | NavLink / TabBarItem | `.nav-link` / derived | default, hover, active |
| Atom | Card | `.card` | with header + more menu |

Not built (out of scope, design-system §12): Avatar, UserMenu, PromoBanner, notification dot, footer.

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
- [ ] `tokens.css` generated from `docs/design-system/tokens.json` (a small script; the ~16 derived colours become tokens)
- [ ] Poppins self-hosted (woff2, 5 weights) and precached, with no Google Fonts call at runtime
- [ ] axe configured with `color-contrast` disabled per ADR-0008 (+ one `design-debt` issue)
- [ ] `/playground` with `import.meta.glob` discovery
- [ ] Atoms: test → playground → approved
- [ ] CI, release and deploy workflows active and green
- [ ] Board, labels and milestones created (`scripts/setup-github.sh`)
- [ ] `CLAUDE.md` commands table filled in

## 8. Out of scope
Any domain feature, backups (S1) and the Railway deployment (S6, after v1.0.0).

## 9. Open questions
- ~~Q1: dark theme?~~ **No**: the design is light-only (resolved 2026-09-23).
- ~~Q2: icon set?~~ **Custom inline SVGs**, 24 grid, 1.9–2 px round strokes (resolved).
- ~~Q3: How will the phone reach the local app over HTTPS: Tailscale, mkcert or Cloudflare Tunnel?~~ **Tailscale** (`tailscale serve`) on the laptop and phone; AC-8 is tested from the tailnet URL (ADR-0009, resolved 2026-09-23).
- ~~Q7 (PRD): the tab bar items?~~ **Today · Recipes · Plan · Groceries · Targets**, as proposed (resolved 2026-09-23).
