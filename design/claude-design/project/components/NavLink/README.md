The NavLink atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  icon: IconName;
  variant?: (typeof NAV_LINK_VARIANTS)[number];
  /** The current page: sets aria-current="page", which the styles key on. */
  active?: boolean;
};
```

## States shown

- sidebar: default · active (hover them; press Tab to see the focus ring★)
- tab bar: default · active (hover★ them; 44 px touch targets)
- long label (ends in …)

## Status

done, main. Issue #30.
