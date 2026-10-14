The MenuListItem molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  href: string;
  // Usually a PhotoOrPlaceholder.
  media: ReactNode;
  title: string;
  mealType: keyof typeof MEAL_PILL;
  mealLabel: string;
  kcal: number;
  totalTime: string | null;
  healthScore: number;
  rating: number | null;
  variant: "list" | "grid";
};
```

## States shown

- list variant (hover it; press Tab to see the focus ring★)
- grid variant
- without photo (placeholder in the slot)
- long title (2 lines, then ellipsis)
- no rating, no total time (–)

## Status

done, #140. Issue #93.
