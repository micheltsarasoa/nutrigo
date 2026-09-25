import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";

test.use({ baseURL: PREVIEW, viewport: { width: 320, height: 800 } });

// The dialog is a top-layer sheet: it must fill the narrowest phone with no
// overflow, and closing it must give focus back to the button that opened it.
test("/playground/organism/settingsdialog at 320 px is a full-screen sheet with no horizontal overflow, and Esc returns focus to its trigger", async ({
  page,
}) => {
  await page.goto("/playground/organism/settingsdialog");
  const section = page.getByRole("region", { name: /^editing, clean/ });
  const trigger = section.getByRole("button", { name: "Open settings" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const dialogOverflow = await dialog.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(dialogOverflow).toBeLessThanOrEqual(0);

  const box = await dialog.boundingBox();
  expect(Math.abs((box?.width ?? 0) - 320)).toBeLessThanOrEqual(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
