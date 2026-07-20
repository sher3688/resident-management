CREATE TABLE `restricted_operators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissions` json NOT NULL DEFAULT ('{}'),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restricted_operators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_username_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `residentId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `requestDate` date NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `repairDate`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `unitNumber`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `reporterName`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `location`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `handlerNotes`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `completedDate`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;