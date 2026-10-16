# ADR-0016: The mobile grocery list ships in S4

- Status: Accepted (2026-10-16)
- Date: 2026-10-16
- Deciders: Owner
- Amends: ADR-0013 (point 3, SPEC-005 only)

## Context
ADR-0013 deferred the mobile-only parts of SPEC-005 (AC-11, GroceryList, CheckRow). ADR-0014 left the question open until S4. The list is used at the store, on the phone, and offline.

## Decision
1. S4 builds the 390 px list: AC-11, GroceryList and CheckRow, after the desktop list.
2. The rest of ADR-0013 stands for every other screen.

## Consequences
- S4 is larger. If it slips, cut in this order: Insights charts, then the mobile list.
- The mobile list is derived from the desktop design (design-system §10) and needs its own sketch validation.
