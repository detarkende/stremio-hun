CREATE TABLE IF NOT EXISTS `mediaklikk_channel_cache` (
	`channel_id` text PRIMARY KEY,
	`url` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `visits` (
	`ip` text NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_visits_ip_timestamp` ON `visits` (`ip`,`timestamp`);