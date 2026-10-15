# ADR-0015: No GitHub Actions, and design validated on sketches

- Status: Accepted (2026-10-15)
- Date: 2026-10-15
- Deciders: Owner
- Amends: CLAUDE.md rules 3, 5 and 9, `workflow.md` §2 and §4, `coding-policy.md` §2, `release.md`

## Context
Two parts of the process cost more than they return for a single-user project:
- The GitHub Actions workflows (CI, release-please, deploy) and dependabot add YAML to maintain, and their checks gate every PR.
- The owner validates a component in `/playground` after it is built (label `design-approved`). A rejected design means rework on finished code.

## Decision
1. **No GitHub Actions workflows for now.** `ci.yml`, `deploy.yml`, `release.yml` and `dependabot.yml` are removed. The gates (lint, typecheck, unit and component tests, e2e when the UI changed) run locally and must pass before a PR is merged.
2. **release-please and `/cut-release` are paused.** Versions and the changelog are written by hand when a release is cut. Deploy (S5) is planned again when it is needed.
3. **The design is validated before it is built.** The owner makes the sketch in a Claude Design artifact and validates it. Only then is the component implemented, test first. There is no `design-approved` or `awaiting-validation` label and no owner review in `/playground`.
4. **The playground stays.** Every component still has its `/playground/<level>/<name>` page with all its states, for tests, axe and visual baselines. It is a demo, not a gate. Nothing in it is deleted (CLAUDE.md rule 5).
5. "Approved" in the atomic-design rule means the sketch is validated. A component with no sketch is not built; ask the owner for one.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Keep CI, drop only deploy and release | PRs keep their automatic checks | Still YAML to maintain; the owner asked for none |
| **No workflows (chosen)** | No YAML; fewer moving parts | Nothing stops a red `main`: the discipline is local |
| Keep the playground gate | Owner sees the real component | Rework when a built design is rejected |

## Consequences
- Open release-please PR #172 and the open dependabot PRs are stale; they are left alone.
- Branch protection on `main` that requires the CI checks must be turned off in the repo settings, or PRs cannot merge.
- Coverage and visual baselines are checked by hand (`npm test -- --coverage`, `npm run test:e2e`).
- Bring workflows back with a new ADR, starting with `ci.yml`.
