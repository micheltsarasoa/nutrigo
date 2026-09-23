---
name: new-component
description: Create a NutriGo UI component (atom, molecule or organism) following the mandatory workflow of failing test, then minimal component with tokens only, then /playground demo with every state, then stop for owner validation. Use whenever a new React UI component is needed or requested.
argument-hint: "<level> <ComponentName> [#issue]"
---

# New component

Follow `docs/process/coding-policy.md` §2 exactly. Do not skip or reorder steps.

1. **Check prerequisites**
   - Level is `atom`, `molecule` or `organism`. Pages are not components.
   - Read the design reference: the issue, then `design/source/`, then `docs/design-system/`. If there is no design, stop and ask.
   - Every lower-level piece it uses already exists in `apps/web/src/design-system/` **and** its issue has `design-approved`. If not, list what is missing and stop.
   - Ponytail check: can a native element or an existing component do this? If so, say so and stop.
2. **Test first**: create `apps/web/src/design-system/<level>s/<Name>/<Name>.test.tsx` covering behaviour, every state, keyboard use and an axe check. Run it and show that it fails.
3. **Implement**: `<Name>.tsx` + `<Name>.module.css` + `index.ts`. Use tokens only (CSS custom properties), no fetching, props only. Make the test pass.
4. **Playground**: `<Name>.playground.tsx` exporting `{ title, level, states }` with every state from the issue (default, focus, disabled, loading, empty, error, long content). Check it at 390 px.
5. **Verify**: run lint, typecheck and tests.
6. **Hand off**: open or update the PR with label `awaiting-validation`. Tell the owner the exact URL, `/playground/<level>/<name>`, and **stop**. Do not integrate the component into anything until the owner adds `design-approved`.
7. After approval: add the Playwright screenshot baseline for the playground page in the same PR, then merge.
