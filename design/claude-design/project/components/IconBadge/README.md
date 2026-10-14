The IconBadge atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  variant: (typeof ICON_BADGE_VARIANTS)[number];
  icon: IconName;
  size?: "sm" | "lg";
};
```

## States shown

- solid, sm 28 px (headline KPIs)
- light, sm 28 px (inside cards)
- lg 44 px
- next to its text (decorative, the text is read)

## Status

done, main. Issue #23.
