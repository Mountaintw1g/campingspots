CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`type` text DEFAULT 'ovrigt' NOT NULL,
	`owner_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
