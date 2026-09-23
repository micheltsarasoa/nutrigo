# ADR-0007: SemVer + Conventional Commits + release-please

- Status: Accepted
- Date: 2026-09-23

## Context
Every sprint ships a version. Versions and changelogs should never be written by hand.

## Decision
- Use Semantic Versioning, starting at `0.x` until v1.0.0 (end of Sprint 5).
- Commits and PR titles follow Conventional Commits, and a CI check enforces the PR title. PRs are squash-merged.
- **release-please** keeps an open "release PR" that bumps the version and `CHANGELOG.md`. Merging it at the end of the sprint creates the tag `vX.Y.Z` and a GitHub Release, then triggers the Docker build and deployment.
- Sprint releases are **minor** bumps. Hotfixes between sprints are **patch** bumps.

## Consequences
- The repo setting "Allow GitHub Actions to create and approve pull requests" must be enabled.
- Commit-message discipline matters, because it *is* the changelog.
