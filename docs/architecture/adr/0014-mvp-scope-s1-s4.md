# ADR-0014: v1.0.0 ships after S4; imports and AI move after Railway

- Status: Accepted (2026-09-28)
- Date: 2026-09-28
- Deciders: Owner
- Amends: roadmap, PRD §5.4/§5.5/§8, ADR-0004 and ADR-0007 (v1.0.0 at the end of Sprint 5), SPEC-004, SPEC-008 staging

## Context
v1.0.0 was planned for the end of S5, with the CIQUAL and Open Food Facts imports in S3 and AI assist in S5. All of these are Should requirements (N-4, C-2, A-1, A-2, A-4, A-5, C-3, C-4). A-3 is a Must, but it only matters once there's AI. Every Must outside Railway is done after S4. The owner wants a usable app sooner.

## Decision
1. **v1.0.0 ships at the end of S4.** S4 also takes the hardening and the tested backup/restore that S5 had.
2. **S3 drops the imports.** SPEC-004 US-5 and AC-9…AC-13, and SPEC-008 AC-4…AC-6 (nutrition sources), are deferred. Ingredients stay manual (SPEC-002). The specs aren't edited; this ADR overrides them.
3. **S5 = v1.1.0: production on Railway** (SPEC-007, D-1…D-4). This was S6. Railway stays "from v1.1.0", as ADR-0004 and ADR-0009 say.
4. **S6 = v1.2.0: nutrition imports and AI assist** (SPEC-004 imports, SPEC-006, SPEC-008 sources and AI sections). ADR-0010 and ADR-0011 are unchanged, only later.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Keep v1.0.0 after S5, with imports and AI | Matches the PRD's full scope | Two more weeks before v1.0.0; imports and AI are Should |
| **v1.0.0 after S4, Railway next, then imports and AI (chosen)** | Fastest usable app; data leaves the single laptop sooner (risk R1) | Nutrition is typed by hand until v1.2.0 |
| v1.0.0 after S4, imports and AI next, then Railway | The features come sooner | Data stays on one laptop two more sprints |

## Consequences
- The Settings modal shows only Display until v1.2.0.
- `bump-minor-pre-major` keeps release-please on 0.x, so the last S4 commit needs a `Release-As: 1.0.0` footer.
- The ADR-0013 question (GroceryList on the phone) is still due before S4.
