import type { SelectHTMLAttributes } from "react";
import { Icon } from "../Icon/index.ts";
import styles from "./SelectPill.module.css";

type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "multiple" | "size"
> & {
  /** Accessible name (the design shows no visible label). */
  label: string;
  options: readonly { value: string; text: string }[];
};

// .select-pill from design/source/nutrigo.css. The design cycles values on click (issue D10);
// this is a native select, with the chevron drawn on top and letting clicks through.
export function SelectPill({ label, options, ...rest }: Props) {
  return (
    <span className={styles.pill}>
      <select {...rest} aria-label={label} className={styles.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.text}
          </option>
        ))}
      </select>
      <Icon name="chevron" size="xs" />
    </span>
  );
}
