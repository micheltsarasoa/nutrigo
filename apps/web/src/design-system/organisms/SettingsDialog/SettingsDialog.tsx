import {
  SettingsInput,
  formatEUR,
  formatNumber,
  type Locale,
  type Settings,
} from "@nutrigo/shared";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { Icon } from "../../atoms/Icon/index.ts";
import { SettingRow } from "../../molecules/SettingRow/index.ts";
import styles from "./SettingsDialog.module.css";

const LOCALES: { value: Locale; text: string }[] = [
  { value: "fr-FR", text: "Français (France)" },
  { value: "en-IE", text: "English (Ireland)" },
];

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

// Derived (SPEC-008 §4, S1: Display section only). A native dialog + form; props
// only, no fetching. The draft resets whenever the dialog opens or settings arrive.
export function SettingsDialog({
  open,
  settings,
  loadError,
  onRetry,
  saving = false,
  error,
  onSave,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [locale, setLocale] = useState<Locale>(settings?.locale ?? "fr-FR");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Reopening (or the saved locale arriving/changing while open) discards any
  // draft. Depends on the value, not the settings object, so a parent handing
  // in a fresh object with the same locale on every render doesn't wipe it.
  const savedLocale = settings?.locale;
  useEffect(() => {
    if (open && savedLocale) setLocale(savedLocale);
  }, [open, savedLocale]);

  const dirty = settings != null && locale !== settings.locale;
  // Not `saving`: the Button's `loading` already sets aria-busy, ignores
  // clicks and keeps focus; a native `disabled` would drop focus instead.
  const saveDisabled = !!loadError || !dirty;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    onSave(SettingsInput.parse({ locale }));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClose={onClose}
    >
      <form noValidate onSubmit={submit} className={styles.form}>
        <h2 id={titleId} className={styles.title}>
          Settings
        </h2>

        {settings == null && !loadError && (
          <p role="status" className={styles.status}>
            Loading your settings…
          </p>
        )}

        {loadError && (
          <>
            <div role="alert" className={styles.alert}>
              <p>{loadError}</p>
            </div>
            <Button variant="ghost" onClick={onRetry}>
              Retry
            </Button>
          </>
        )}

        {settings != null && !loadError && (
          <Card>
            <h3 className={styles.cardTitle}>Display</h3>
            <SettingRow
              label="Number and money format"
              help={`Example: ${formatNumber(1240, locale)} kcal · ${formatEUR(5740, locale)}`}
            >
              {(control) => (
                <span className={styles.selectBox}>
                  <select
                    {...control}
                    className={styles.select}
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                  >
                    {LOCALES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.text}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size="xs" />
                </span>
              )}
            </SettingRow>
          </Card>
        )}

        {error && (
          <div role="alert" className={styles.alert}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button
            type="submit"
            icon="check"
            loading={saving}
            disabled={saveDisabled}
          >
            Save
          </Button>
        </div>
      </form>
    </dialog>
  );
}
