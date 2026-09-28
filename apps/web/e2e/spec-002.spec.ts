import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  expectTapTargets,
} from "./helpers.ts";

// Runs on the desktop project, against its API server and SQLite file
// (apps/web/playwright.config.ts). Every SPEC-002 test lives in this one file:
// files run in parallel, and each test here wipes the shared database.
// Recipes first: an ingredient can't be deleted while a recipe uses it (AC-9).
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
  await page.setViewportSize({ width: 390, height: 844 });
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
    expect(await targets.count()).toBeGreaterThan(0);
    await expectTapTargets(page, targets);

    await expectNoAxeViolations(page);
  }
});

const ingredient = (
  name: string,
  category: string,
  [kcal100g, carbs100g, protein100g, fat100g]: number[],
) => ({
  name,
  category,
  kcal100g,
  carbs100g,
  protein100g,
  fat100g,
  defaultUnit: "g",
});

test("SPEC-002 AC-3: a recipe made in the editor is saved under its meal type, with nutrition per serving", async ({
  page,
  request,
}) => {
  // Turkey as in the nutritionPerServing unit test, plus rice and asparagus.
  for (const body of [
    ingredient("Turkey", "protein", [135, 0, 30, 1]),
    ingredient("Rice", "grains", [130, 28, 2.7, 0.3]),
    ingredient("Asparagus", "veggies", [20, 3.9, 2.2, 0.1]),
  ]) {
    const res = await request.post("/api/ingredients", { data: body });
    expect(res.ok()).toBe(true);
  }

  await page.goto("/recipes/new");
  await page.getByRole("textbox", { name: "Name" }).fill("Turkey rice bowl");
  await page.getByRole("combobox", { name: "Meal type" }).selectOption("lunch");
  await page.getByRole("button", { name: "Increase Servings" }).click();
  for (const [name, quantity] of [
    ["Turkey", "200"],
    ["Rice", "150"],
    ["Asparagus", "100"],
  ] as const) {
    await page.getByRole("button", { name: "Add ingredient" }).click();
    await page
      .getByRole("combobox", { name: "Ingredient" })
      .last()
      .selectOption({ label: name });
    await page
      .getByRole("spinbutton", { name: "Quantity" })
      .last()
      .fill(quantity);
  }
  for (const title of ["Cook the rice", "Sear the turkey"]) {
    await page.getByRole("button", { name: "Add step" }).click();
    await page.getByRole("textbox", { name: "Title" }).last().fill(title);
  }
  await page.getByRole("button", { name: "Save" }).click();

  // The detail page (#75) comes later, so the API is checked.
  await expect(page).toHaveURL(/\/recipes\/\d+$/);
  const id = new URL(page.url()).pathname.split("/").pop();
  const lunch = await (await request.get("/api/recipes?mealType=lunch")).json();
  expect(lunch.map((r: { name: string }) => r.name)).toEqual([
    "Turkey rice bowl",
  ]);
  const dinner = await (
    await request.get("/api/recipes?mealType=dinner")
  ).json();
  expect(dinner).toEqual([]);

  const recipe = await (await request.get(`/api/recipes/${id}`)).json();
  expect(recipe.servings).toBe(2);
  expect(recipe.ingredients).toHaveLength(3);
  expect(recipe.steps.map((s: { title: string }) => s.title)).toEqual([
    "Cook the rice",
    "Sear the turkey",
  ]);
  // Σ(grams × per 100 g ÷ 100) ÷ 2 servings.
  const n = recipe.nutritionPerServing;
  expect(n.kcal).toBeCloseTo((270 + 195 + 20) / 2);
  expect(n.carbs).toBeCloseTo((0 + 42 + 3.9) / 2);
  expect(n.protein).toBeCloseTo((60 + 4.05 + 2.2) / 2);
  expect(n.fat).toBeCloseTo((2 + 0.45 + 0.1) / 2);
});

test("SPEC-002 AC-10 (recipe editor): no horizontal scroll, 44 px tap targets, no axe violations", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const oats = await (
    await request.post("/api/ingredients", { data: oatsBody })
  ).json();
  const recipe = await (
    await request.post("/api/recipes", {
      data: {
        name: "Porridge",
        mealType: "breakfast",
        servings: 2,
        ingredients: [{ ingredientId: oats.id, quantity: 80, unit: "g" }],
        steps: [{ title: "Cook", body: "Simmer 5 min" }],
        tools: [{ name: "Pot" }],
      },
    })
  ).json();

  for (const [path, title] of [
    ["/recipes/new", "New recipe"],
    [`/recipes/${recipe.id}/edit`, "Edit recipe"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expectNoHorizontalScroll(page);
    await expectTapTargets(
      page,
      page.locator("main a:visible, main button:visible"),
    );
    await expectNoAxeViolations(page);
  }
});

// Ten recipes, three of them with "chick" in the name in different cases.
const LIBRARY = [
  ["Chicken curry", "dinner"],
  ["Grilled CHICKEN salad", "lunch"],
  ["Spiced chickpea stew", "lunch"],
  ["Porridge", "breakfast"],
  ["Overnight oats", "breakfast"],
  ["Turkey rice bowl", "lunch"],
  ["Salmon poke bowl", "dinner"],
  ["Apple and peanut butter", "snack"],
  ["Greek yoghurt", "snack"],
  ["Lentil soup", "dinner"],
] as const;

const seedLibrary = async (request: APIRequestContext) => {
  for (const [name, mealType] of LIBRARY) {
    const res = await request.post("/api/recipes", {
      data: {
        name,
        mealType,
        servings: 1,
        ingredients: [],
        steps: [],
        tools: [],
      },
    });
    expect(res.ok()).toBe(true);
  }
};

const cards = (page: Page) => page.getByRole("main").getByRole("listitem");
// FilterTabs and Segmented hide the native radio under its label: click the label.
const pick = (page: Page, name: string) =>
  page.getByRole("radio", { name }).locator("..").click();

test('SPEC-002 AC-4: searching "chick" shows only the names containing it, in any case', async ({
  page,
  request,
}) => {
  await seedLibrary(request);
  await page.goto("/recipes");
  await expect(cards(page)).toHaveCount(10);

  await page.getByRole("searchbox", { name: "Search recipes" }).fill("chick");
  await expect(cards(page)).toHaveCount(3);
  for (const name of [
    "Chicken curry",
    "Grilled CHICKEN salad",
    "Spiced chickpea stew",
  ]) {
    await expect(cards(page).filter({ hasText: name })).toHaveCount(1);
  }
});

test("SPEC-002 AC-5: the Lunch tab shows only lunch recipes; All restores the list", async ({
  page,
  request,
}) => {
  await seedLibrary(request);
  await page.goto("/recipes");
  await expect(cards(page)).toHaveCount(10);

  await pick(page, "Lunch");
  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).filter({ hasText: "Lunch" })).toHaveCount(3);

  await pick(page, "All");
  await expect(cards(page)).toHaveCount(10);
});

test("SPEC-002 AC-7: switching to the grid changes the layout and is remembered after a reload", async ({
  page,
  request,
}) => {
  await seedLibrary(request);
  await page.goto("/recipes");
  await expect(cards(page)).toHaveCount(10);
  const topOf = async (i: number) =>
    (await cards(page).nth(i).boundingBox())!.y;

  // List: one card per row. Grid: two side by side on a desktop screen.
  expect(await topOf(1)).toBeGreaterThan(await topOf(0));
  await pick(page, "Grid view");
  await expect.poll(async () => (await topOf(1)) - (await topOf(0))).toBe(0);

  await page.reload();
  await expect(page.getByRole("radio", { name: "Grid view" })).toBeChecked();
  await expect(cards(page)).toHaveCount(10);
  expect(await topOf(1)).toBe(await topOf(0));
});

test("SPEC-002 AC-10 (recipe list): no horizontal scroll, 44 px tap targets, no axe violations", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // The empty library, then the list.
  await page.goto("/recipes");
  await expect(page.getByText("No recipes yet")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);

  await seedLibrary(request);
  await page.reload();
  await expect(cards(page)).toHaveCount(10);
  await expectNoHorizontalScroll(page);
  await expectTapTargets(
    page,
    page.locator("main a:visible, main button:visible"),
  );
  await expectNoAxeViolations(page);
});
