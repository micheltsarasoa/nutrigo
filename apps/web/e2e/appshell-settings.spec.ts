import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";
import { expectNoHorizontalScroll } from "./helpers.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// SPEC-008 §4 Q-A: the tab bar's settings entry is a top-bar button at the
// right, opening the shared Settings dialog and returning focus on close.
test("/playground/organism/appshell: the tab bar's Settings button opens and closes the dialog", async ({
  page,
}) => {
  await page.goto("/playground/organism/appshell");
  const section = page.getByRole("region", { name: /^tab bar with settings/ });
  const button = section.getByRole("button", { name: "Settings" });

  await expect(button).toBeVisible();
  const box = (await button.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(40);

  const sectionBox = (await section.boundingBox())!;
  expect(box.x + box.width / 2).toBeGreaterThan(
    sectionBox.x + sectionBox.width / 2,
  );

  await expectNoHorizontalScroll(page);

  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-expanded", "false");
});
