Derived (SPEC-008 §4): label and help on the left, the control on the right; they stack when the row is too narrow. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  label: string;
  help?: string;
  error?: string;
  // Spread these props onto the control so the label, help and error reach it.
  children: (control: ControlProps) => ReactNode;
};
```

## States shown

- with help text
- without help text
- error
- long label and help text

## Status

done, #141. Issue #102.
