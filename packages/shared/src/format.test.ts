import { describe, expect, it } from "vitest";
import { formatEUR, formatNumber } from "./format.ts";

// Intl writes fr-FR group separators as U+202F and puts U+00A0 before "€".
describe("formatNumber", () => {
  it("SPEC-008 AC-1: 1240 → '1 240' in fr-FR, with a narrow no-break space", () => {
    expect(formatNumber(1240, "fr-FR")).toBe("1 240");
  });

  it("SPEC-008 AC-2: 1240 → '1,240' in en-IE", () => {
    expect(formatNumber(1240, "en-IE")).toBe("1,240");
  });

  it("rounds to whole numbers", () => {
    expect(formatNumber(134.6, "en-IE")).toBe("135");
  });
});

describe("formatEUR", () => {
  it("SPEC-008 AC-1: 5740 cents → '57,40 €' in fr-FR, with a no-break space", () => {
    expect(formatEUR(5740, "fr-FR")).toBe("57,40 €");
  });

  it("SPEC-008 AC-2: 5740 cents → '€57.40' in en-IE", () => {
    expect(formatEUR(5740, "en-IE")).toBe("€57.40");
  });

  it("formats 0 cents", () => {
    expect(formatEUR(0, "en-IE")).toBe("€0.00");
  });
});
