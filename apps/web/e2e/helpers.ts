import { createRequire } from "node:module";
import { expect, type Page } from "@playwright/test";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

// Same options as src/axe.ts: every rule except color-contrast (ADR-0008).
export async function expectNoAxeViolations(page: Page) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return (
      await axe.run(document, {
        rules: { "color-contrast": { enabled: false } },
      })
    ).violations;
  });
  expect(violations).toEqual([]);
}

// SPEC-001 AC-9: nothing wider than the viewport.
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
