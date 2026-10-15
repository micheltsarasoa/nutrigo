Derived (SPEC-002 §4, SPEC-008 §4): a form select with a visible label, matching Field. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "children" | "multiple"
> & {
  label: string;
  options: readonly { value: string; text: string }[];
  /** A first, unpickable option such as "Choose…" (pair it with defaultValue=""). */
  placeholder?: string;
  error?: string;
};
```

## States shown

- default with a placeholder, and selected (Tab for the focus ring★)
- error and disabled
- long option text ends in …

## Status

done, #117. Issue #89.
