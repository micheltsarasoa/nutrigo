CREATE TABLE `shopping_item` (
	`id` integer PRIMARY KEY NOT NULL,
	`list_id` integer NOT NULL,
	`ingredient_id` integer,
	`label` text NOT NULL,
	`category` text NOT NULL,
	`quantity` real,
	`unit` text,
	`est_cost_cents` integer,
	`actual_cost_cents` integer,
	`purchased_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "item_quantity_positive" CHECK("shopping_item"."quantity" is null or "shopping_item"."quantity" > 0),
	CONSTRAINT "item_est_cost_valid" CHECK("shopping_item"."est_cost_cents" is null or "shopping_item"."est_cost_cents" >= 0),
	CONSTRAINT "item_actual_cost_valid" CHECK("shopping_item"."actual_cost_cents" is null or "shopping_item"."actual_cost_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE `shopping_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`iso_week` text NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`iso_week`) REFERENCES `plan_week`(`iso_week`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_list_iso_week_unique` ON `shopping_list` (`iso_week`);--> statement-breakpoint
ALTER TABLE `ingredient` ADD `price_cents` integer CHECK (`price_cents` IS NULL OR `price_cents` >= 0);--> statement-breakpoint
ALTER TABLE `ingredient` ADD `price_pack_qty` real CHECK (`price_pack_qty` IS NULL OR `price_pack_qty` > 0);--> statement-breakpoint
ALTER TABLE `ingredient` ADD `price_pack_unit` text;