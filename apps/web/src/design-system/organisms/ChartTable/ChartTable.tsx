import styles from "./ChartTable.module.css";

type Props = {
  /** Names the table for screen readers; not shown. */
  caption: string;
  columns: { label: string; numeric?: boolean }[];
  /** Cells already formatted, in column order. */
  rows: string[][];
  /** Shown instead of the table when there are no rows. */
  empty?: string;
};

// The accessible twin of every chart (dataviz.html): the same numbers as text. Generalised from
// the table view of ColumnChart (SPEC-004).
export function ChartTable({
  caption,
  columns,
  rows,
  empty = "No data",
}: Props) {
  if (rows.length === 0) return <p className={styles.empty}>{empty}</p>;
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.label} className={c.numeric ? styles.n : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td
                key={j}
                className={columns[j]?.numeric ? styles.n : undefined}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
