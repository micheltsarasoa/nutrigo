The Card atom. An atom in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  /** Shown as a real heading; the card becomes a section named by it. */
  title?: string;
  /** Keeps the page outline right. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Shows the "•••" button. The menu it opens belongs to the caller. */
  onMore?: () => void;
  children: ReactNode;
};
```

## States shown

- with header + more menu (press Tab to see the focus ring★)
- with header, no more menu, heading level 3
- without header
- more menu without a title
- 320 px, long title and long content (wraps, no sideways scroll)
- 1280 px (shrinks to the screen when narrower)

## Status

done, main. Issue #31.
