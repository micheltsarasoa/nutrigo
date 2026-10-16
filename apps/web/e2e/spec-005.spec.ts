import { type APIRequestContext, expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectTapTargets } from "./helpers.ts";

// SPEC-005 AC-1 to AC-11 on the desktop project (its own API server and SQLite file). The pages
// open 2026-W40 by URL, so the clock stays real: a faked past clock would make every edit older
// than the server's updated_at and lose last-write-wins. Offline cases use context.setOffline.
const W = "2026-W40";
const LIST = `/api/shopping-lists/${W}`;
const MONDAYS = (n: number) =>
  new Date(Date.UTC(2026, 8, 28) - n * 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

test.beforeEach(async ({ request }) => {
  await wipe(request);
});
test.afterEach(async ({ request }) => wipe(request));

async function wipe(request: APIRequestContext) {
  // Lists and plans of the 8 weeks, then recipes and ingredients.
  for (let n = 0; n < 8; n++) {
    const week = isoWeekOfMonday(n);
    const plan = await (await request.get(`/api/plans/${week}`)).json();
    for (const day of plan.days)
      for (const entry of Object.values<{ id: number }[]>(day.slots).flat())
        await request.delete(`/api/plans/${week}/entries/${entry.id}`);
    const list = await request.get(`/api/shopping-lists/${week}`);
    if (list.ok())
      for (const item of (await list.json()).items)
        await request.delete(`/api/shopping-lists/${week}/items/${item.id}`);
  }
  for (const r of await (await request.get("/api/recipes")).json())
    await request.delete(`/api/recipes/${r.id}`);
  for (const i of await (await request.get("/api/ingredients")).json())
    await request.delete(`/api/ingredients/${i.id}`);
}
const isoWeekOfMonday = (n: number) =>
  `2026-W${String(40 - n).padStart(2, "0")}`;

const ingredient = async (request: APIRequestContext, data: object) =>
  (await (await request.post("/api/ingredients", { data })).json()) as {
    id: number;
  };
const base = {
  kcal100g: 380,
  carbs100g: 60,
  protein100g: 12,
  fat100g: 7,
  defaultUnit: "g",
};
async function recipe(
  request: APIRequestContext,
  name: string,
  lines: [number, number][],
  date: string,
  week = W,
) {
  const r = await (
    await request.post("/api/recipes", {
      data: {
        name,
        mealType: "dinner",
        servings: 1,
        ingredients: lines.map(([ingredientId, quantity]) => ({
          ingredientId,
          quantity,
          unit: "g",
        })),
        steps: [{ title: "Cook", body: "" }],
        tools: [],
      },
    })
  ).json();
  await request.post(`/api/plans/${week}/entries`, {
    data: { date, slot: "dinner", recipeId: r.id, servings: 1 },
  });
  return r as { id: number };
}

// Oats in 3 recipes (60 + 80 + 40 g), priced €1.20 per 500 g; Rice has no price.
async function seed(request: APIRequestContext) {
  const oats = await ingredient(request, {
    ...base,
    name: "Oats",
    category: "grains",
    priceCents: 120,
    pricePackQty: 500,
    pricePackUnit: "g",
  });
  const rice = await ingredient(request, {
    ...base,
    name: "Rice",
    category: "grains",
  });
  await recipe(request, "Porridge", [[oats.id, 60]], "2026-09-28");
  await recipe(request, "Granola", [[oats.id, 80]], "2026-09-29");
  await recipe(
    request,
    "Flapjack",
    [
      [oats.id, 40],
      [rice.id, 100],
    ],
    "2026-09-30",
  );
  return { oats, rice };
}

// A list from an earlier run may still exist (items are wiped, the list row stays).
const generate = async (page: import("@playwright/test").Page) => {
  await page.goto(`/groceries/${W}`);
  const first = page.getByRole("button", { name: "Generate list" });
  const again = page.getByRole("button", { name: "Regenerate" });
  await expect(first.or(again)).toBeVisible();
  await ((await first.isVisible()) ? first : again).click();
  await expect(page.getByLabel("Mark Oats as bought")).toBeVisible();
};

test("SPEC-005 AC-1, AC-3, AC-4: merged quantity, priced estimate, excluded items", async ({
  page,
  request,
}) => {
  await seed(request);
  await generate(page);
  await expect(
    page.getByRole("spinbutton", { name: "Quantity of Oats" }),
  ).toHaveText("180");
  await expect(page.getByText("~€1.20").first()).toBeVisible();
  await expect(page.getByText("Estimate excludes 1 item")).toBeVisible();
  await expectNoAxeViolations(page);
  await expect(page).toHaveScreenshot("groceries-1280.png", { fullPage: true });
});

test("SPEC-005 AC-5: regenerate keeps ticks and manual items", async ({
  page,
  request,
}) => {
  const { oats } = await seed(request);
  await generate(page);
  await page.getByLabel("Mark Oats as bought").click();
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByLabel("Name").fill("Tape");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Tape")).toBeVisible();
  await recipe(request, "Muesli", [[oats.id, 20]], "2026-10-01");
  await page.getByRole("button", { name: "Regenerate" }).click();
  await expect(page.getByText("200 g")).toBeVisible();
  await expect(page.getByLabel("Mark Oats as not bought")).toBeVisible();
  await expect(page.getByText("Tape")).toBeVisible();
});

test("SPEC-005 AC-9: the actual price is kept", async ({ page, request }) => {
  await seed(request);
  await generate(page);
  await page.getByLabel("Mark Oats as bought").click();
  await page.getByLabel("Actual price of Oats").fill("3,00");
  await page.getByLabel("Actual price of Oats").blur();
  await expect
    .poll(async () => (await (await request.get(LIST)).json()).actualCents)
    .toBe(300);
  await page.reload();
  await expect(page.getByLabel("Actual price of Oats")).toHaveValue(/3[.,]00/);
  const list = await (await request.get(LIST)).json();
  expect(list.actualCents).toBe(300);
});

test("SPEC-005 AC-6, AC-7: offline changes show at once and sync when back online", async ({
  page,
  request,
  context,
}) => {
  await seed(request);
  await generate(page);
  await context.setOffline(true);
  await page.getByLabel("Mark Oats as bought").click();
  await page.getByLabel("Mark Rice as bought").click();
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByLabel("Name").fill("Tape");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Offline · 3 changes pending")).toBeVisible();
  await expect(page.getByLabel("Mark Oats as not bought")).toBeVisible();

  await context.setOffline(false);
  await expect
    .poll(async () =>
      (await (await request.get(LIST)).json()).items.map(
        (i: { label: string }) => i.label,
      ),
    )
    .toContain("Tape");
  await expect(page.getByRole("status")).toBeHidden();
  const list = await (await request.get(LIST)).json();
  const bought = list.items.filter(
    (i: { purchasedAt: string | null }) => i.purchasedAt,
  );
  expect(bought).toHaveLength(2);
});

test("SPEC-005 AC-8: the latest edit wins after an offline conflict", async ({
  page,
  request,
  context,
}) => {
  await seed(request);
  await generate(page);
  const list = await (await request.get(LIST)).json();
  const oats = list.items.find((i: { label: string }) => i.label === "Oats");
  await context.setOffline(true);
  await page.getByLabel("Mark Oats as bought").click();
  await expect(page.getByText("Offline · 1 change pending")).toBeVisible();
  // The laptop edits the same item later (updated_at in the future wins).
  await request.patch(`${LIST}/items`, {
    data: [
      {
        id: oats.id,
        patch: { actualCostCents: 250 },
        updatedAt: "2099-01-01T00:00:00.000Z",
      },
    ],
  });
  await context.setOffline(false);
  await expect(page.getByRole("status")).toBeHidden();
  const after = await (await request.get(LIST)).json();
  const item = after.items.find((i: { label: string }) => i.label === "Oats");
  expect(item.purchasedAt).toBeNull();
  expect(item.actualCostCents).toBe(250);
});

test("SPEC-005 AC-10: insights show the weekly spend and the category donut", async ({
  page,
  request,
}) => {
  const oats = await ingredient(request, {
    ...base,
    name: "Oats",
    category: "grains",
    priceCents: 120,
    pricePackQty: 500,
    pricePackUnit: "g",
  });
  for (let n = 7; n >= 0; n--) {
    const week = isoWeekOfMonday(n);
    await recipe(
      request,
      `Porridge ${week}`,
      [[oats.id, 60 + n * 10]],
      MONDAYS(n),
      week,
    );
    await request.post(`/api/shopping-lists/${week}/generate`, {
      data: { mode: "regenerate" },
    });
  }
  await page.goto(`/groceries/${W}/insights`);
  await expect(
    page.getByRole("img", { name: /Weekly grocery spend/ }),
  ).toBeVisible();
  await expect(page.getByTestId("column")).toHaveCount(8);
  await expect(page.getByText("Grains")).toBeVisible();
  await page.getByRole("button", { name: "Table" }).first().click();
  await expect(
    page.getByRole("table", { name: "Spend per week" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("SPEC-005 AC-11: the phone list is grouped, has progress and a sticky Add item", async ({
  page,
  request,
}) => {
  await seed(request);
  await request.post(`${LIST}/generate`, { data: { mode: "regenerate" } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/groceries/${W}`);
  await expect(page.getByText("0 of 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Grains/i })).toBeVisible();
  // The checkbox sits in a 44 px label (Checkbox atom); that label is the tap target.
  await expectTapTargets(
    page,
    page.locator("label").filter({ has: page.getByRole("checkbox") }),
  );
  const add = page.getByRole("button", { name: "Add item" });
  await expect(add).toBeVisible();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(add).toBeInViewport();
  await expectNoAxeViolations(page);
  await expect(page).toHaveScreenshot("groceries-390.png", { fullPage: true });
});
