# ADR-0013: Desktop-first until v1.0.0

- Status: Accepted (2026-09-28)
- Date: 2026-09-28
- Deciders: Owner
- Amends: PRD §6 (Platform), ADR-0006 (owner reviews on the phone)

## Context
The PRD says "mobile-first PWA". But the Claude Design export is desktop-first (1600 px), and only Dashboard and Meal Plan have phone variants. Every other phone screen is derived and needs its own validation (design-system §10). So the specs for S2–S4 build each screen twice:
- SPEC-003: the 7-day grid, plus WeekStrip and the one-day view. RecipePicker is a dialog on desktop and a bottom sheet on mobile.
- SPEC-004: separate desktop and mobile layouts for Today.
- SPEC-005: GroceryTable on desktop, and GroceryList + CheckRow on mobile.

That roughly doubles the organism, playground and test work, and the owner wants the MVP sooner.

## Decision
1. **Until v1.0.0, only the desktop layout (≥ 1200 px) of a screen gets built and validated.** It follows the design export.
2. **Below 1200 px, the app works but isn't designed.** The existing AppShell tab bar stays. The content reflows to one column, with no horizontal scroll and 44 px targets. There are no mobile-only components and no mobile-only layouts.
3. **In SPEC-003, 004 and 005, mobile-only acceptance criteria and components are deferred.** Examples: SPEC-003 AC-10, WeekStrip, the RecipePicker bottom sheet, SPEC-005 AC-11, GroceryList and CheckRow. The specs aren't edited. This ADR overrides them.
4. **Existing mobile work stays.** Built components, their 390 px playground frames and their visual baselines are kept (CLAUDE.md rule 5). The visual test still runs at 390 px and 1280 px, as a no-regression net.
5. **CSS technique is unchanged.** Styles stay mobile-first `min-width` queries (frontend.md §7). The only change is which layouts are designed.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Keep mobile-first, both layouts per screen | Matches the PRD's persona (plans and shops on the phone) | About twice the UI work; the mobile screens are derived, so they need extra validation rounds |
| Mobile only | One layout; the phone is the main device | The design export is desktop; the mobile screens would all be derived |
| **Desktop only, mobile "works" (chosen)** | One layout, taken straight from the design; the fastest route to the MVP | On a phone, the app is usable but not comfortable |

## Consequences
- The owner reviews playgrounds at 1280 px on the laptop. The phone check is "nothing breaks at 390 px".
- **Open for the S4 planning:** the offline shopping list is used in the store, on a phone (PRD persona, SPEC-005 AC-6). Before S4 starts, decide whether GroceryList (mobile) comes back into scope.
- After v1.0.0, a new ADR can bring mobile layouts back screen by screen, starting from the deferred items above.
