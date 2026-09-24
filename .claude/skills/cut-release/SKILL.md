---
name: cut-release
description: Ship the NutriGo sprint release by checking readiness, reviewing the release-please PR, running the restore drill (from Sprint 1) and merging to tag, publish and deploy. Use at the end of each sprint or for a hotfix release.
---

# Cut a release

Follow `docs/process/release.md` §3.

1. Check that CI is green on `main` and that the sprint milestone has no open items, or that they've been moved.
2. Find the open release-please PR (`chore(main): release X.Y.Z`). Check:
   - The version is the expected minor for a sprint, or a patch for a hotfix.
   - The CHANGELOG reads well for a human. If an entry is unclear, the fix is a better commit message next time; note it for the retro.
   - CI has run on its latest commit. PRs opened by `GITHUB_TOKEN` don't trigger workflows, so run `gh pr close <n>` then `gh pr reopen <n>` and wait for the 5 checks to pass (`gh pr checks <n> --watch`). The merge is blocked until they do.
3. From Sprint 1: run the restore drill (restore the latest backup locally, then `npm run test:e2e:smoke`) and report the result.
4. Show the owner a summary (version, highlights, drill result) and **ask for confirmation** before merging.
5. After the merge, watch `release.yml`: tag, GitHub Release, GHCR image and deploy (if `RAILWAY_ENABLED`). Report the `/api/health` result.
6. Close the milestone.
