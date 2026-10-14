The two-bowl mark from design/source (.sidebar__brand), on its own 26 grid. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  size?: "sm" | "md" | "lg";
  /** Adds the "NutriGo" wordmark next to the mark (the sidebar lockup). */
  wordmark?: boolean;
};
```

## States shown

- mark: sm 20 · md 26 · lg 52 (screen readers say “NutriGo”)
- lockup: mark + wordmark (the sidebar uses md)
- on the green-light background (PWA icons)
- wordmark follows the text colour (on ink)

## Status

done, main. Issue #20.
