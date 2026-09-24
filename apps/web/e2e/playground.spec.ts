import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";
import { expectNoAxeViolations, expectNoHorizontalScroll } from "./helpers.ts";

test.use({ baseURL: PREVIEW });

test("SPEC-001 AC-3 + AC-9: the preview build serves the playground index, fitting the screen, with no axe violations", async ({
  page,
}) => {
  await page.goto("/playground");
  await expect(
    page.getByRole("heading", { level: 1, name: "Playground" }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);
});

test("SPEC-001 AC-9: every component page fits the screen with no axe violations", async ({
  page,
}) => {
  await page.goto("/playground");
  // The playground is a lazy chunk: wait for it to render before reading the links.
  await expect(
    page.getByRole("heading", { level: 1, name: "Playground" }),
  ).toBeVisible();
  const pages = await page
    .locator("main li a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  expect(pages.length).toBeGreaterThan(0);

  for (const href of pages) {
    await page.goto(href);
    await expect(
      page.getByRole("link", { name: "All components" }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  }
});

// Playground pages the owner approved (label design-approved) are the visual baselines.
// Add a page here after approval; CI writes the missing Linux baseline on the first run (see docs/testing/strategy.md).
const APPROVED = [
  "atom/card",
  "atom/icon",
  "atom/logo",
  "atom/button",
  "atom/pill",
  "atom/iconbadge",
  "atom/searchfield",
];

for (const slug of APPROVED) {
  test(`visual: /playground/${slug} matches its approved baseline`, async ({
    page,
  }) => {
    await page.goto(`/playground/${slug}`);
    await expect(
      page.getByRole("link", { name: "All components" }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot(`${slug.replace("/", "-")}.png`, {
      fullPage: true,
    });
  });
}
