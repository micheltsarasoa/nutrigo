Derived (SPEC-008 §4, S1: Display section only). A native dialog + form; props only, no fetching. The draft resets whenever the dialog opens or settings arrive. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  open: boolean;
  /** The saved settings; null while they load (or after a load error). */
  settings: Settings | null;
  /** The GET failed: shown with a Retry button instead of the form. */
  loadError?: string | null;
  onRetry?: () => void;
  saving?: boolean;
  /** The PUT failed: shown above the buttons, the picked values stay. */
  error?: string | null;
  /** Save sends the whole object. The dialog doesn't close itself: the page sets open=false on success. */
  onSave: (settings: SettingsInput) => void;
  /** Called once whenever the dialog closes: Cancel, Esc, or open turning false. */
  onClose: () => void;
};
```

## States shown

- loading (the settings are still on their way)
- load error with Retry (Retry loads them)
- editing, clean (fr-FR; Save waits for a change; Esc or Cancel closes and focus returns to the button★)
- dirty (English (Ireland) picked; the example follows)
- saving (Save busy)
- save error (the pick is kept)
- saved as en-IE, fr-FR picked (the example follows)

## Status

done, #149, #150. Issue #107.
