CREATE TABLE `renovation_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitNumber` varchar(32) NOT NULL,
	`applicationDate` varchar(32) NOT NULL,
	`constructionStartDate` varchar(32),
	`constructionEndDate` varchar(32),
	`constructionContent` varchar(255) NOT NULL,
	`consentLetterPasted` varchar(32),
	`applicantName` varchar(64) NOT NULL,
	`applicantPhone` varchar(32) NOT NULL,
	`registeredBy` varchar(64),
	`status` enum('pending','approved','completed','rejected') DEFAULT 'pending',
	`decorationDeposit` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `renovation_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `repairDate` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `unitNumber` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `completionDate` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `isactive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `residentId`;--> statement-breakpoint
ALTER TABLE `repair_requests` DROP COLUMN `requestDate`;