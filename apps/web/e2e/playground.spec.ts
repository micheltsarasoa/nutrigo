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
