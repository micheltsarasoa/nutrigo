The Button atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary-green" | "primary-orange" | "ghost";
  size?: "md" | "sm";
  /** Full width. */
  block?: boolean;
  icon?: IconName;
  /** Busy: ignores clicks but keeps focus, unlike `disabled`. */
  loading?: boolean;
};
```

## States shown

- variants, md 40 px (hover them; press Tab to see the focus ring★)
- sm 32 px (44 px touch target)
- with an icon
- disabled★
- loading★ (still focusable, clicks ignored)
- block and a long label (ends in …)

## Status

done, main (44 px md hit area since #157). Issue #21, #156.
