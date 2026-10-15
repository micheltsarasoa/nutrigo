The MacroTile molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  macro: (typeof MACROS)[number];
  label: string;
  // Already formatted for the locale by the page.
  value: string;
};
```

## States shown

- the four macros (typical values)
- zero
- large numbers

## Status

done, #129. Issue #95.
