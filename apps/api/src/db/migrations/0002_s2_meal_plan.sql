CREATE TABLE `meal_entry` (
	`id` integer PRIMARY KEY NOT NULL,
	`iso_week` text NOT NULL,
	`date` text NOT NULL,
	`slot` text NOT NULL,
	`recipe_id` integer NOT NULL,
	`servings` real NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`iso_week`) REFERENCES `plan_week`(`iso_week`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "meal_servings_positive" CHECK("meal_entry"."servings" > 0),
	CONSTRAINT "meal_slot" CHECK("meal_entry"."slot" in ('breakfast', 'lunch', 'snack', 'dinner'))
);
--> statement-breakpoint
CREATE TABLE `plan_week` (
	`iso_week` text PRIMARY KEY NOT NULL
);
