// SPEC-004 US-1 to US-3: today's totals, the meals with check-off and the week trend.
// The page fetches and mutates; every tick or untick refetches the day and the week.
import {
  type MealEntry,
  MealType,
  type Plan,
  isoWeekOf,
  nextMealId,
} from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { MealItem } from "../design-system/molecules/MealItem/index.ts";
import { ServingsPrompt } from "../design-system/molecules/ServingsPrompt/index.ts";
import { CaloriesCard } from "../design-system/organisms/CaloriesCard/index.ts";
import {
  ColumnChart,
  type ChartDay,
} from "../design-system/organisms/ColumnChart/index.ts";
import styles from "./TodayPage.module.css";

type Macros = { kcal: number; carbs: number; protein: number; fat: number };
type Goal = { eaten: number; target: number | null };
type Day = {
  target: number | null;
  planned: Macros;
  eaten: Macros;
  macros: { carbs: Goal; protein: Goal; fat: Goal };
};
type Week = {
  days: { date: string; planned: Macros; eaten: Macros }[];
  target: number | null;
};

const SAVE_ERROR =
  "Couldn’t save the change. Check the connection and try again.";
const weekday = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00Z`));

async function get<T>(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error();
  return (await res.json()) as T;
}

export function TodayPage() {
  // The browser's local clock, so "today" changes at the owner's midnight.
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const isoWeek = isoWeekOf(today);
  const [data, setData] = useState<{ day: Day; week: Week; plan: Plan } | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [asking, setAsking] = useState<MealEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setError(false);
    Promise.all([
      get<Day>(`/api/nutrition/day/${today}`, signal),
      get<Week>(`/api/nutrition/week/${isoWeek}`, signal),
      get<Plan>(`/api/plans/${isoWeek}`, signal),
    ])
      .then(([day, week, plan]) => {
        // A reply of the wrong shape is a failed load, not a crash.
        if (!day?.macros || !week?.days || !plan?.days) throw new Error();
        setData({ day, week, plan });
      })
      .catch(() => {
        if (!signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [today, isoWeek, attempt]);

  async function change(method: "POST" | "DELETE", id: number, body?: unknown) {
    setSaving(true);
    setProblem(null);
    try {
      const res = await fetch(`/api/plans/${isoWeek}/entries/${id}/eaten`, {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setAsking(null);
      setAttempt((n) => n + 1);
    } catch {
      setProblem(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <main>
        <h1>Today</h1>
        {error ? (
          <div role="alert" className={styles.alert}>
            <p>Couldn’t load today. Check the connection and try again.</p>
            <Button onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
          </div>
        ) : (
          <p aria-busy="true">Loading…</p>
        )}
      </main>
    );
  }

  const { day, week, plan } = data;
  const slots: Partial<Plan["days"][number]["slots"]> =
    plan.days.find((d) => d.date === today)?.slots ?? {};
  const entries = MealType.options.flatMap((s) => slots[s] ?? []);
  // The next meal comes from the browser clock, like "today" (same pure function as the API).
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const next = nextMealId(entries, localNow);
  const kcalOf = (e: MealEntry) =>
    Math.round(
      e.kcalPerServing *
        (e.eatenAt ? (e.eatenServings ?? e.servings) : e.servings),
    );
  const { carbs, protein, fat } = day.macros;
  const chart: ChartDay[] = week.days.map((d) => {
    // Browser clock, like everything else on this page (the API judges by its own).
    const past = d.date < today;
    const kcal = Math.round(past ? d.eaten.kcal : d.planned.kcal);
    return {
      day: weekday(d.date),
      kcal,
      status: kcal === 0 ? "none" : past ? "eaten" : "planned",
    };
  });

  return (
    <main>
      <h1>Today</h1>
      <div className={styles.layout}>
        <div className={styles.main}>
          <h2>Nutrition</h2>
          <CaloriesCard
            kcal={Math.round(day.eaten.kcal)}
            target={day.target ?? 0}
            planned={Math.round(day.planned.kcal)}
            macros={{
              carbs: Math.round(carbs.eaten),
              protein: Math.round(protein.eaten),
              fat: Math.round(fat.eaten),
            }}
            targets={{
              carbs: carbs.target ?? 0,
              protein: protein.target ?? 0,
              fat: fat.target ?? 0,
            }}
          />
          {week.target ? (
            <section className={styles.trend}>
              <h2>This week</h2>
              <ColumnChart days={chart} target={week.target} />
            </section>
          ) : null}
        </div>
        <section className={styles.meals} aria-labelledby="meals-title">
          <h2 id="meals-title">Meals</h2>
          {problem && (
            <p role="alert" className={styles.alert}>
              {problem}
            </p>
          )}
          {asking && (
            <ServingsPrompt
              key={asking.id}
              title={asking.recipeName}
              planned={asking.servings}
              kcalPerServing={Math.round(asking.kcalPerServing)}
              onSave={(servings) => change("POST", asking.id, { servings })}
              onCancel={() => setAsking(null)}
            />
          )}
          {entries.length === 0 ? (
            <p>
              Nothing planned today. <a href={`/plan/${isoWeek}`}>Plan meals</a>
            </p>
          ) : (
            <ul className={styles.list}>
              {entries.map((e) => (
                <li key={e.id}>
                  <MealItem
                    name={e.recipeName}
                    mealType={e.slot}
                    kcal={kcalOf(e)}
                    servings={e.servings}
                    eatenServings={e.eatenServings ?? undefined}
                    eaten={!!e.eatenAt}
                    next={e.id === next}
                    disabled={saving}
                    photo={null}
                    mosaic={[]}
                    onToggle={(eaten) =>
                      eaten ? setAsking(e) : change("DELETE", e.id)
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
