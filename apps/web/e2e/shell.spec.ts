import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

test("SPEC-001 shell: the built app serves the Today page with no axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Today" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("SPEC-001 AC-10: the bottom tab bar switches to the sidebar at 1200 px", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Main" });
  const lockup = page.getByText("NutriGo", { exact: true });

  await page.setViewportSize({ width: 1199, height: 800 });
  await page.goto("/");
  await expect(nav.getByRole("link")).toHaveCount(5);
  await expect(lockup).toBeHidden();
  const bar = (await nav.boundingBox())!;
  expect(bar.y + bar.height).toBeGreaterThan(700);

  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(lockup).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(5);
  expect((await nav.boundingBox())!.x).toBeLessThan(300);

  await page.setViewportSize({ width: 1199, height: 800 });
  await expect(lockup).toBeHidden();
});

test("ADR-0012: a tab changes the page without reloading, and Back returns", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => ((window as { loaded?: 1 }).loaded = 1));

  await page.getByRole("link", { name: "Recipes" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Recipes" }),
  ).toBeVisible();
  await expect(page).toHaveURL("/recipes");
  expect(await page.evaluate(() => (window as { loaded?: 1 }).loaded)).toBe(1);
  await expect(page.getByRole("link", { name: "Recipes" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Today" }),
  ).toBeVisible();
});

test("ADR-0012: a deep link opens its page, and an unknown path shows Page not found", async ({
  page,
}) => {
  await page.goto("/plan/2026-W40");
  await expect(
    page.getByRole("heading", { level: 1, name: "Plan" }),
  ).toBeVisible();
  await page.goto("/nope");
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

test("SPEC-001 AC-4: a production build has no playground", async ({
  page,
}) => {
  const scripts: Promise<string>[] = [];
  page.on("response", (res) => {
    if (res.url().endsWith(".js")) scripts.push(res.text());
  });

  await page.goto("/playground");

  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  const code = (await Promise.all(scripts)).join("\n");
  expect(code).not.toContain("No components yet");
  expect(code).not.toContain("playground-page");
});
