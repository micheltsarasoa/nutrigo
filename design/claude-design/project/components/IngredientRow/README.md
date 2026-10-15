The IngredientRow molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  n: number;
  // Already scaled and formatted, e.g. "200 g" or "1.5 piece".
  quantity: string;
  name: string;
};
```

## States shown

- typical
- scaled quantity with decimals
- long ingredient name

## Status

done, #138. Issue #96.
