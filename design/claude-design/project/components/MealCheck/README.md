The MealCheck atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Names the checkbox: "Mark <meal> as eaten". */
  meal: string;
  /** Outlines an unchecked box in orange. Display only: a checked box is done either way. */
  next?: boolean;
};
```

## States shown

- done · todo · next (tap to toggle; press Tab to see the focus ring★)
- next, once checked, is done
- disabled★

## Status

done, main. Issue #28.
