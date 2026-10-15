import { type APIRequestContext, expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

// SPEC-004 AC-1 to AC-6, AC-8, AC-11 on the desktop project. The browser clock is fixed at
// Wed 2026-09-30 12:00 (2026-W40). The API server runs on the real clock, so the page takes
// "today", the next meal and past days from the browser; the API only does the sums.
test.beforeEach(async ({ page, request }) => {
  await page.clock.install({ time: new Date("2026-09-30T12:00:00") });
  await wipe(request);
});
test.afterEach(async ({ request }) => wipe(request));

async function wipe(request: APIRequestContext) {
  const plan = await (await request.get("/api/plans/2026-W40")).json();
  for (const day of plan.days)
    for (const entry of Object.values<{ id: number }[]>(day.slots).flat())
      await request.delete(`/api/plans/2026-W40/entries/${entry.id}`);
  for (const r of await (await request.get("/api/recipes")).json())
    await request.delete(`/api/recipes/${r.id}`);
  for (const i of await (await request.get("/api/ingredients")).json())
    await request.delete(`/api/ingredients/${i.id}`);
}

// Rice: 100 kcal, 10 g carbs, 5 g protein, 2 g fat per 100 g, so a recipe of N g is N kcal.
async function seed(request: APIRequestContext) {
  const rice = await (
    await request.post("/api/ingredients", {
      data: {
        name: "Rice",
        category: "grains",
        kcal100g: 100,
        carbs100g: 10,
        protein100g: 5,
        fat100g: 2,
        defaultUnit: "g",
      },
    })
  ).json();
  const meals = [
    ["Porridge", "breakfast", 300, "2026-09-30"],
    ["Chicken curry", "lunch", 450, "2026-09-30"],
    ["Apple", "snack", 200, "2026-09-30"],
    ["Lasagne", "dinner", 1200, "2026-09-30"],
    ["Feast", "dinner", 1800, "2026-09-29"],
  ] as const;
  for (const [name, mealType, grams, date] of meals) {
    const recipe = await (
      await request.post("/api/recipes", {
        data: {
          name,
          mealType,
          servings: 1,
          ingredients: [{ ingredientId: rice.id, quantity: grams, unit: "g" }],
          steps: [{ title: "Cook", body: "" }],
          tools: [],
        },
      })
    ).json();
    const entry = await (
      await request.post("/api/plans/2026-W40/entries", {
        data: { date, slot: mealType, recipeId: recipe.id, servings: 1 },
      })
    ).json();
    // Tuesday was eaten (the API only refuses days after its own today).
    if (date === "2026-09-29")
      await request.post(`/api/plans/2026-W40/entries/${entry.id}/eaten`);
  }
  await request.put("/api/targets", {
    data: { kcal: 2990, carbs: 325, protein: 75, fat: 44 },
  });
}

const ring = (page: import("@playwright/test").Page, label: string) =>
  page.getByRole("img", { name: label });
const check = (page: import("@playwright/test").Page, slot: string) =>
  page.getByRole("checkbox", { name: new RegExp(slot, "i") });

test("SPEC-004 AC-1: the ring shows 0 eaten of 2990 and 2150 planned", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/");
  await expect(ring(page, "0 kcal of 2990")).toBeVisible();
  await expect(page.getByText("2150 kcal planned")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("SPEC-004 AC-2 and AC-4: tick Breakfast, then untick it", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/");
  await check(page, "breakfast").click();
  await page.getByRole("button", { name: "Mark as eaten" }).click();
  await expect(ring(page, "300 kcal of 2990")).toBeVisible();
  await expect(check(page, "breakfast")).toBeChecked();
  await expect(
    page.getByRole("progressbar", { name: "Carbs" }),
  ).toHaveAttribute("aria-valuenow", "30");
  await check(page, "breakfast").click();
  await expect(ring(page, "0 kcal of 2990")).toBeVisible();
  await expect(check(page, "breakfast")).not.toBeChecked();
});

test("SPEC-004 AC-3: tick Lunch with 1.5 servings adds 675 kcal", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/");
  await check(page, "lunch").click();
  await page.getByRole("button", { name: "Increase Servings eaten" }).click();
  await page.getByRole("button", { name: "Mark as eaten" }).click();
  await expect(ring(page, "675 kcal of 2990")).toBeVisible();
});

test("SPEC-004 AC-5: over the target shows the full orange ring and +N kcal over", async ({
  page,
  request,
}) => {
  await seed(request);
  await request.put("/api/targets", {
    data: { kcal: 100, carbs: 325, protein: 75, fat: 44 },
  });
  await page.goto("/");
  await check(page, "breakfast").click();
  await page.getByRole("button", { name: "Mark as eaten" }).click();
  await expect(page.getByText("+200 kcal over ▲")).toBeVisible();
});

test("SPEC-004 AC-6: without targets, totals and a link to /targets", async ({
  page,
  request,
}) => {
  await seed(request);
  // The API has no way to clear the targets, so the page gets replies without them.
  await page.route("**/api/nutrition/**", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.target = null;
    for (const m of Object.values<{ target: unknown }>(body.macros ?? {}))
      m.target = null;
    await route.fulfill({ response: res, json: body });
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Set targets" }).waitFor();
  await expect(page.getByRole("img", { name: /kcal/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Set targets" })).toHaveAttribute(
    "href",
    "/targets",
  );
});

test("SPEC-004 AC-8: the week trend shows Tue eaten and Wed planned", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/");
  await page.getByRole("button", { name: "Table" }).click();
  await expect(page.getByRole("row", { name: /^Tue/ })).toContainText(
    "1800Eaten",
  );
  await expect(page.getByRole("row", { name: /^Wed/ })).toContainText(
    "2150Planned",
  );
});

test("SPEC-004 AC-11: the next unticked meal after 12:00 is outlined", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.goto("/");
  await expect(page.getByText("Lunch · next")).toBeVisible();
  await expect(page.getByText("Breakfast · next")).toHaveCount(0);
});
