import { expect, test } from "@playwright/test";

test("#15 Poppins is self-hosted: the page renders in Poppins and never calls Google Fonts", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(req.url()))
      external.push(req.url());
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const used = await page.evaluate(() => ({
    family: getComputedStyle(document.body).fontFamily,
    loaded: [...document.fonts].filter(
      (f) =>
        f.family.replaceAll('"', "") === "Poppins" && f.status === "loaded",
    ).length,
  }));
  expect(used.family).toMatch(/^"?Poppins"?,/);
  expect(used.loaded).toBeGreaterThan(0);
  expect(external).toEqual([]);
});
