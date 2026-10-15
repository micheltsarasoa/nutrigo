The Pill atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  variant: (typeof PILL_VARIANTS)[number];
  icon?: IconName;
  children: ReactNode;
};
```

## States shown

- light: green · yellow · orange · grey
- solid: green · yellow · orange (meal slots)
- outline
- with an icon

## Status

done, main. Issue #22.
