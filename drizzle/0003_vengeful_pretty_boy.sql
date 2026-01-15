-- Create the junction table first
CREATE TABLE `jury_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jury_id` int NOT NULL,
	`session_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jury_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- Migrate existing jury-session relationships to junction table
INSERT INTO `jury_sessions` (`jury_id`, `session_id`, `created_at`, `updated_at`)
SELECT `id`, `session`, `created_at`, `updated_at`
FROM `jury`
WHERE `session` IS NOT NULL;
--> statement-breakpoint

-- Now drop the old foreign key
ALTER TABLE `jury` DROP FOREIGN KEY `jury_session_sessions_id_fk`;
--> statement-breakpoint

-- Add foreign keys to junction table
ALTER TABLE `jury_sessions` ADD CONSTRAINT `jury_sessions_jury_id_jury_id_fk` FOREIGN KEY (`jury_id`) REFERENCES `jury`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jury_sessions` ADD CONSTRAINT `jury_sessions_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Finally, drop the session column from jury table
ALTER TABLE `jury` DROP COLUMN `session`;