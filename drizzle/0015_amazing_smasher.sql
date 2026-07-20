CREATE TABLE `invited_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(64),
	`role` varchar(32) NOT NULL DEFAULT 'user',
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`invitedBy` int,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invited_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `invited_users_email_unique` UNIQUE(`email`)
);
