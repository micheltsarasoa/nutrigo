The SearchField atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  /** Accessible name, also the default placeholder (the design shows no visible label). */
  label: string;
  size?: "md" | "sm";
  filled?: boolean;
};
```

## States shown

- default, md 42 px (click it or press Tab to see the focus ring★)
- with text typed
- filled, sm 36 px (inside cards)
- long text stays inside the field

## Status

done, main (16 px since #125). Issue #24.
