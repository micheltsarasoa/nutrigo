# ADR-0008: Keep the design's colour contrast for now (temporary WCAG exception)

- Status: Accepted (temporary)
- Date: 2026-09-23

## Context
The design review (docs/design-system/index.html §03) measured several WCAG 2.2 AA failures in the exported palette. White text on orange is 1.99:1, white icons on green or yellow are about 1.5:1, faint grey text is 2.54:1, and the tinted pill labels are 2.95–3.47:1. The chart palettes also fail colour-blind separation: green and yellow are ΔE 1.2 for deuteranopes. The PRD requires WCAG 2.2 AA. The owner chose to keep the design's values for now and change the token values later.

## Decision
- Components use the colours **only through tokens** (tokens.json). A later fix then changes token values and touches no component.
- CI runs axe with every rule enabled **except `color-contrast`**. That rule is disabled in a single config line that points to this ADR, and it is tracked by one `design-debt` issue ("Restore axe color-contrast after token update").
- Every other accessibility rule stays blocking: roles, labels, focus, target size and names.
- For charts, **secondary encoding is mandatory**: legends, direct labels with values, table views and texture. Identity is never shown by colour alone (dataviz.html §03).

## Consequences
- The PRD accessibility requirement has a documented exception until the token update.
- When the owner updates the tokens: re-run the contrast table and the palette validator, re-enable `color-contrast`, update the screenshot baselines, and mark this ADR Superseded.
