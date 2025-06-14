CREATE TABLE `admin` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `creds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user` int NOT NULL,
	`password` varchar(512) NOT NULL,
	CONSTRAINT `creds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jurry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`session` int,
	`phone_number` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jurry_id` PRIMARY KEY(`id`),
	CONSTRAINT `jurry_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `marks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_id` int NOT NULL,
	`jury_id` int NOT NULL,
	`session` int NOT NULL,
	`innovation_score` int NOT NULL,
	`presentation_score` int NOT NULL,
	`technical_score` int NOT NULL,
	`impact_score` int NOT NULL,
	`submitted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`institude` varchar(255) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_id` int NOT NULL,
	`member_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_name` varchar(255) NOT NULL,
	`leader_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `creds` ADD CONSTRAINT `creds_user_users_id_fk` FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jurry` ADD CONSTRAINT `jurry_session_sessions_id_fk` FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marks` ADD CONSTRAINT `marks_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marks` ADD CONSTRAINT `marks_jury_id_users_id_fk` FOREIGN KEY (`jury_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marks` ADD CONSTRAINT `marks_session_sessions_id_fk` FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_member_id_users_id_fk` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_leader_id_users_id_fk` FOREIGN KEY (`leader_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;