import { formatEUR, type Locale } from "@nutrigo/shared";
import { useId, useState } from "react";
import { ChartTable } from "../ChartTable/ChartTable.tsx";
import styles from "./SpendChart.module.css";

// Expense overview from the dataviz sketch: one column per week, the peak orange,
// actual spend solid and an estimate hatched with "~" (never colour alone).
export type SpendWeek = { label: string; cents: number; estimated: boolean };

type Props = { weeks: SpendWeek[]; locale: Locale };

const W = 320;
const H = 170;
const L = 34;
const B = 24;
const TOP = 14;
const y = (v: number, top: number) => TOP + (H - TOP - B) * (1 - v / top);

export function SpendChart({ weeks, locale }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [tip, setTip] = useState<number | null>(null);
  const id = useId();
  if (weeks.length === 0)
    return <p className={styles.hint}>No spending recorded</p>;

  const max = Math.max(...weeks.map((w) => w.cents));
  const peak = weeks.findIndex((w) => w.cents === max);
  const top = Math.max(3000, Math.ceil(max / 3000) * 3000);
  const slot = (W - L - 8) / Math.max(weeks.length, 4);
  const bw = slot * 0.6;
  const money = (w: SpendWeek) =>
    `${w.estimated ? "~" : ""}${formatEUR(w.cents, locale)}`;
  const tipWeek = tip === null ? undefined : weeks[tip];

  return (
    <div className={styles.root}>
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
        <ChartTable
          caption="Spend per week"
          columns={[
            { label: "Week" },
            { label: "Spend", numeric: true },
            { label: "Status" },
          ]}
          rows={weeks.map((w) => [
            w.label,
            money(w),
            w.estimated ? "Estimated" : "Actual",
          ])}
        />
      ) : (
        <>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Weekly grocery spend, highest in ${weeks[peak]!.label} at ${formatEUR(max, locale)}`}
          >
            <defs>
              <pattern
                id={`${id}-hatch`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" className={styles.yellowLight} />
                <rect width="2.5" height="6" className={styles.yellow} />
              </pattern>
            </defs>
            {[0, 1, 2, 3].map((n) => {
              const v = (top / 3) * n;
              return (
                <g key={n}>
                  <line
                    x1={L}
                    x2={W}
                    y1={y(v, top)}
                    y2={y(v, top)}
                    className={styles.grid}
                  />
                  <text x={L - 6} y={y(v, top) + 4} textAnchor="end">
                    {formatEUR(v, locale).replace(/[.,]00$/, "")}
                  </text>
                </g>
              );
            })}
            {weeks.map((w, i) => {
              const x = L + 8 + i * slot + (slot - bw) / 2;
              const kind =
                i === peak ? "peak" : w.estimated ? "estimated" : "actual";
              return (
                <g
                  key={w.label}
                  data-testid="column"
                  data-kind={kind}
                  tabIndex={0}
                  className={styles.col}
                  onMouseEnter={() => setTip(i)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setTip(i)}
                  onBlur={() => setTip(null)}
                >
                  <rect
                    x={x - 2}
                    y={TOP}
                    width={bw + 4}
                    height={H - TOP}
                    className={styles.hit}
                  />
                  <rect
                    x={x}
                    y={y(w.cents, top)}
                    width={bw}
                    height={y(0, top) - y(w.cents, top)}
                    rx="4"
                    className={kind === "peak" ? styles.orange : styles.yellow}
                    fill={
                      kind === "estimated" ? `url(#${id}-hatch)` : undefined
                    }
                  />
                  <text x={x + bw / 2} y={H - 6} textAnchor="middle">
                    {w.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className={styles.legend}>
            <span>
              <i className={`${styles.sw} ${styles.yellow}`} />
              Actual
            </span>
            <span>
              <i className={`${styles.sw} ${styles.hatch}`} />
              Estimated (not yet shopped)
            </span>
            <span>
              <i className={`${styles.sw} ${styles.orange}`} />
              Highest week
            </span>
          </div>
          <p className={styles.tipRow}>
            {tipWeek && (
              <span role="tooltip" className={styles.tip}>
                {`${tipWeek.label} · ${money(tipWeek)}`}
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
