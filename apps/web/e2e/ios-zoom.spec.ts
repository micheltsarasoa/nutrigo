import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW });

// iOS Safari zooms in on a focused form control whose text is under 16 px.
test("#123 every form control on every playground page is at least 16 px", async ({
  page,
}) => {
  await page.goto("/playground");
  await expect(
    page.getByRole("heading", { level: 1, name: "Playground" }),
  ).toBeVisible();
  const pages = await page
    .locator("main li a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));

  const tooSmall: string[] = [];
  for (const href of pages) {
    await page.goto(href);
    await expect(
      page.getByRole("link", { name: "All components" }),
    ).toBeVisible();
    const sizes = await page
      .locator("input:not([type=radio]):not([type=checkbox]), select, textarea")
      .evaluateAll((els) =>
        els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
    if (sizes.some((s) => s < 16)) tooSmall.push(href);
  }
  expect(tooSmall).toEqual([]);
});
