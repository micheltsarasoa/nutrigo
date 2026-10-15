Drawn from docs/design-system/index.html §06: 24 grid, round strokes, stroke width per icon as designed. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  name: IconName;
  size?: "xs" | "sm" | "md" | "lg";
  /** Give a label only when the icon carries meaning on its own; otherwise it's decorative. */
  label?: string;
};
```

## States shown

- sizes: xs 12 · sm 16 · md 18 · lg 20 (proposed tokens)
- colour follows the text (currentColor)
- inline with text (decorative) and labelled (screen readers say “Health score”)

## Status

done, main; #131 adds prep and cook. Issue #19, #130.
