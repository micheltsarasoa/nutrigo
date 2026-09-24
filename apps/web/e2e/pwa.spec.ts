import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const tokens = JSON.parse(
  readFileSync(
    new URL("../../../docs/design-system/tokens.json", import.meta.url),
    "utf8",
  ),
);

test("SPEC-001 AC-8: the production build links a manifest that makes it installable", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    tokens.color.green.base.$value,
  );

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "NutriGo",
    short_name: "NutriGo",
    start_url: "/",
    display: "standalone",
    theme_color: tokens.color.green.base.$value,
    background_color: tokens.color.neutral.cream.$value,
  });

  const icons: { src: string; sizes: string; purpose?: string }[] =
    manifest.icons;
  const has = (sizes: string, purpose = "any") =>
    icons.some((i) => i.sizes === sizes && (i.purpose ?? "any") === purpose);
  expect(has("192x192")).toBe(true);
  expect(has("512x512")).toBe(true);
  expect(has("512x512", "maskable")).toBe(true);
  for (const icon of icons) {
    const res = await request.get(new URL(icon.src, page.url()).href);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test("SPEC-001 AC-8: a service worker registers and controls the page after a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller !== null),
  ).toBe(true);
});
