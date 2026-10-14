# Known issues

## Contrast failures kept on purpose

Measured on 2026-09-23 against WCAG 2.2 AA. On the owner's decision they stay as designed until token values change (ADR-0008). Fixing them means changing token values only, with no component changes.

| Where | Ratio | Result | Passing alternative |
|---|---|---|---|
| Orange button, solid orange pill | 1.99 | Fail | Ink text, 7.38 |
| White icon on green or yellow badge | 1.42 / 1.51 | Fail | Ink icon, 10.37 |
| Faint text (placeholders, axis, dates) | 2.54 | Fail | `color-neutral-muted`, 4.83 |
| Orange pill text | 2.95 | Fail | Darken `color-orange-on-light` to about #A8520F |
| Green or yellow pill text | 3.47 / 3.24 | Fail (small text) | Darken the `*-on-light` tokens by about 20 percent |
| Green icon on light green | 2.25 | Fail (UI needs 3:1) | `color-green-on-light` |
| Ink on any base colour | 7.4 to 10.4 | Pass | none needed |
| Muted on cream or white | 4.56 / 4.83 | Pass | none needed |

## Design debt

| # | Issue | Decision |
|---|---|---|
| D1 | Contrast failures above | Kept; token values change later (ADR-0008) |
| D2 | Inconsistent macro, slot and category colours | One canonical mapping (README) |
| D3 | About 20 font sizes, sub-12 px text on phones | 7-step scale, 12 px minimum |
| D4 | 16 raw hex values inside components | Promoted to derived tokens |
| D5 | Week starts Sunday, dashboard shows 6 days | ISO Monday start, 7 days |
| D6 | "gr" and "g" mixed | Always `g` |
| D7 | Currency shown in $ | EUR |
| D8 | No disabled, loading, focus, empty or error states | Proposed per component in the playground |
| D9 | No form or editor screens | Derived from atoms, validated in the playground |
| D10 | Selects cycle on click, week nav not keyboard-labelled | Native select, labelled buttons |
| D11 | Chart palette fails colour-blind separation | Secondary encoding mandatory (data-visualisation.md) |
