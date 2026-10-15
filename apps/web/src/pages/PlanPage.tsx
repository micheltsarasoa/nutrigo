// SPEC-003 US-1 to US-3: plan the week. The page fetches and mutates; the grid, the
// picker and the actions menu stay props-only. Every change refetches the week.
import {
  type MealEntry,
  type MealType,
  type Plan,
  isoWeekOf,
  RecipeSummary,
  weekDays,
  weekLabel,
} from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { WeekNav } from "../design-system/molecules/WeekNav/index.ts";
import { MealActionsMenu } from "../design-system/organisms/MealActionsMenu/index.ts";
import { MealPlanGrid } from "../design-system/organisms/MealPlanGrid/index.ts";
import { RecipePicker } from "../design-system/organisms/RecipePicker/index.ts";
import { navigate } from "../router.ts";
import styles from "./PlanPage.module.css";

const DAY = 24 * 60 * 60 * 1000;
const SLOT_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};
const SAVE_ERROR =
  "Couldn’t save the change. Check the connection and try again.";
const COPY_ERROR = "Couldn’t copy the previous week. It may have no meals.";

// "Tue 29": the weekday and the day of the month.
const label = (date: string) =>
  `${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(`${date}T00:00:00Z`))} ${Number(date.slice(8))}`;

// The week `n` weeks away: its Monday plus n × 7 days, read back as an ISO week.
const shift = (isoWeek: string, n: number) =>
  isoWeekOf(
    new Date(Date.parse(`${weekDays(isoWeek)[0]}T00:00:00Z`) + n * 7 * DAY)
      .toISOString()
      .slice(0, 10),
  );

const send = (method: string, url: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export function PlanPage({ isoWeek }: { isoWeek?: string }) {
  // Local date, so the highlighted day changes at the owner's midnight.
  const today = new Date().toLocaleDateString("en-CA");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(today);
  const [adding, setAdding] = useState<{
    date: string;
    slot: MealType | null;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [entry, setEntry] = useState<MealEntry | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // /plan has no week yet: replace it, so Back doesn't land on the redirect.
  useEffect(() => {
    if (!isoWeek) navigate(`/plan/${isoWeekOf(today)}`, true);
  }, [isoWeek, today]);

  const days = isoWeek ? weekDays(isoWeek) : [];
  const day = days.includes(selected) ? selected : (days[0] ?? today);
  const entries =
    plan?.days.flatMap((d) => Object.values(d.slots).flat()) ?? [];

  useEffect(() => {
    if (!isoWeek) return;
    const controller = new AbortController();
    setError(false);
    fetch(`/api/plans/${isoWeek}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setPlan((await res.json()) as Plan);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [isoWeek, attempt]);

  // The picker searches the recipes by name; the owner's pick is the only state kept.
  useEffect(() => {
    if (!adding) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ sort: "name" });
    if (query.trim()) params.set("q", query.trim());
    fetch(`/api/recipes?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setRecipes(RecipeSummary.array().parse(await res.json()));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [adding, query]);

  // Runs one change, then refetches the week and closes what it came from.
  async function run(
    request: Promise<Response>,
    failure: string,
    done: () => void,
  ) {
    setSaving(true);
    setProblem(null);
    try {
      if (!(await request).ok) throw new Error();
      setAttempt((n) => n + 1);
      done();
    } catch {
      setProblem(failure);
    } finally {
      setSaving(false);
    }
  }

  const entriesUrl = `/api/plans/${isoWeek}/entries`;
  const copy = (mode: "replace" | "merge") =>
    run(
      send("POST", `/api/plans/${isoWeek}/copy-from/${shift(isoWeek!, -1)}`, {
        mode,
      }),
      COPY_ERROR,
      () => setAsking(false),
    );
  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className={styles.head}>
        <h1>Meal plan</h1>
        {isoWeek && (
          <WeekNav
            label={weekLabel(isoWeek)}
            isCurrentWeek={isoWeek === isoWeekOf(today)}
            loading={plan === null || plan.isoWeek !== isoWeek}
            onPrevious={() => navigate(`/plan/${shift(isoWeek, -1)}`)}
            onNext={() => navigate(`/plan/${shift(isoWeek, 1)}`)}
            onToday={() => navigate(`/plan/${isoWeekOf(today)}`)}
          />
        )}
        <Button
          variant="ghost"
          onClick={() =>
            entries.length ? (setProblem(null), setAsking(true)) : copy("merge")
          }
        >
          Copy previous week
        </Button>
        <Button
          icon="add"
          onClick={() => {
            setQuery("");
            setProblem(null);
            setAdding({ date: day, slot: null });
          }}
        >
          Add meal
        </Button>
      </div>
      {asking && (
        <div
          role="group"
          aria-label="Copy previous week"
          className={styles.ask}
        >
          <p>This week already has meals. Replace them or add to them?</p>
          <Button loading={saving} onClick={() => copy("replace")}>
            Replace
          </Button>
          <Button
            variant="ghost"
            loading={saving}
            onClick={() => copy("merge")}
          >
            Merge
          </Button>
          <Button variant="ghost" onClick={() => setAsking(false)}>
            Cancel
          </Button>
          {problem && <p role="alert">{problem}</p>}
        </div>
      )}
      {!asking && problem && !adding && !menuOpen && (
        <p role="alert" className={styles.alert}>
          {problem}
        </p>
      )}
      <MealPlanGrid
        plan={plan ?? { isoWeek: isoWeek ?? "", days: [] }}
        today={today}
        selectedDate={day}
        loading={(plan === null || plan.isoWeek !== isoWeek) && !error}
        error={error}
        onSelectDay={setSelected}
        onAdd={(date, slot) => {
          setQuery("");
          setProblem(null);
          setAdding({ date, slot });
        }}
        onOpenEntry={(e) => {
          setProblem(null);
          setEntry(e);
          setMenuOpen(true);
        }}
        onRetry={() => setAttempt((n) => n + 1)}
      />
      <RecipePicker
        open={adding !== null}
        heading={`Add to ${label(adding?.date ?? day)}${adding?.slot ? ` · ${SLOT_LABEL[adding.slot]}` : ""}`}
        recipes={(recipes ?? []).map((r) => ({
          id: r.id,
          title: r.name,
          mealType: r.mealType,
          kcalPerServing: Math.round(r.kcalPerServing),
          photo: r.photoPath,
          mosaic: [],
        }))}
        loading={recipes === null}
        query={query}
        error={adding ? problem : null}
        saving={saving}
        onQueryChange={setQuery}
        onPick={(r, servings) =>
          run(
            send("POST", entriesUrl, {
              date: adding!.date,
              slot: adding!.slot ?? r.mealType,
              recipeId: r.id,
              servings,
            }),
            SAVE_ERROR,
            () => setAdding(null),
          )
        }
        onClose={() => setAdding(null)}
      />
      {entry && (
        <MealActionsMenu
          open={menuOpen}
          title={entry.recipeName}
          servings={entry.servings}
          date={entry.date}
          slot={entry.slot}
          days={days.map((date) => ({ date, label: label(date) }))}
          error={menuOpen ? problem : null}
          saving={saving}
          onServings={(servings) =>
            run(
              send("PATCH", `${entriesUrl}/${entry.id}`, { servings }),
              SAVE_ERROR,
              closeMenu,
            )
          }
          onMove={(date, slot) =>
            run(
              send("PATCH", `${entriesUrl}/${entry.id}`, { date, slot }),
              SAVE_ERROR,
              closeMenu,
            )
          }
          onDuplicate={(date, slot) =>
            run(
              send("POST", entriesUrl, {
                date,
                slot,
                recipeId: entry.recipeId,
                servings: entry.servings,
              }),
              SAVE_ERROR,
              closeMenu,
            )
          }
          onRemove={() =>
            run(
              send("DELETE", `${entriesUrl}/${entry.id}`),
              SAVE_ERROR,
              closeMenu,
            )
          }
          onClose={closeMenu}
        />
      )}
    </main>
  );
}
