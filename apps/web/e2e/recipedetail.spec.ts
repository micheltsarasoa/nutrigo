import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// Replaces the playground's "320 px" frame: on the narrowest phone, nothing in the
// recipe is wider than the screen.
test("/playground/organism/recipedetail at 320 px has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/playground/organism/recipedetail");
  await expect(
    page.getByRole("heading", { level: 1, name: /Grilled turkey/ }).first(),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
