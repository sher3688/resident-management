ALTER TABLE `password_users` DROP INDEX `password_users_username_unique`;--> statement-breakpoint
ALTER TABLE `password_users` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `password_users` ADD CONSTRAINT `password_users_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `password_users` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `password_users` DROP COLUMN `isActive`;