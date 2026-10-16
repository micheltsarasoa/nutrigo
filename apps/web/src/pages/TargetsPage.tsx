// SPEC-004 AC-7: one card form for the daily targets. GET answers 200 null until saved.
import type { Targets } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { TargetsForm } from "../design-system/organisms/TargetsForm/index.ts";
import styles from "./TargetsPage.module.css";

export function TargetsPage() {
  // undefined: loading; null: nothing saved yet.
  const [targets, setTargets] = useState<Targets | null | undefined>();
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/targets", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setTargets((await res.json()) as Targets | null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  async function save(next: Targets) {
    setSaving(true);
    setSaved(false);
    setError(undefined);
    try {
      const res = await fetch("/api/targets", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError(
        "Couldn’t save the targets. Check the connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1>Targets</h1>
      {loadError ? (
        <p role="alert" className={styles.message}>
          Couldn’t load your targets. Check the connection and reload the page.
        </p>
      ) : targets === undefined ? (
        <p role="status" className={styles.message}>
          Loading…
        </p>
      ) : (
        <>
          <TargetsForm
            initial={targets ?? undefined}
            onSave={save}
            saving={saving}
            error={error}
          />
          {saved && (
            <p role="status" className={styles.message}>
              Targets saved.
            </p>
          )}
        </>
      )}
    </main>
  );
}
