import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

// v1.0.0 hardening (#263): axe over every route, at the desktop and the phone width, with one
// recipe and one shopping list behind the id routes. The list/insights data comes from SPEC-005.

let recipeId: number;
test.beforeAll(async ({ request }) => {
  const oats = await (
    await request.post("/api/ingredients", {
      data: {
        name: "Axe oats",
        category: "grains",
        kcal100g: 380,
        carbs100g: 60,
        protein100g: 12,
        fat100g: 7,
        defaultUnit: "g",
        priceCents: 120,
        pricePackQty: 500,
        pricePackUnit: "g",
      },
    })
  ).json();
  const recipe = await (
    await request.post("/api/recipes", {
      data: {
        name: "Axe porridge",
        mealType: "breakfast",
        servings: 1,
        ingredients: [{ ingredientId: oats.id, quantity: 60, unit: "g" }],
        steps: [{ title: "Cook", body: "" }],
        tools: [],
      },
    })
  ).json();
  recipeId = recipe.id;
  await request.post("/api/plans/2026-W40/entries", {
    data: {
      date: "2026-09-28",
      slot: "breakfast",
      recipeId,
      servings: 1,
    },
  });
  await request.post("/api/shopping-lists/2026-W40/generate", {
    data: { mode: "regenerate" },
  });
});

// The shared e2e DB must be left as found: items point at ingredients, so they go first.
test.afterAll(async ({ request }) => {
  const plan = await (await request.get("/api/plans/2026-W40")).json();
  for (const day of plan.days)
    for (const entry of Object.values<{ id: number }[]>(day.slots).flat())
      await request.delete(`/api/plans/2026-W40/entries/${entry.id}`);
  const list = await (await request.get("/api/shopping-lists/2026-W40")).json();
  for (const item of list.items ?? [])
    await request.delete(`/api/shopping-lists/2026-W40/items/${item.id}`);
  await request.delete(`/api/recipes/${recipeId}`);
  for (const i of await (await request.get("/api/ingredients")).json())
    await request.delete(`/api/ingredients/${i.id}`);
});

const routes = [
  "/",
  "/recipes",
  "/recipes/new",
  "/recipes/:id",
  "/recipes/:id/edit",
  "/ingredients",
  "/ingredients/new",
  "/plan/2026-W40",
  "/targets",
  "/groceries/2026-W40",
  "/groceries/2026-W40/insights",
  "/does-not-exist",
];

for (const [name, size] of [
  ["1280", { width: 1280, height: 800 }],
  ["390", { width: 390, height: 844 }],
] as const) {
  for (const route of routes) {
    test(`axe: ${route} at ${name} px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(route.replace(":id", String(recipeId)));
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("main").getByRole("status")).toBeHidden();
      await expectNoAxeViolations(page);
    });
  }
}
