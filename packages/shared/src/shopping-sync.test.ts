import { describe, expect, it } from "vitest";
import { regenerate, resolveConflict, type ListItem } from "./shopping-sync.ts";

const item = (over: Partial<ListItem>): ListItem => ({
  id: 1,
  ingredientId: 1,
  label: "Oats",
  category: "grains",
  quantity: 180,
  unit: "g",
  estCostCents: 120,
  actualCostCents: null,
  purchasedAt: null,
  updatedAt: "2026-10-01T10:00:00Z",
  ...over,
});
const fresh = (over: Partial<ListItem>) => {
  const { ingredientId, label, category, quantity, unit, estCostCents } =
    item(over);
  return { ingredientId, label, category, quantity, unit, estCostCents };
};

describe("regenerate", () => {
  it("SPEC-005 AC-5: updates quantity and estimate, keeps tick, actual price and id", () => {
    const old = [
      item({ purchasedAt: "2026-10-02T09:00:00Z", actualCostCents: 300 }),
    ];
    const [out] = regenerate(old, [
      fresh({ quantity: 250, estCostCents: 120 }),
    ]);
    expect(out).toMatchObject({
      id: 1,
      quantity: 250,
      purchasedAt: "2026-10-02T09:00:00Z",
      actualCostCents: 300,
    });
    expect(out?.noLongerInPlan).toBeFalsy();
  });

  it("keeps manual items untouched", () => {
    const manual = item({ id: 9, ingredientId: null, label: "Candles" });
    expect(regenerate([manual], [])).toEqual([manual]);
  });

  it("AC-5: a ticked item no longer in the plan is kept and flagged", () => {
    const old = [item({ purchasedAt: "2026-10-02T09:00:00Z" })];
    expect(regenerate(old, [])).toEqual([{ ...old[0], noLongerInPlan: true }]);
  });

  it("drops an unticked item no longer in the plan", () => {
    expect(regenerate([item({})], [])).toEqual([]);
  });

  it("adds new planned items without an id", () => {
    const out = regenerate([], [fresh({ ingredientId: 2, label: "Egg" })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      label: "Egg",
      purchasedAt: null,
      actualCostCents: null,
    });
    expect(out[0]?.id).toBeUndefined();
  });

  it("matches on ingredient and unit, so g and piece lines stay apart", () => {
    const old = [item({ unit: "piece", purchasedAt: "2026-10-02T09:00:00Z" })];
    const out = regenerate(old, [fresh({ unit: "g" })]);
    expect(out.map((i) => [i.unit, i.noLongerInPlan ?? false])).toEqual([
      ["piece", true],
      ["g", false],
    ]);
  });
});

describe("resolveConflict", () => {
  const stored = item({ quantity: 1, updatedAt: "2026-10-01T10:00:00Z" });
  it("SPEC-005 AC-8: the most recent updatedAt wins", () => {
    const newer = item({ quantity: 2, updatedAt: "2026-10-01T11:00:00Z" });
    expect(resolveConflict(stored, newer)).toBe(newer);
    expect(resolveConflict(newer, stored)).toBe(newer);
  });
  it("keeps the stored item on a tie", () => {
    expect(resolveConflict(stored, { ...stored, quantity: 5 })).toBe(stored);
  });
  it("compares instants, not strings (offset formats)", () => {
    const incoming = item({ updatedAt: "2026-10-01T12:30:00+02:00" }); // = 10:30Z
    expect(resolveConflict(stored, incoming)).toBe(incoming);
  });
});
