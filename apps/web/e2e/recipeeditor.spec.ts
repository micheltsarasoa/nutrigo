import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// AC-10: on the narrowest phone, the editor is never wider than the screen.
test("/playground/organism/recipeeditor at 320 px has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/playground/organism/recipeeditor");
  await expect(
    page.getByRole("heading", { level: 1, name: "Edit recipe" }).first(),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
