import { expect, test } from "@playwright/test";
import { PREVIEW } from "../playwright.config.ts";
import { expectTapTargets } from "./helpers.ts";

test.use({ baseURL: PREVIEW });

test("#156 on /playground/atom/button, every md button has a 44 px hit area", async ({
  page,
}) => {
  await page.goto("/playground/atom/button");
  await expect(
    page.getByRole("heading", { level: 1, name: "Button" }),
  ).toBeVisible();
  // The sm size already draws a 44 px hit area (Button.module.css `.sm::after`);
  // this excludes it and keeps every other (md) button, disabled ones included.
  await expectTapTargets(
    page,
    page.locator('main button:not([class*="_sm_"])'),
  );
});

test("#156 on /playground/organism/ingredienteditor, buttons in edit states (including Delete) have a 44 px hit area", async ({
  page,
}) => {
  await page.goto("/playground/organism/ingredienteditor");
  await expect(
    page.getByRole("heading", { level: 1, name: "Edit ingredient" }).first(),
  ).toBeVisible();

  // "new" has no Delete button; every other state edits an existing
  // ingredient (h1 "Edit ingredient") and draws one.
  const editStates = page.locator("section.playground__state").filter({
    has: page.getByRole("heading", { level: 1, name: "Edit ingredient" }),
  });
  const count = await editStates.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expectTapTargets(page, editStates.nth(i).locator("button"));
  }
});

test("#156 on /playground/organism/ingredienteditor, the confirm-Delete button in the dialog has a 44 px hit area", async ({
  page,
}) => {
  await page.goto("/playground/organism/ingredienteditor");
  const editState = page.locator("section.playground__state").filter({
    has: page.getByRole("heading", { level: 1, name: "Edit ingredient" }),
  });
  await editState.first().getByRole("button", { name: "Delete" }).click();
  const dialog = editState.first().locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await expectTapTargets(page, dialog.locator("button"));
});
