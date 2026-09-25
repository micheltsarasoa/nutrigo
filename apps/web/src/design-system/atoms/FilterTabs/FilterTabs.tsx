import { useId } from "react";
import styles from "./FilterTabs.module.css";

type Props<V extends string> = {
  /** Accessible name of the group (the design shows no visible label). */
  label: string;
  options: readonly { value: V; text: string }[];
  value: V;
  onChange: (value: V) => void;
};

// .filter-tabs from design/source/Healthy Menu.dc.html. They filter a list rather than switch
// panels, so they're native radios (one tab stop, arrow keys move) instead of ARIA tabs.
export function FilterTabs<V extends string>({
  label,
  options,
  value,
  onChange,
}: Props<V>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={styles.tabs}>
      {options.map((o) => (
        <label key={o.value} className={styles.tab}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
            className={styles.radio}
          />
          {o.text}
        </label>
      ))}
    </div>
  );
}
