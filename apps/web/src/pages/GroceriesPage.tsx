// SPEC-005 US-1 to US-5: the week's shopping list. The page fetches and mutates; the table, the
// phone list and the KPI cards stay props-only. Ticks and edits show at once and are sent in the
// background; the offline queue (#261) will take over the sending.
import {
  Category,
  type ShoppingItem,
  type ShoppingList,
  formatEUR,
  isoWeekOf,
  weekDays,
  weekLabel,
} from "@nutrigo/shared";
import { type ComponentProps, useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { Field } from "../design-system/atoms/Field/index.ts";
import { MoneyField } from "../design-system/atoms/MoneyField/index.ts";
import { Select } from "../design-system/atoms/Select/index.ts";
import { KpiCard } from "../design-system/molecules/KpiCard/index.ts";
import { WeekNav } from "../design-system/molecules/WeekNav/index.ts";
import { GroceryList } from "../design-system/organisms/GroceryList/index.ts";
import {
  GroceryTable,
  type GroceryTableItem,
} from "../design-system/organisms/GroceryTable/index.ts";
import { navigate } from "../router.ts";
import styles from "./GroceriesPage.module.css";

// Pages don't read the locale setting yet (see RecipePage); the sketches use en-IE.
const LOCALE = "en-IE";
const DAY = 24 * 60 * 60 * 1000;
const SAVE_ERROR =
  "Couldn’t save the change. Check the connection and try again.";
const UNITS = [
  { value: "", text: "No unit" },
  { value: "g", text: "g" },
  { value: "ml", text: "ml" },
  { value: "piece", text: "piece" },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const shift = (isoWeek: string, n: number) =>
  isoWeekOf(
    new Date(Date.parse(`${weekDays(isoWeek)[0]}T00:00:00Z`) + n * 7 * DAY)
      .toISOString()
      .slice(0, 10),
  );
const url = (isoWeek: string) => `/api/shopping-lists/${isoWeek}`;
const send = (method: string, to: string, body?: unknown) =>
  fetch(to, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const toRow = (i: ShoppingItem): GroceryTableItem => ({
  id: String(i.id),
  name: i.label,
  category: cap(i.category),
  quantity: i.quantity,
  unit: i.unit,
  // The list API carries no calories yet.
  kcal: null,
  estCents: i.estCostCents,
  actualCents: i.actualCostCents,
  purchased: i.purchasedAt !== null,
  manual: i.ingredientId === null,
  noLongerInPlan: i.noLongerInPlan === true,
  pendingSync: false,
});

const sign = (n: number) => (n > 0 ? "+" : "−");
const plural = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

type View =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: ShoppingItem[] | null; hasMeals: boolean };

export function GroceriesPage({
  isoWeek,
  wide,
}: {
  isoWeek?: string;
  wide: boolean;
}) {
  const today = new Date().toLocaleDateString("en-CA");
  const [view, setView] = useState<View>({ status: "loading" });
  const [previous, setPrevious] = useState<ShoppingList | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    label: "",
    category: "others",
    quantity: "",
    unit: "",
  });
  const [opened, setOpened] = useState<string | null>(null);

  // /groceries has no week yet: replace it, so Back doesn't land on the redirect.
  useEffect(() => {
    if (!isoWeek) navigate(`/groceries/${isoWeekOf(today)}`, true);
  }, [isoWeek, today]);

  useEffect(() => {
    if (!isoWeek) return;
    const controller = new AbortController();
    const { signal } = controller;
    setView({ status: "loading" });
    (async () => {
      try {
        const [current, last] = await Promise.all([
          fetch(url(isoWeek), { signal }),
          fetch(url(shift(isoWeek, -1)), { signal }),
        ]);
        setPrevious(last.ok ? ((await last.json()) as ShoppingList) : null);
        if (current.ok) {
          const list = (await current.json()) as ShoppingList;
          setView({ status: "ready", items: list.items, hasMeals: true });
          return;
        }
        if (current.status !== 404) throw new Error();
        // No list yet: it is "no plan" when the week has no meals to build one from.
        const plan = await fetch(`/api/plans/${isoWeek}`, { signal });
        if (!plan.ok) throw new Error();
        const { days } = (await plan.json()) as {
          days: { slots: Record<string, unknown[]> }[];
        };
        const hasMeals = days.some((d) =>
          Object.values(d.slots).some((s) => s.length > 0),
        );
        setView({ status: "ready", items: null, hasMeals });
      } catch {
        if (!signal.aborted) setView({ status: "error" });
      }
    })();
    return () => controller.abort();
  }, [isoWeek, attempt]);

  const items = view.status === "ready" ? view.items : null;
  const rows = (items ?? []).map(toRow);
  const setItems = (next: ShoppingItem[]) =>
    setView((v) => (v.status === "ready" ? { ...v, items: next } : v));

  async function generate(mode: "create" | "regenerate") {
    setSaving(true);
    setProblem(null);
    try {
      const res = await send("POST", `${url(isoWeek!)}/generate`, { mode });
      if (!res.ok) throw new Error();
      setItems(((await res.json()) as ShoppingList).items);
      setView((v) => (v.status === "ready" ? { ...v, hasMeals: true } : v));
    } catch {
      setProblem(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  // Shows the change now, then sends it; on failure the server's list comes back.
  async function change(
    id: string,
    patch: {
      purchased?: boolean;
      actualCostCents?: number | null;
      quantity?: number;
    },
  ) {
    const at = new Date().toISOString();
    setItems(
      (items ?? []).map((i) =>
        String(i.id) !== id
          ? i
          : {
              ...i,
              quantity: patch.quantity ?? i.quantity,
              actualCostCents:
                patch.actualCostCents === undefined
                  ? i.actualCostCents
                  : patch.actualCostCents,
              purchasedAt:
                patch.purchased === undefined
                  ? i.purchasedAt
                  : patch.purchased
                    ? at
                    : null,
              updatedAt: at,
            },
      ),
    );
    setProblem(null);
    try {
      const res = await send("PATCH", `${url(isoWeek!)}/items`, [
        { id: Number(id), patch, updatedAt: at },
      ]);
      if (!res.ok) throw new Error();
    } catch {
      setProblem(SAVE_ERROR);
      setAttempt((n) => n + 1);
    }
  }

  async function addItem() {
    setSaving(true);
    setProblem(null);
    try {
      const quantity = Number(draft.quantity);
      const res = await send("POST", `${url(isoWeek!)}/items`, {
        label: draft.label,
        category: draft.category,
        quantity: draft.quantity && quantity > 0 ? quantity : null,
        unit: draft.unit || null,
      });
      if (!res.ok) throw new Error();
      setItems([...(items ?? []), (await res.json()) as ShoppingItem]);
      setAdding(false);
      setDraft({ label: "", category: "others", quantity: "", unit: "" });
    } catch {
      setProblem(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  const state =
    items !== null
      ? "ready"
      : view.status === "ready" && view.hasMeals
        ? "noList"
        : "noPlan";
  const estimated = (items ?? []).reduce(
    (n, i) => n + (i.estCostCents ?? 0),
    0,
  );
  const excluded = (items ?? []).filter((i) => i.estCostCents === null).length;
  const delta = (
    now: number,
    before: number | undefined,
    text: (n: number) => string,
  ) =>
    before === undefined || now === before
      ? undefined
      : {
          direction: now > before ? ("up" as const) : ("down" as const),
          text: `${sign(now - before)}${text(Math.abs(now - before))} vs last week`,
        };
  const kpis: ComponentProps<typeof KpiCard>[] = [
    {
      label: "Estimated cost",
      value: `~${formatEUR(estimated, LOCALE)}`,
      delta: delta(estimated, previous?.estimatedCents, (n) =>
        formatEUR(n, LOCALE),
      ),
      hint: excluded > 0 ? `Estimate excludes ${plural(excluded)}` : undefined,
    },
    {
      label: "Total items",
      value: String(rows.length),
      delta: delta(rows.length, previous?.items.length, String),
      hint: previous ? undefined : "No previous list",
    },
    { label: "Total kcal", value: "–", hint: "Not available yet" },
  ];
  const week = isoWeek ?? isoWeekOf(today);
  const openedRow = rows.find((r) => r.id === opened);

  return (
    <main>
      <div className={styles.head}>
        <h1>Groceries</h1>
        {isoWeek && (
          <WeekNav
            label={weekLabel(isoWeek)}
            isCurrentWeek={isoWeek === isoWeekOf(today)}
            loading={view.status === "loading"}
            onPrevious={() => navigate(`/groceries/${shift(isoWeek, -1)}`)}
            onNext={() => navigate(`/groceries/${shift(isoWeek, 1)}`)}
            onToday={() => navigate(`/groceries/${isoWeekOf(today)}`)}
          />
        )}
        {wide && state === "ready" && (
          <Button icon="add" onClick={() => setAdding(true)}>
            Add item
          </Button>
        )}
      </div>
      {problem && (
        <p role="alert" className={styles.alert}>
          {problem}
        </p>
      )}
      {view.status === "loading" && <p role="status">Loading groceries…</p>}
      {view.status === "error" && (
        <div role="alert" className={styles.alert}>
          <p>Couldn’t load the list.</p>
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      )}
      {adding && (
        <form
          className={styles.form}
          aria-label="Add item"
          onSubmit={(e) => {
            e.preventDefault();
            void addItem();
          }}
        >
          <Field
            label="Name"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            required
          />
          <Select
            label="Category"
            options={Category.options.map((c) => ({ value: c, text: cap(c) }))}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
          <Field
            label="Quantity (optional)"
            type="number"
            value={draft.quantity}
            onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
          />
          <Select
            label="Unit"
            options={UNITS}
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          />
          <Button type="submit" loading={saving}>
            Save item
          </Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      )}
      {view.status === "ready" &&
        (wide ? (
          <GroceryTable
            state={state}
            weekLabel={`week ${Number(week.slice(-2))}`}
            items={rows}
            kpis={kpis}
            locale={LOCALE}
            onToggle={(id, purchased) => void change(id, { purchased })}
            onQuantity={(id, quantity) => void change(id, { quantity })}
            onActual={(id, cents) =>
              void change(id, { actualCostCents: cents })
            }
            onRegenerate={() => void generate("regenerate")}
            onGenerate={() => void generate("create")}
            onGoToPlan={() => navigate(`/plan/${week}`)}
            onInsights={() => navigate(`/groceries/${week}/insights`)}
          />
        ) : (
          <GroceryList
            state={state}
            weekLabel={`week ${Number(week.slice(-2))}`}
            items={rows}
            locale={LOCALE}
            onToggle={(id, purchased) => void change(id, { purchased })}
            onOpen={setOpened}
            onAdd={() => setAdding(true)}
            onGenerate={() => void generate("create")}
            onGoToPlan={() => navigate(`/plan/${week}`)}
            onInsights={() => navigate(`/groceries/${week}/insights`)}
          />
        ))}
      {!wide && openedRow && (
        <div
          role="group"
          aria-label={`Details of ${openedRow.name}`}
          className={styles.form}
        >
          <MoneyField
            label={`Actual price of ${openedRow.name}`}
            value={openedRow.actualCents}
            locale={LOCALE}
            onChange={(cents) =>
              void change(openedRow.id, { actualCostCents: cents })
            }
          />
          <Button variant="ghost" onClick={() => setOpened(null)}>
            Done
          </Button>
        </div>
      )}
    </main>
  );
}
