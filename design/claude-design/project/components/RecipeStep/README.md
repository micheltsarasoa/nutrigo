The RecipeStep molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  n: number;
  title: string;
  body: string;
};
```

## States shown

- three steps (rail between, none after the last)
- long title and long body
- single step
- title only (empty body)

## Status

done, #137. Issue #97.
