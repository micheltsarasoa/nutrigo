# ADR-0003: Ponytail: minimal code, rigorous process

- Status: Accepted
- Date: 2026-09-23

## Context
The owner wants industry-grade process (specs, tests, CI, releases) on a personal app. Process overhead is fine, but code overhead is not: every line has to be maintained by one person.

## Decision
Enable the **ponytail** Claude Code plugin (`DietrichGebert/ponytail`) for the whole project through `.claude/settings.json`. Its ladder (does it need to exist → reuse → stdlib → platform feature → installed dependency → new code) applies to **code**. The documentation, testing and review process in `docs/process/` applies to **how** code gets in. Where the two seem to conflict, process wins on *whether* something is tested or documented, and Ponytail wins on *how much* code is written.

Adding a new runtime dependency requires an ADR (a short one is fine).

## Consequences
- Use `/ponytail-review` on every PR and `/ponytail-audit` or `/ponytail-debt` at each sprint retro.
- Some "standard" libraries (a state manager, a UI kit, a date library) are deliberately left out until there's a real need.
