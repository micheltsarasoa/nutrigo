Derived (SPEC-008 §4): a round, icon-only ghost button with Button's focus ring. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  /** Accessible name: the button shows no text. */
  label: string;
};
```

## States shown

- default (hover it, or Tab for the focus ring★)
- active: its dialog is open
- disabled

## Status

done, #124. Issue #92.
