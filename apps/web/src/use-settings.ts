// SPEC-008 §4: the Settings dialog's state, loaded on open and saved with PUT.
import { Settings, type SettingsInput } from "@nutrigo/shared";
import { useState } from "react";

const LOAD_ERROR =
  "Couldn't load your settings. Check the connection and try again.";
const SAVE_ERROR =
  "Couldn't save your settings. Your choice is kept, try again.";

export function useSettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error();
      setSettings(Settings.parse(await res.json()));
    } catch {
      setLoadError(LOAD_ERROR);
    }
  }

  function onSettings() {
    setOpen(true);
    setError(null);
    void load();
  }

  async function onSave(input: SettingsInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      setSettings(Settings.parse(await res.json()));
      setOpen(false);
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return {
    shellProps: { onSettings, settingsOpen: open },
    dialogProps: {
      open,
      settings,
      loadError,
      onRetry: load,
      saving,
      error,
      onSave,
      onClose: () => setOpen(false),
    },
  };
}
