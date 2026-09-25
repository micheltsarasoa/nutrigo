import type { Locale, Settings } from "@nutrigo/shared";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Button } from "../../atoms/Button/index.ts";
import { SettingsDialog } from "./SettingsDialog.tsx";

// The saved settings, clean.
const FR: Settings = { locale: "fr-FR" };
// Already saved as en-IE, so the demo can then pick fr-FR back to it.
const EN: Settings = { locale: "en-IE" };

type Props = Partial<ComponentProps<typeof SettingsDialog>> & {
  /** Picks this locale in the select once the dialog opens, as the owner would. */
  pick?: Locale;
};

// The dialog is modal (top layer): each state is a trigger button plus the
// dialog, closed until clicked. Handlers only log, so it can be tried here.
function Live({ pick, settings = null, ...props }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  // The native close event follows a save too: keep "Saved …" for that one.
  const saved = useRef(false);

  // Picks the locale on open, as the owner would, to show the dirty state.
  useEffect(() => {
    if (!open || !pick) return;
    const select = wrapperRef.current?.querySelector("select");
    if (!select) return;
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )!.set!.call(select, pick);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, [open, pick]);

  return (
    <div ref={wrapperRef}>
      <Button variant="ghost" icon="settings" onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <SettingsDialog
        open={open}
        settings={settings}
        onSave={(s) => {
          saved.current = true;
          setLog(`Saved ${s.locale}`);
          setOpen(false);
        }}
        onRetry={() => {}}
        {...props}
        onClose={() => {
          setOpen(false);
          if (!saved.current) setLog("Closed without saving");
          saved.current = false;
        }}
      />
      {log && <p role="status">{log}</p>}
    </div>
  );
}

// The load error, then Retry loads FR.
function LoadError() {
  const [loaded, setLoaded] = useState(false);
  return (
    <Live
      settings={loaded ? FR : null}
      loadError={
        loaded
          ? null
          : "Your settings couldn't be loaded. Check your connection and try again."
      }
      onRetry={() => setLoaded(true)}
    />
  );
}

export default {
  title: "SettingsDialog",
  level: "organism",
  states: {
    "loading (the settings are still on their way)": <Live settings={null} />,
    "load error with Retry (Retry loads them)": <LoadError />,
    "editing, clean (fr-FR; Save waits for a change; Esc or Cancel closes and focus returns to the button★)":
      <Live settings={FR} />,
    "dirty (English (Ireland) picked; the example follows)": (
      <Live settings={FR} pick="en-IE" />
    ),
    "saving (Save busy)": <Live settings={FR} pick="en-IE" saving />,
    "save error (the pick is kept)": (
      <Live
        settings={FR}
        pick="en-IE"
        error="Your settings couldn't be saved. Check your connection and try again."
      />
    ),
    "saved as en-IE, fr-FR picked (the example follows)": (
      <Live settings={EN} pick="fr-FR" />
    ),
  },
} satisfies Demo;
