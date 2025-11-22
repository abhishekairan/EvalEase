ALTER TABLE `marks` DROP FOREIGN KEY `marks_jury_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `marks` ADD CONSTRAINT `marks_jury_id_jury_id_fk` FOREIGN KEY (`jury_id`) REFERENCES `jury`(`id`) ON DELETE cascade ON UPDATE no action;