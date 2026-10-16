import { useState } from "react";
import { formatEUR } from "@nutrigo/shared";
import { Legend, type LegendItem } from "../../molecules/Legend/index.ts";
import styles from "./Donut.module.css";

type Props = {
  slices: LegendItem[];
  locale?: "fr-FR" | "en-IE";
  /** Under the total in the middle, e.g. "this week". */
  caption?: string;
};

// Sprint 4 sketch, Expense Breakdown: arcs by share of the total, a legend with € and %, and a
// table view for screen readers (dataviz.html: every chart has one).
const R = 60;
const C = 2 * Math.PI * R;
const GAP = 2;

export function Donut({ slices, locale = "fr-FR", caption }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const total = slices.reduce((t, s) => t + s.cents, 0);

  if (total === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No spending recorded</p>
        <p>Enter the price paid when you tick an item.</p>
      </div>
    );
  }

  const money = formatEUR(total, locale);
  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (C * s.cents) / total;
    const arc = (
      <circle
        key={s.label}
        data-slice
        cx="80"
        cy="80"
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="22"
        strokeDasharray={`${Math.max(len - (slices.length > 1 ? GAP : 0), 0)} ${C}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 80 80)"
      />
    );
    offset += len;
    return arc;
  });

  return (
    <div>
      <div className={styles.toggle} role="group" aria-label="View">
        {(["chart", "table"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
          >
            {v === "chart" ? "Chart" : "Table"}
          </button>
        ))}
      </div>
      {view === "table" ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th className={styles.n}>€</th>
              <th className={styles.n}>%</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td className={styles.n}>{(s.cents / 100).toFixed(2)}</td>
                <td className={styles.n}>{s.percent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.donut}>
          <svg
            viewBox="0 0 160 160"
            className={styles.svg}
            role="img"
            aria-label={`Spend by category, total ${money}`}
          >
            {arcs}
            <text
              x="80"
              y={caption ? 78 : 86}
              textAnchor="middle"
              className={styles.total}
            >
              {money}
            </text>
            {caption && (
              <text x="80" y="95" textAnchor="middle">
                {caption}
              </text>
            )}
          </svg>
          <Legend items={slices} locale={locale} label="Spend by category" />
        </div>
      )}
    </div>
  );
}
