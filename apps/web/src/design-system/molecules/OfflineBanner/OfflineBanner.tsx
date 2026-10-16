import { Button } from "../../atoms/Button/index.ts";
import styles from "./OfflineBanner.module.css";

type Props = {
  state: "offline" | "syncing" | "error";
  /** Changes made on this device and not yet sent. */
  pending: number;
  /** Shows the Retry button on the error state. */
  onRetry?: () => void;
};

const changes = (n: number) => `${n} ${n === 1 ? "change" : "changes"}`;

// Render it only when something needs saying; the caller hides it when online and in sync.
export function OfflineBanner({ state, pending, onRetry }: Props) {
  if (state === "error") {
    return (
      <div role="alert" className={`${styles.banner} ${styles.error}`}>
        <span>Couldn&apos;t sync {changes(pending)}</span>
        {onRetry && (
          <span className={styles.action}>
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </span>
        )}
      </div>
    );
  }
  const text =
    state === "syncing"
      ? `Syncing ${changes(pending)}…`
      : pending > 0
        ? `Offline · ${changes(pending)} pending`
        : "Offline · changes are saved on this device";
  return (
    <div role="status" className={styles.banner}>
      {text}
    </div>
  );
}
