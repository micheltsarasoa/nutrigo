# ADR-0006: In-app `/playground` route instead of Storybook

- Status: Accepted
- Date: 2026-09-23

## Context
Coding policy: every component is demonstrated and **validated by the owner before implementation**. The owner reviews on a phone.

## Decision
Use a `/playground` route inside the web app, auto-discovering `*.playground.tsx` files with `import.meta.glob`. It's enabled in dev and preview builds (`VITE_PLAYGROUND=true`) and excluded from production.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Storybook | Ecosystem, addons, visual testing | A heavy dependency and a second build |
| Ladle | Lighter | Still a separate tool |

## Consequences
- Visual regression is done with Playwright screenshots of the playground pages (see the testing strategy).
- The owner validates on the local dev server or, once deployed, on a preview. This can be revisited later if previews become painful.
