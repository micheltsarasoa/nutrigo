import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

test("SPEC-001 shell: the built app serves the NutriGo page with no axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "NutriGo" }),
  ).toBeVisible();

  await page.addScriptTag({ path: axePath });
  // Same options as src/axe.ts: every rule except color-contrast (ADR-0008).
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return (
      await axe.run(document, {
        rules: { "color-contrast": { enabled: false } },
      })
    ).violations;
  });
  expect(violations).toEqual([]);
});
