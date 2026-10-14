The RecipeDetail organism. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  // null: not found, unless loading.
  recipe: RecipeDetailData | null;
  loading?: boolean;
  servings: number;
  onServingsChange: (servings: number) => void;
  onBack: () => void;
};
```

## States shown

- quantity
- name
- full recipe (2 columns from 900 px; change the servings: ingredients scale, nutrition per serving doesn't; press Tab for the focus ring★)
- servings changed (3 of 2)
- loading
- not found
- 1280 px (on a phone, scroll this frame sideways)

## Status

done, #146. Issue #104.
