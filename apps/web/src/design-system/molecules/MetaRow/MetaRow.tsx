import type { IconName } from "../../atoms/Icon/index.ts";
import { IconBadge } from "../../atoms/IconBadge/index.ts";
import styles from "./MetaRow.module.css";

type Props = {
  icon: IconName;
  label: string;
  value: string | null;
};

// .meta-row from Recipe Details. Goes inside a <dl>.
export function MetaRow({ icon, label, value }: Props) {
  return (
    <div className={styles.row}>
      <IconBadge variant="green-light" icon={icon} />
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value ?? "–"}</dd>
    </div>
  );
}
