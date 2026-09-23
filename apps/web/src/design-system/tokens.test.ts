import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tokensToCss } from "./tokens.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

describe("tokensToCss", () => {
  it("turns each $value leaf into a custom property named after its path", () => {
    const css = tokensToCss({
      color: { green: { base: { $value: "#C2E66E", status: "source" } } },
      space: { "1": { $value: "4px" } },
    });
    expect(css).toContain("  --color-green-base: #C2E66E;\n");
    expect(css).toContain("  --space-1: 4px;\n");
  });

  it("skips $description and $meta entries", () => {
    const css = tokensToCss({
      $description: "x",
      $meta: { a: 1 },
      font: { size: { $description: "y", body: { $value: "14px" } } },
    });
    expect(css).not.toMatch(/description|meta/);
    expect(css).toContain("--font-size-body: 14px;");
  });

  it("turns {path} references into var() and drops the semantic prefix", () => {
    const css = tokensToCss({
      semantic: { macro: { kcal: { $value: "{color.green.base}" } } },
    });
    expect(css).toContain("  --macro-kcal: var(--color-green-base);\n");
  });

  it("keeps numbers as they are", () => {
    expect(
      tokensToCss({ font: { weight: { bold: { $value: 700 } } } }),
    ).toContain("--font-weight-bold: 700;");
  });

  it("wraps everything in one :root block under a do-not-edit header", () => {
    const css = tokensToCss({ radius: { sm: { $value: "8px" } } });
    expect(css).toMatch(
      /^\/\* Generated from docs\/design-system\/tokens\.json[^]*\*\/\n:root \{\n/,
    );
    expect(css.endsWith("}\n")).toBe(true);
  });

  it("the committed tokens.css matches tokens.json (run `npm run tokens -w @nutrigo/web` after editing the JSON)", () => {
    const json = JSON.parse(read("../../../../docs/design-system/tokens.json"));
    expect(read("./tokens.css")).toBe(tokensToCss(json));
  });
});
