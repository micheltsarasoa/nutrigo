import { useId, useState } from "react";
import { ChartTable } from "../ChartTable/index.ts";
import { useNumber } from "../../../locale.tsx";
import styles from "./ColumnChart.module.css";

// Week trend from the #217 sketch: Mon..Sun columns, eaten solid, planned hatched,
// over target orange with "▲ +N over" in the tooltip and table (never colour alone).
export type ChartDay = {
  day: string;
  kcal: number;
  status: "eaten" | "planned" | "none";
};

type Props = { days: ChartDay[]; target: number };

const W = 360;
const H = 200;
const L = 34;
const B = 24;
const TOP = 14;
const MAX = 2600;
const PW = (W - L - 8) / 7;
const BW = PW * 0.58;
const y = (v: number) => TOP + (H - TOP - B) * (1 - v / MAX);

const overText = (d: ChartDay, target: number) =>
  d.kcal > target ? ` ▲ +${d.kcal - target} over` : "";

export function ColumnChart({ days, target }: Props) {
  const n = useNumber();
  const [view, setView] = useState<"chart" | "table">("chart");
  const [tip, setTip] = useState<number | null>(null);
  const id = useId();
  const tipDay = tip === null ? undefined : days[tip];
  const empty = days.every((d) => d.status === "none");

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
          caption="Calories per day this week"
          columns={[
            { label: "Day" },
            { label: "kcal", numeric: true },
            { label: "Status" },
          ]}
          rows={days.map((d) => [
            d.day,
            String(d.kcal),
            d.status === "none"
              ? "None"
              : (d.status === "eaten" ? "Eaten" : "Planned") +
                overText(d, target),
          ])}
        />
      ) : (
        <>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Calories per day this week against a target of ${n(target)} kcal`}
          >
            <defs>
              {(["green", "orange"] as const).map((c) => (
                <pattern
                  key={c}
                  id={`${id}-${c}`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" className={styles[`${c}Light`]} />
                  <rect width="2.5" height="6" className={styles[c]} />
                </pattern>
              ))}
            </defs>
            {[0, 1000, 2000].map((t) => (
              <g key={t}>
                <line
                  x1={L}
                  x2={W}
                  y1={y(t)}
                  y2={y(t)}
                  className={styles.grid}
                />
                <text x={L - 6} y={y(t) + 4} textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const x = L + 8 + i * PW + (PW - BW) / 2;
              const over = d.kcal > target;
              const kind =
                d.status === "none" || d.kcal <= 0
                  ? "none"
                  : `${d.status}${over ? "-over" : ""}`;
              const tone = over ? "orange" : "green";
              return (
                <g
                  key={d.day}
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
                    width={BW + 4}
                    height={H - TOP}
                    className={styles.hit}
                  />
                  {kind === "none" ? (
                    <line
                      x1={x}
                      x2={x + BW}
                      y1={y(0)}
                      y2={y(0)}
                      className={styles.baseline}
                      strokeLinecap="round"
                    />
                  ) : (
                    <rect
                      x={x}
                      y={y(d.kcal)}
                      width={BW}
                      height={y(0) - y(d.kcal)}
                      rx="4"
                      className={
                        d.status === "planned"
                          ? styles[`${tone}Stroke`]
                          : styles[tone]
                      }
                      fill={
                        d.status === "planned"
                          ? `url(#${id}-${tone})`
                          : undefined
                      }
                    />
                  )}
                  <text x={x + BW / 2} y={H - 6} textAnchor="middle">
                    {d.day}
                  </text>
                </g>
              );
            })}
            <line
              x1={L}
              x2={W}
              y1={y(target)}
              y2={y(target)}
              className={styles.target}
            />
          </svg>
          <div className={styles.legend}>
            <span>
              <i className={`${styles.sw} ${styles.green}`} />
              Eaten
            </span>
            <span>
              <i className={`${styles.sw} ${styles.hatch}`} />
              Planned
            </span>
            <span>
              <i className={`${styles.sw} ${styles.orange}`} />
              Over target ▲
            </span>
            <span>{`- - Target ${n(target)} kcal`}</span>
          </div>
          {empty && (
            <p className={styles.hint}>
              Nothing planned or eaten this week yet.
            </p>
          )}
          {tipDay && (
            <p className={styles.tipRow}>
              <span role="tooltip" className={styles.tip}>
                {`${tipDay.day} · ${tipDay.kcal} kcal${tipDay.kcal > target ? ` · ▲ +${tipDay.kcal - target} over` : ""}`}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
