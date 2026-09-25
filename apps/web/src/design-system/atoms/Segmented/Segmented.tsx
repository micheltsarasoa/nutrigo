import { useId } from "react";
import { Icon, type IconName } from "../Icon/index.ts";
import styles from "./Segmented.module.css";

type Props<V extends string> = {
  /** Accessible name of the group (the design shows no visible label). */
  label: string;
  options: readonly { value: V; icon: IconName; label: string }[];
  value: V;
  onChange: (value: V) => void;
};

// .seg from design/source/Healthy Menu.dc.html. Native radios: one tab stop, arrow keys move.
export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
}: Props<V>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={styles.seg}>
      {options.map((o) => (
        <label key={o.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={o.value}
            aria-label={o.label}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
            className={styles.radio}
          />
          <Icon name={o.icon} size="sm" />
        </label>
      ))}
    </div>
  );
}
