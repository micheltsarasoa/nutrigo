import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// #144: the meal-type pill and "Health score n/10" overflowed narrow list cards.
for (const path of ["molecule/menulistitem", "organism/recipelist"]) {
  test(`#144 on /playground/${path} at 320 px, every card's top row fits inside the card`, async ({
    page,
  }) => {
    await page.goto(`/playground/${path}`);
    await expect(
      page.getByRole("link", { name: "All components" }),
    ).toBeVisible();
    const overflows = await page
      .locator("a[href='#recipe'] h3")
      .evaluateAll((titles) =>
        titles.map((h3) => {
          const top = h3.previousElementSibling as HTMLElement;
          return top.scrollWidth - top.clientWidth;
        }),
      );
    expect(overflows.length).toBeGreaterThan(0);
    expect(overflows.filter((o) => o > 0)).toEqual([]);
  });
}
