import { useState } from "react";
import { Legend } from "../../molecules/Legend/index.ts";
import styles from "./StackedBar.module.css";

export type StackedWeek = {
  /** "W40". */
  label: string;
  /** Spend per category in cents, in the same order as `categories`. */
  cents: number[];
};

type Props = {
  categories: { label: string; color: string }[];
  weeks: StackedWeek[];
  locale?: "fr-FR" | "en-IE";
};

// Sprint 4 sketch, Grocery Category: one stacked column per week, a legend with each category's
// total and share, and a table view for screen readers (dataviz.html: every chart has one).
const W = 340;
const H = 190;
const L = 10;
const BOTTOM = 22;
const TOP = 10;

const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
const euros = (cents: number) => (cents / 100).toFixed(2);

export function StackedBar({ categories, weeks, locale = "fr-FR" }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const totals = weeks.map((w) => sum(w.cents));
  const grand = sum(totals);

  if (grand === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No spending recorded</p>
        <p>Enter the price paid when you tick an item.</p>
      </div>
    );
  }

  const max = Math.max(...totals);
  const slot = (W - L) / Math.max(weeks.length, 4);
  const label =
    weeks.length === 1
      ? "Spend by category for the last week"
      : `Spend by category for the last ${weeks.length} weeks`;
  const legend = categories.map((c, j) => {
    const cents = sum(weeks.map((w) => w.cents[j] ?? 0));
    return {
      ...c,
      cents,
      percent: Math.round((cents / grand) * 100),
    };
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
              <th>Week</th>
              {categories.map((c) => (
                <th key={c.label} className={styles.n}>
                  {c.label}
                </th>
              ))}
              <th className={styles.n}>Total</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={w.label}>
                <td>{w.label}</td>
                {categories.map((c, j) => (
                  <td key={c.label} className={styles.n}>
                    {euros(w.cents[j] ?? 0)}
                  </td>
                ))}
                <td className={styles.n}>{euros(totals[i] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className={styles.svg}
            role="img"
            aria-label={label}
          >
            {weeks.map((w, i) => {
              const bw = slot * 0.6;
              const x = L + i * slot + slot * 0.2;
              let y = H - BOTTOM;
              return (
                <g key={w.label}>
                  {categories.map((c, j) => {
                    const h = ((H - BOTTOM - TOP) * (w.cents[j] ?? 0)) / max;
                    y -= h;
                    return (
                      <rect
                        key={c.label}
                        data-seg
                        x={x}
                        y={y}
                        width={bw}
                        height={Math.max(h - 1, 0)}
                        rx="2"
                        fill={c.color}
                      />
                    );
                  })}
                  <text x={x + bw / 2} y={H - 6} textAnchor="middle">
                    {w.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className={styles.legend}>
            <Legend items={legend} locale={locale} label="Spend by category" />
          </div>
        </>
      )}
    </div>
  );
}
