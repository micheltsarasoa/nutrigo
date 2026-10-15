import { expect, test } from "@playwright/test";

// Runs on the desktop project, against its API server and SQLite file. There is no
// DELETE /api/targets; the test overwrites every field, so a previous run doesn't matter.
test("SPEC-004 AC-7: saved targets persist after a reload", async ({
  page,
}) => {
  await page.goto("/targets");
  const field = (name: string) => page.getByLabel(name, { exact: true });
  await field("Calories").fill("2990");
  await field("Carbs").fill("325");
  await field("Protein").fill("75");
  await field("Fat").fill("44");
  await page.getByRole("button", { name: "Save targets" }).click();
  await expect(page.getByText("Targets saved.")).toBeVisible();

  await page.reload();
  await expect(field("Calories")).toHaveValue("2990");
  await expect(field("Carbs")).toHaveValue("325");
  await expect(field("Protein")).toHaveValue("75");
  await expect(field("Fat")).toHaveValue("44");
});
