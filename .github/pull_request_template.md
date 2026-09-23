<!-- Title must be a Conventional Commit: feat: …, fix: …, docs: …, refactor: …, test: …, chore: …, ci: … -->

## What & why

Closes #

## Type
- [ ] Feature (story) · [ ] Component (atom / molecule / organism) · [ ] Fix · [ ] Refactor (no behaviour change) · [ ] Docs / CI / chore

## Spec / design
- Spec: `docs/specs/SPEC-…` (AC covered: …)
- Playground: `/playground/<level>/<name>` (UI only)

## Checklist (Definition of Done)
- [ ] Tests written **first** and passing locally; coverage not lower
- [ ] UI: every state shown in the playground, tokens only, axe clean, `design-approved` label from the owner
- [ ] `/ponytail-review` run; no speculative code, no new dependency without an ADR
- [ ] Docs updated (spec status, data-model, ADR, CLAUDE.md commands)
- [ ] No secrets, no logging library, no auth code
