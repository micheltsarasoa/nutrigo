The ProgressBar atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  /** Accessible name, e.g. "Carbohydrates". */
  label: string;
  value: number;
  max?: number;
  variant?: (typeof PROGRESS_BAR_VARIANTS)[number];
  thin?: boolean;
};
```

## States shown

- green · yellow · orange
- thin
- 0 %
- 100 %
- over★ (fill capped, orange, the label says by how much)

## Status

done, main. Issue #25.
