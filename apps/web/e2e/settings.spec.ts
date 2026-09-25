import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalScroll } from "./helpers.ts";

// Runs on both projects (mobile, desktop): each gets its own API server and
// SQLite file (apps/web/playwright.config.ts), so this reset never races the
// other project's state.
test.beforeEach(async ({ request }) => {
  const res = await request.put("/api/settings", {
    data: { locale: "fr-FR" },
  });
  expect(res.ok()).toBe(true);
});

test("SPEC-008 AC-1: Settings opens with fr-FR and shows 1 240 kcal · 57,40 €", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("combobox", { name: "Number and money format" }),
  ).toHaveValue("fr-FR");
  await expect(
    dialog.getByText("Example: 1\u202F240 kcal · 57,40\u00A0€"),
  ).toBeVisible();
});

test("SPEC-008 AC-2: saving en-IE closes Settings and survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });

  await dialog
    .getByRole("combobox", { name: "Number and money format" })
    .selectOption("en-IE");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(
    dialog.getByRole("combobox", { name: "Number and money format" }),
  ).toHaveValue("en-IE");
  await expect(dialog.getByText("Example: 1,240 kcal · €57.40")).toBeVisible();
});

test("SPEC-008 AC-3: Esc and Cancel close Settings without saving", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Settings" });
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const select = () =>
    dialog.getByRole("combobox", { name: "Number and money format" });

  await button.click();
  await select().selectOption("en-IE");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await button.click();
  await expect(select()).toHaveValue("fr-FR");

  await select().selectOption("en-IE");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await button.click();
  await expect(select()).toHaveValue("fr-FR");
});

test("SPEC-008 AC-11: at 390 px Settings is a full-screen sheet, focus stays inside and returns to the trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Settings" });
  await button.click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(Math.abs((box?.width ?? 0) - 390)).toBeLessThanOrEqual(1);
  await expectNoHorizontalScroll(page);

  for (const name of ["Save", "Cancel"]) {
    const height = (await dialog.getByRole("button", { name }).boundingBox())
      ?.height;
    expect(height ?? 0).toBeGreaterThanOrEqual(40);
  }

  // The modal makes the page behind it inert: Tab cycles through the dialog and the
  // browser's own UI (reported as <body>), never onto the page.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => {
        const el = document.activeElement;
        return (
          el === document.body ||
          !!document.querySelector("dialog")?.contains(el)
        );
      }),
    ).toBe(true);
  }

  await expectNoAxeViolations(page);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});
