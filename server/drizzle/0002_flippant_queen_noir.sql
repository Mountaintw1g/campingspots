CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text NOT NULL,
	`reason` text NOT NULL,
	`comment` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `places` ADD `legal_confirmed` integer DEFAULT false NOT NULL;