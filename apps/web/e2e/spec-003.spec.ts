import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

// Runs on the desktop project, against its API server and SQLite file. The clock is
// fixed at Wed 2026-09-30, in 2026-W40 (SPEC-003 AC-1). Plan entries first: a recipe
// can't be deleted while it is planned (AC-12), and an ingredient while a recipe uses it.
test.beforeEach(async ({ page, request }) => {
  await page.clock.install({ time: new Date("2026-09-30T12:00:00") });
  await wipe(request);
});
test.afterEach(async ({ request }) => wipe(request));

async function wipe(request: APIRequestContext) {
  for (const week of ["2026-W40", "2026-W41"]) {
    const plan = await (await request.get(`/api/plans/${week}`)).json();
    for (const day of plan.days)
      for (const entry of Object.values<{ id: number }[]>(day.slots).flat())
        await request.delete(`/api/plans/${week}/entries/${entry.id}`);
  }
  for (const r of await (await request.get("/api/recipes")).json())
    await request.delete(`/api/recipes/${r.id}`);
  for (const i of await (await request.get("/api/ingredients")).json())
    await request.delete(`/api/ingredients/${i.id}`);
}

// Porridge: 389 kcal a serving. Chicken curry: 778 kcal a serving.
async function seed(request: APIRequestContext) {
  const oats = await (
    await request.post("/api/ingredients", {
      data: {
        name: "Oats",
        category: "grains",
        kcal100g: 389,
        carbs100g: 66,
        protein100g: 17,
        fat100g: 7,
        defaultUnit: "g",
      },
    })
  ).json();
  const recipe = async (name: string, mealType: string, quantity: number) =>
    (
      await (
        await request.post("/api/recipes", {
          data: {
            name,
            mealType,
            servings: 2,
            ingredients: [{ ingredientId: oats.id, quantity, unit: "g" }],
            steps: [{ title: "Cook", body: "" }],
            tools: [],
          },
        })
      ).json()
    ).id as number;
  return {
    porridge: await recipe("Porridge", "breakfast", 200),
    curry: await recipe("Chicken curry", "dinner", 400),
  };
}

const plan = (
  request: APIRequestContext,
  week: string,
  data: { date: string; slot: string; recipeId: number; servings: number },
) => request.post(`/api/plans/${week}/entries`, { data });

const card = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(name) });

test("SPEC-003 AC-1: /plan goes to the current week and highlights today", async ({
  page,
}) => {
  await page.goto("/plan");
  await expect(page).toHaveURL(/\/plan\/2026-W40$/);
  await expect(page.getByText("Sep 28 – Oct 4, 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Wed\s?30/ })).toHaveAttribute(
    "aria-current",
    "date",
  );
  await expectNoAxeViolations(page);
});

test("SPEC-003 AC-2: next week changes the URL and the label", async ({
  page,
}) => {
  await page.goto("/plan/2026-W40");
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page).toHaveURL(/\/plan\/2026-W41$/);
  await expect(page.getByText("Oct 5 – 11, 2026")).toBeVisible();
});

test("SPEC-003 AC-3: adding a recipe to Tue lunch shows its card with 1 serving", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/plan/2026-W40");
  await page.getByRole("button", { name: "Add lunch on Tue" }).click();
  await page.getByRole("button", { name: /Chicken curry/ }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(card(page, "Chicken curry")).toContainText("778 kcal");
  await expect(
    page.getByRole("button", { name: "Add lunch on Tue" }),
  ).toHaveCount(0);
});

test("SPEC-003 AC-4: changing servings to 2 doubles the kcal", async ({
  page,
  request,
}) => {
  const { curry } = await seed(request);
  await plan(request, "2026-W40", {
    date: "2026-09-29",
    slot: "lunch",
    recipeId: curry,
    servings: 1,
  });
  await page.goto("/plan/2026-W40");
  await card(page, "Chicken curry").click();
  await page.getByRole("button", { name: "Change servings" }).click();
  await page.getByRole("button", { name: "Increase Servings" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(card(page, "Chicken curry")).toContainText(
    `${new Intl.NumberFormat("fr-FR").format(1556)} kcal`,
  );
});

test("SPEC-003 AC-5: moving a meal to Thu dinner empties the old slot", async ({
  page,
  request,
}) => {
  const { curry } = await seed(request);
  await plan(request, "2026-W40", {
    date: "2026-09-29",
    slot: "lunch",
    recipeId: curry,
    servings: 1,
  });
  await page.goto("/plan/2026-W40");
  await card(page, "Chicken curry").click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await page.getByLabel("Day").selectOption({ label: "Thu 1" });
  await page.getByLabel("Slot").selectOption("dinner");
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add lunch on Tue" }),
  ).toBeVisible();
  await expect(card(page, "Chicken curry")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Add dinner on Thu" }),
  ).toHaveCount(0);
});

test("SPEC-003 AC-6: removing a meal after confirming shows + again", async ({
  page,
  request,
}) => {
  const { curry } = await seed(request);
  await plan(request, "2026-W40", {
    date: "2026-09-29",
    slot: "lunch",
    recipeId: curry,
    servings: 1,
  });
  await page.goto("/plan/2026-W40");
  await card(page, "Chicken curry").click();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(
    page.getByText(/Remove Chicken curry from Tue 29/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add lunch on Tue" }),
  ).toBeVisible();
});

test("SPEC-003 AC-7: copying the previous week fills an empty week", async ({
  page,
  request,
}) => {
  const { curry } = await seed(request);
  await plan(request, "2026-W40", {
    date: "2026-09-29",
    slot: "lunch",
    recipeId: curry,
    servings: 1,
  });
  await page.goto("/plan/2026-W41");
  await page.getByRole("button", { name: "Copy previous week" }).click();
  await expect(card(page, "Chicken curry")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add lunch on Tue" }),
  ).toHaveCount(0);
});

test("SPEC-003 AC-8: a week with meals asks replace or merge; Cancel changes nothing", async ({
  page,
  request,
}) => {
  const { curry, porridge } = await seed(request);
  await plan(request, "2026-W40", {
    date: "2026-09-29",
    slot: "lunch",
    recipeId: curry,
    servings: 1,
  });
  await plan(request, "2026-W41", {
    date: "2026-10-06",
    slot: "breakfast",
    recipeId: porridge,
    servings: 1,
  });
  await page.goto("/plan/2026-W41");
  await page.getByRole("button", { name: "Copy previous week" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(card(page, "Chicken curry")).toHaveCount(0);
  await page.getByRole("button", { name: "Copy previous week" }).click();
  await page.getByRole("button", { name: "Merge" }).click();
  await expect(card(page, "Chicken curry")).toBeVisible();
  await expect(card(page, "Porridge")).toBeVisible();
});

test("SPEC-003 AC-9: a slot with 2 recipes stacks both cards", async ({
  page,
  request,
}) => {
  const { curry, porridge } = await seed(request);
  for (const recipeId of [curry, porridge])
    await plan(request, "2026-W40", {
      date: "2026-09-29",
      slot: "lunch",
      recipeId,
      servings: 1,
    });
  await page.goto("/plan/2026-W40");
  const cards = page.getByRole("button", { name: /Chicken curry|Porridge/ });
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Chicken curry");
  await expect(cards.last()).toContainText("Porridge");
});

test("SPEC-003 AC-11: the keyboard alone adds a meal to a slot", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/plan/2026-W40");
  const focused = (name: string) =>
    page.evaluate(
      (n) => document.activeElement?.getAttribute("aria-label") === n,
      name,
    );
  for (let i = 0; i < 80 && !(await focused("Add lunch on Tue")); i++)
    await page.keyboard.press("Tab");
  expect(await focused("Add lunch on Tue")).toBe(true);
  await page.keyboard.press("Enter");
  await page.keyboard.type("Chicken");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  const onAdd = () =>
    page.evaluate(() => document.activeElement?.textContent?.trim() === "Add");
  for (let i = 0; i < 6 && !(await onAdd()); i++)
    await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(card(page, "Chicken curry")).toBeVisible();
});
