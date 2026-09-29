import { expect, test } from "@playwright/test";

// Read-only checks that also pass on a restored backup with real data: the
// restore drill runs them with `npm run test:e2e:smoke` (release.md §3).
test.describe("restore drill smoke", { tag: "@smoke" }, () => {
  test("the API is healthy and its lists answer", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(await health.json()).toMatchObject({ status: "ok", db: "ok" });
    for (const path of ["/api/recipes", "/api/ingredients", "/api/settings"]) {
      expect((await request.get(path)).ok(), path).toBe(true);
    }
  });

  test("the Recipes page loads the stored recipes without an error", async ({
    page,
  }) => {
    await page.goto("/recipes");
    // The list shows a status line until the response has been parsed.
    await expect(page.getByRole("main").getByRole("status")).toBeHidden();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
