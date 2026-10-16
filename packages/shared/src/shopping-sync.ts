import type { BuiltItem } from "./shopping.ts";

// SPEC-005 §7. Items are matched on (ingredientId, unit); manual items have no ingredientId.
export type ListItem = Omit<BuiltItem, "ingredientId"> & {
  id?: number;
  ingredientId: number | null;
  estCostCents: number | null;
  actualCostCents: number | null;
  purchasedAt: string | null;
  updatedAt: string;
  noLongerInPlan?: boolean;
};
export type FreshItem = Pick<
  ListItem,
  "ingredientId" | "label" | "category" | "quantity" | "unit" | "estCostCents"
>;

const same = (a: { ingredientId: number | null; unit: string }, b: typeof a) =>
  a.ingredientId === b.ingredientId && a.unit === b.unit;

/** AC-5: planned quantities update; ticks, actual prices and manual items stay. */
export function regenerate(old: ListItem[], fresh: FreshItem[]): ListItem[] {
  const kept = old.flatMap((o) => {
    if (o.ingredientId === null) return [o];
    const f = fresh.find((x) => same(x, o));
    if (f)
      return [
        {
          ...o,
          quantity: f.quantity,
          estCostCents: f.estCostCents,
          noLongerInPlan: false,
        },
      ];
    return o.purchasedAt ? [{ ...o, noLongerInPlan: true }] : [];
  });
  const added = fresh
    .filter((f) => !old.some((o) => same(o, f)))
    .map((f) => ({
      ...f,
      actualCostCents: null,
      purchasedAt: null,
      updatedAt: new Date().toISOString(),
    }));
  return [...kept, ...added];
}

/** AC-8: last-write-wins per item; a tie keeps the stored one. */
export const resolveConflict = (stored: ListItem, incoming: ListItem) =>
  Date.parse(incoming.updatedAt) > Date.parse(stored.updatedAt)
    ? incoming
    : stored;
