The NutritionRow molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  label: string;
  value: string | null;
  // Makes it the head row (Calories), with this caption above the value.
  caption?: string;
};
```

## States shown

- head row and every nutrient
- missing optional nutrient
- large numbers

## Status

done, #132, #134. Issue #100.
