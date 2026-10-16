import { describe, expect, it } from "vitest";
import {
  GenerateInput,
  ItemPatchBatch,
  ShoppingItemInput,
} from "./shopping-schema.ts";

describe("GenerateInput", () => {
  it("accepts create and regenerate only", () => {
    expect(GenerateInput.safeParse({ mode: "create" }).success).toBe(true);
    expect(GenerateInput.safeParse({ mode: "regenerate" }).success).toBe(true);
    expect(GenerateInput.safeParse({ mode: "drop" }).success).toBe(false);
  });
});

describe("ShoppingItemInput", () => {
  it("needs a label and category; quantity and unit are optional", () => {
    expect(
      ShoppingItemInput.safeParse({ label: "Candles", category: "others" })
        .success,
    ).toBe(true);
    expect(ShoppingItemInput.safeParse({ category: "others" }).success).toBe(
      false,
    );
  });
  it("rejects a quantity of 0 and an unknown category", () => {
    const base = { label: "x", category: "others" };
    expect(ShoppingItemInput.safeParse({ ...base, quantity: 0 }).success).toBe(
      false,
    );
    expect(
      ShoppingItemInput.safeParse({ ...base, category: "junk" }).success,
    ).toBe(false);
  });
});

describe("ItemPatchBatch", () => {
  const entry = {
    id: 1,
    patch: { purchased: true, actualCostCents: 300 },
    updatedAt: "2026-10-01T10:00:00Z",
  };
  it("accepts the batch shape of SPEC-005 §5", () => {
    expect(ItemPatchBatch.safeParse([entry]).success).toBe(true);
  });
  it("rejects fractional or negative cents and a missing updatedAt", () => {
    for (const patch of [{ actualCostCents: 1.5 }, { actualCostCents: -1 }])
      expect(ItemPatchBatch.safeParse([{ ...entry, patch }]).success).toBe(
        false,
      );
    expect(ItemPatchBatch.safeParse([{ id: 1, patch: {} }]).success).toBe(
      false,
    );
  });
  it("allows clearing the actual price with null", () => {
    expect(
      ItemPatchBatch.safeParse([{ ...entry, patch: { actualCostCents: null } }])
        .success,
    ).toBe(true);
  });
});
