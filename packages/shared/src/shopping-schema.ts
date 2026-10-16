import { z } from "zod";
import { Category, Unit } from "./recipes.ts";

// SPEC-005 §5. JSON is camelCase; money is integer cents.
const cents = z.number().int().min(0);

export const GenerateInput = z.object({
  mode: z.enum(["create", "regenerate"]),
});
export type GenerateInput = z.infer<typeof GenerateInput>;

export const ShoppingItemInput = z.object({
  label: z.string().trim().min(1).max(100),
  category: Category,
  quantity: z.number().positive().nullish(),
  unit: Unit.nullish(),
});
export type ShoppingItemInput = z.infer<typeof ShoppingItemInput>;

export const ShoppingItem = z.object({
  id: z.number().int(),
  ingredientId: z.number().int().nullable(),
  label: z.string(),
  category: Category,
  quantity: z.number().nullable(),
  unit: Unit.nullable(),
  estCostCents: cents.nullable(),
  actualCostCents: cents.nullable(),
  purchasedAt: z.string().nullable(),
  updatedAt: z.string(),
  noLongerInPlan: z.boolean().optional(),
});
export type ShoppingItem = z.infer<typeof ShoppingItem>;

export const ItemPatch = z.object({
  purchased: z.boolean().optional(),
  actualCostCents: cents.nullable().optional(),
  quantity: z.number().positive().optional(),
});
export const ItemPatchBatch = z.array(
  z.object({ id: z.number().int(), patch: ItemPatch, updatedAt: z.string() }),
);
export type ItemPatchBatch = z.infer<typeof ItemPatchBatch>;

export const ShoppingList = z.object({
  isoWeek: z.string(),
  generatedAt: z.string(),
  items: z.array(ShoppingItem),
  estimatedCents: cents,
  actualCents: cents,
  excludedCount: z.number().int().min(0),
});
export type ShoppingList = z.infer<typeof ShoppingList>;
