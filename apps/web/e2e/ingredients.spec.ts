import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalScroll } from "./helpers.ts";

// Runs on both projects (mobile, desktop): each gets its own API server and
// SQLite file (apps/web/playwright.config.ts), so this reset never races the
// other project's state. Recipes first: an ingredient can't be deleted while
// a recipe still uses it (AC-9).
test.beforeEach(async ({ request }) => {
  const recipes = await (await request.get("/api/recipes")).json();
  for (const recipe of recipes) {
    const res = await request.delete(`/api/recipes/${recipe.id}`);
    expect(res.ok()).toBe(true);
  }
  const ingredients = await (await request.get("/api/ingredients")).json();
  for (const ingredient of ingredients) {
    const res = await request.delete(`/api/ingredients/${ingredient.id}`);
    expect(res.ok()).toBe(true);
  }
});

const oatsBody = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  defaultUnit: "g",
};

test("SPEC-002 AC-1: adding Oats through the form shows it in the list", async ({
  page,
}) => {
  await page.goto("/ingredients");
  await expect(
    page.getByText("No ingredients yet. Add your first one."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add ingredient" }).click();
  await expect(page).toHaveURL(/\/ingredients\/new$/);

  await page.getByRole("textbox", { name: "Name" }).fill("Oats");
  await page.getByRole("combobox", { name: "Category" }).selectOption("grains");
  await page.getByRole("spinbutton", { name: "Calories" }).fill("389");
  await page.getByRole("spinbutton", { name: "Carbs" }).fill("66");
  await page.getByRole("spinbutton", { name: "Protein" }).fill("17");
  await page.getByRole("spinbutton", { name: "Fat" }).fill("7");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/ingredients$/);
  const row = page.getByRole("listitem").filter({ hasText: "Oats" });
  await expect(row).toContainText("Grains · 389 kcal / 100 g");
  await expect(row).toContainText("Manual");
});

test("SPEC-002 AC-2: invalid input shows field errors and saves nothing", async ({
  page,
  request,
}) => {
  await page.goto("/ingredients/new");
  await page.getByRole("textbox", { name: "Name" }).fill("Oats");
  await page.getByRole("combobox", { name: "Category" }).selectOption("grains");
  // Calories left empty; Fat gets a negative value.
  await page.getByRole("spinbutton", { name: "Carbs" }).fill("66");
  await page.getByRole("spinbutton", { name: "Protein" }).fill("17");
  await page.getByRole("spinbutton", { name: "Fat" }).fill("-1");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText("Enter a number, 0 or more.").first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/ingredients\/new$/);

  const res = await request.get("/api/ingredients");
  expect(await res.json()).toEqual([]);
});

test("SPEC-002 AC-9: an ingredient used by a recipe can't be deleted", async ({
  page,
  request,
}) => {
  const created = await (
    await request.post("/api/ingredients", { data: oatsBody })
  ).json();
  const recipeRes = await request.post("/api/recipes", {
    data: {
      name: "Porridge",
      mealType: "breakfast",
      servings: 2,
      ingredients: [{ ingredientId: created.id, quantity: 200, unit: "g" }],
      steps: [{ title: "Cook", body: "" }],
      tools: [],
    },
  });
  expect(recipeRes.ok()).toBe(true);

  await page.goto(`/ingredients/${created.id}`);
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("This ingredient can't be deleted.");
  await expect(alert).toContainText("Porridge");

  const check = await request.get(`/api/ingredients/${created.id}`);
  expect(check.ok()).toBe(true);
});

test("SPEC-002 AC-10 (ingredient screens): no horizontal scroll, 44 px tap targets, no axe violations", async ({
  page,
  request,
}) => {
  const created = await (
    await request.post("/api/ingredients", { data: oatsBody })
  ).json();

  for (const path of [
    "/ingredients",
    "/ingredients/new",
    `/ingredients/${created.id}`,
  ]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);

    const targets = page.locator("main a:visible, main button:visible");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await expectNoAxeViolations(page);
  }
});
