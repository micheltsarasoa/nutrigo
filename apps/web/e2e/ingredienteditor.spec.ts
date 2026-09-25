import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// On the narrowest phone, the editor is never wider than the screen.
test("/playground/organism/ingredienteditor at 320 px has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/playground/organism/ingredienteditor");
  await expect(
    page.getByRole("heading", { level: 1, name: "Edit ingredient" }).first(),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
