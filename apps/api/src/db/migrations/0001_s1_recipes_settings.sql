CREATE TABLE `ingredient` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`external_id` text,
	`kcal_100g` real NOT NULL,
	`carbs_100g` real NOT NULL,
	`protein_100g` real NOT NULL,
	`fat_100g` real NOT NULL,
	`fibre_100g` real,
	`sugars_100g` real,
	`sodium_mg_100g` real,
	`default_unit` text NOT NULL,
	`grams_per_unit` real,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredient_name_unique` ON `ingredient` (`name`);--> statement-breakpoint
CREATE TABLE `recipe` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`meal_type` text NOT NULL,
	`servings` integer NOT NULL,
	`difficulty` text,
	`prep_min` integer,
	`cook_min` integer,
	`rating` integer,
	`notes_md` text,
	`photo_path` text,
	`updated_at` text NOT NULL,
	CONSTRAINT "servings_positive" CHECK("recipe"."servings" > 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredient` (
	`recipe_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`recipe_id`, `ingredient_id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "quantity_positive" CHECK("recipe_ingredient"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_step` (
	`id` integer PRIMARY KEY NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe_tool` (
	`id` integer PRIMARY KEY NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`locale` text DEFAULT 'fr-FR' NOT NULL,
	`source_ciqual` integer DEFAULT 1 NOT NULL,
	`source_off` integer DEFAULT 1 NOT NULL,
	`ai_provider` text DEFAULT 'anthropic' NOT NULL,
	`ai_model` text,
	`ai_monthly_cap_cents` integer,
	CONSTRAINT "single_row" CHECK("settings"."id" = 1)
);
--> statement-breakpoint
-- The single settings row with its defaults (SPEC-008 §6).
INSERT INTO `settings` (`id`) VALUES (1);
