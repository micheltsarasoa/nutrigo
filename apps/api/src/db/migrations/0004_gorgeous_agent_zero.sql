CREATE TABLE `targets` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`kcal` real NOT NULL,
	`carbs_g` real,
	`protein_g` real,
	`fat_g` real,
	CONSTRAINT "targets_single_row" CHECK("targets"."id" = 1)
);
