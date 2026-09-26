import { createRequire } from "node:module";
import { expect, type Locator, type Page } from "@playwright/test";

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

// SPEC-002 AC-10: every visible element in `targets` needs a >=44 px tap
// target, even if it's drawn smaller. Hit-tests 21.5 px above and below its
// centre, since a bounding-box check can't see an invisible hit area.
export async function expectTapTargets(page: Page, targets: Locator) {
  for (const element of await targets.all()) {
    if (!(await element.isVisible())) continue;
    // Centred, not just "into view": a target flush with the viewport edge
    // (e.g. the last one on the page) would put the check point off-screen,
    // where elementFromPoint always returns null.
    await element.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const box = await element.boundingBox();
    if (!box) continue;
    const name =
      (await element.getAttribute("aria-label")) ??
      (await element.textContent())?.trim() ??
      "(unnamed)";
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (const dy of [-21.5, 21.5]) {
      const hit = await element.evaluate(
        (node, [x, y]) => {
          const el = document.elementFromPoint(x, y);
          return el != null && (el === node || node.contains(el));
        },
        [cx, cy + dy] as [number, number],
      );
      expect(
        hit,
        `"${name}" needs a 44 px tap target (missed ${dy < 0 ? "above" : "below"} its centre)`,
      ).toBe(true);
    }
  }
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
