CREATE TABLE `resource_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`fileType` varchar(32) DEFAULT 'pdf',
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resource_files` ADD CONSTRAINT `resource_files_folderId_resource_folders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `resource_folders`(`id`) ON DELETE cascade ON UPDATE no action;