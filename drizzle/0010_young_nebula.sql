CREATE TABLE `parking_plates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parkingId` int NOT NULL,
	`plate` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parking_plates_id` PRIMARY KEY(`id`)
);
