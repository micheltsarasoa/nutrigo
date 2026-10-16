// SPEC-005 US-6 (AC-10): where the grocery money goes. Weekly spend and the category split of the
// last 8 weeks that have a list; each chart has a table view.
import { type Category, formatEUR } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { Card } from "../design-system/atoms/Card/index.ts";
import { Donut } from "../design-system/organisms/Donut/index.ts";
import {
  SpendChart,
  type SpendWeek,
} from "../design-system/organisms/SpendChart/index.ts";
import { navigate } from "../router.ts";
import styles from "./GroceryInsightsPage.module.css";

const LOCALE = "en-IE";

type Spending = {
  weeks: { isoWeek: string; estimatedCents: number; actualCents: number }[];
  byCategory: { category: Category; cents: number }[];
};
type View =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: Spending };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function GroceryInsightsPage({ isoWeek }: { isoWeek: string }) {
  const [view, setView] = useState<View>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setView({ status: "loading" });
    fetch("/api/spending?weeks=8")
      .then((r) => (r.ok ? (r.json() as Promise<Spending>) : Promise.reject()))
      .then((data) => live && setView({ status: "ready", data }))
      .catch(() => live && setView({ status: "error" }));
    return () => {
      live = false;
    };
  }, [attempt]);

  const data = view.status === "ready" ? view.data : null;
  // Actual spend where it was entered, otherwise the estimate (hatched).
  const weeks: SpendWeek[] =
    data?.weeks.map((w) => ({
      label: w.isoWeek.slice(5),
      cents: w.actualCents > 0 ? w.actualCents : w.estimatedCents,
      estimated: w.actualCents === 0,
    })) ?? [];
  const total = data?.byCategory.reduce((n, c) => n + c.cents, 0) ?? 0;
  const slices =
    data?.byCategory.map((c) => ({
      label: cap(c.category),
      color: `var(--food-category-${c.category})`,
      cents: c.cents,
      percent: Math.round((c.cents / total) * 100),
    })) ?? [];

  return (
    <main>
      <div className={styles.head}>
        <h1>Grocery insights</h1>
        <Button
          variant="ghost"
          onClick={() => navigate(`/groceries/${isoWeek}`)}
        >
          Back to list
        </Button>
      </div>
      {view.status === "loading" && <p role="status">Loading insights…</p>}
      {view.status === "error" && (
        <div role="alert" className={styles.alert}>
          <p>Couldn’t load the insights.</p>
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      )}
      {data && (
        <div className={styles.grid}>
          <Card>
            <h2>Expense overview</h2>
            <p className={styles.sub}>€ per week · last 8 weeks</p>
            <SpendChart weeks={weeks} locale={LOCALE} />
          </Card>
          <Card>
            <h2>Expense breakdown</h2>
            <p className={styles.sub}>
              Last 8 weeks{total > 0 && ` · ${formatEUR(total, LOCALE)}`}
            </p>
            <Donut
              slices={slices}
              locale={LOCALE}
              caption="Spend by category"
            />
          </Card>
        </div>
      )}
    </main>
  );
}
