The SelectPill atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "multiple" | "size"
> & {
  /** Accessible name (the design shows no visible label). */
  label: string;
  options: readonly { value: string; text: string }[];
};
```

## States shown

- closed (hover it; press Tab to see the focus ring★)
- wraps a native select★ (click or press Space to open it)
- disabled★
- long option label (ends in …)

## Status

done, main (16 px since #125). Issue #29.
