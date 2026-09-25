import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// /api/health reads it to prove migrations ran (SPEC-001 §6).
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// data-model.md. Tags wait for a tag filter (SPEC-002 §10); prices come in S4.
export const ingredient = sqliteTable("ingredient", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  source: text("source").notNull(),
  externalId: text("external_id"),
  kcal100g: real("kcal_100g").notNull(),
  carbs100g: real("carbs_100g").notNull(),
  protein100g: real("protein_100g").notNull(),
  fat100g: real("fat_100g").notNull(),
  fibre100g: real("fibre_100g"),
  sugars100g: real("sugars_100g"),
  sodiumMg100g: real("sodium_mg_100g"),
  defaultUnit: text("default_unit").notNull(),
  gramsPerUnit: real("grams_per_unit"),
  updatedAt: text("updated_at").notNull(),
});

export const recipe = sqliteTable(
  "recipe",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    mealType: text("meal_type").notNull(),
    servings: integer("servings").notNull(),
    difficulty: text("difficulty"),
    prepMin: integer("prep_min"),
    cookMin: integer("cook_min"),
    rating: integer("rating"),
    notesMd: text("notes_md"),
    photoPath: text("photo_path"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [check("servings_positive", sql`${t.servings} > 0`)],
);

export const recipeIngredient = sqliteTable(
  "recipe_ingredient",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredient.id, { onDelete: "restrict" }),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.recipeId, t.ingredientId] }),
    check("quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const recipeStep = sqliteTable("recipe_step", {
  id: integer("id").primaryKey(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

export const recipeTool = sqliteTable("recipe_tool", {
  id: integer("id").primaryKey(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  name: text("name").notNull(),
});

// One row (SPEC-008 §6). All S1/S3/S5 columns now, so there's one settings migration.
export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    locale: text("locale").notNull().default("fr-FR"),
    sourceCiqual: integer("source_ciqual").notNull().default(1),
    sourceOff: integer("source_off").notNull().default(1),
    aiProvider: text("ai_provider").notNull().default("anthropic"),
    aiModel: text("ai_model"),
    aiMonthlyCapCents: integer("ai_monthly_cap_cents"),
  },
  (t) => [check("single_row", sql`${t.id} = 1`)],
);
