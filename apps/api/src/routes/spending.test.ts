import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { planWeek } from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

type Spending = {
  weeks: { isoWeek: string; estimatedCents: number; actualCents: number }[];
  byCategory: { category: string; cents: number }[];
};

const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  // [week, category, est, actual]
  const rows: [string, string, number | null, number | null][] = [
    ["2026-W38", "grains", 100, null],
    ["2026-W39", "grains", 200, 300],
    ["2026-W39", "dairy", 50, null],
    ["2026-W39", "others", null, null],
    ["2026-W40", "dairy", 400, 350],
  ];
  const lists = new Map<string, number>();
  for (const [week, category, est, actual] of rows) {
    if (!lists.has(week)) {
      db.insert(planWeek).values({ isoWeek: week }).run();
      lists.set(
        week,
        db.$client
          .prepare(
            "insert into shopping_list (iso_week, generated_at) values (?, 'x')",
          )
          .run(week).lastInsertRowid as number,
      );
    }
    db.$client
      .prepare(
        "insert into shopping_item (list_id, label, category, est_cost_cents, actual_cost_cents, updated_at) values (?, 'i', ?, ?, ?, 'x')",
      )
      .run(lists.get(week), category, est, actual);
  }
  const get = (q = "") => app.request(`/api/spending${q}`);
  return { get };
};

describe("GET /api/spending", () => {
  it("AC-10: estimated and actual cents per week, oldest first", async () => {
    const res = await setup().get("?weeks=8");
    expect(res.status).toBe(200);
    expect(((await res.json()) as Spending).weeks).toEqual([
      { isoWeek: "2026-W38", estimatedCents: 100, actualCents: 0 },
      { isoWeek: "2026-W39", estimatedCents: 250, actualCents: 300 },
      { isoWeek: "2026-W40", estimatedCents: 400, actualCents: 350 },
    ]);
  });

  it("totals by category use the actual price, else the estimate", async () => {
    const { byCategory } = (await (
      await setup().get("?weeks=8")
    ).json()) as Spending;
    expect(byCategory).toEqual([
      { category: "dairy", cents: 400 }, // 50 (est) + 350 (actual)
      { category: "grains", cents: 400 }, // 100 + 300
    ]);
  });

  it("keeps only the N most recent weeks", async () => {
    const body = (await (await setup().get("?weeks=2")).json()) as Spending;
    expect(body.weeks.map((w) => w.isoWeek)).toEqual(["2026-W39", "2026-W40"]);
    expect(body.byCategory.find((c) => c.category === "grains")?.cents).toBe(
      300,
    );
  });

  it("defaults to 8 weeks and is empty without lists", async () => {
    const db = freshDb();
    const res = await createApp({ db, version: "test" }).request(
      "/api/spending",
    );
    expect(await res.json()).toEqual({ weeks: [], byCategory: [] });
  });

  it("400 for weeks outside 1 to 52", async () => {
    const { get } = setup();
    for (const q of ["?weeks=0", "?weeks=53", "?weeks=x", "?weeks=1.5"])
      expect((await get(q)).status).toBe(400);
  });
});
