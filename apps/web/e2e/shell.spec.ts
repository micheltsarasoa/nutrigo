import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

test("SPEC-001 shell: the built app serves the NutriGo page with no axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "NutriGo" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
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
