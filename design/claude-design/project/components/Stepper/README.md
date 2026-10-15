The Stepper atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  /** Names the spinbutton ("Servings") and its buttons ("Decrease Servings"). */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
};
```

## States shown

- default, 1 to 10 (hover the buttons)
- at min: − disabled
- at max: + disabled
- focus★: press Tab to reach the value, then ArrowUp/ArrowDown, Home/End
- 44 px touch target★ around each 26 px button (invisible)
- long value: step 50 g, up to 1000

## Status

done, main. Issue #26.
