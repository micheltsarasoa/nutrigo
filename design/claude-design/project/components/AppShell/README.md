The AppShell organism. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  items: readonly NavItem[];
  /** The current path; the item whose href starts it (at a "/") is marked as the page. */
  current: string;
  layout: (typeof APP_SHELL_LAYOUTS)[number];
  /** The navigation landmark's name. */
  label?: string;
  /** Shows the settings IconButton; called when it is pressed. Without it, no button. */
  onSettings?: () => void;
  /** The settings dialog is open: the button gets aria-expanded="true". */
  settingsOpen?: boolean;
  /** The page. Each page renders its own <main>, so the shell never nests one. */
  children: ReactNode;
};
```

## States shown

- tab bar, < 1200 px: Plan is current; the bar stays at the bottom while the page scrolls (press Tab for the focus ring★)
- sidebar, ≥ 1200 px: Today is current (on a phone, scroll this frame sideways)
- tab bar with settings: the button at the right of the top bar; press it to open Settings
- sidebar with settings, 1280 px: the button at the bottom of the sidebar; press it to open Settings
- settings active: its dialog is open (both layouts, static)

## Status

done, main. Issue – (#62, #65).
