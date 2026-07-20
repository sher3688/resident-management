CREATE TABLE `repair_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairDate` date NOT NULL,
	`unitNumber` varchar(32) NOT NULL,
	`reporterName` varchar(64),
	`description` text NOT NULL,
	`location` varchar(128),
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`handlerNotes` text,
	`completedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repair_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `residents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitNumber` varchar(32) NOT NULL,
	`ownerName` varchar(64) NOT NULL,
	`ownerPhone` varchar(32),
	`coResident1Name` varchar(64),
	`coResident1Phone` varchar(32),
	`coResident2Name` varchar(64),
	`coResident2Phone` varchar(32),
	`coResident3Name` varchar(64),
	`coResident3Phone` varchar(32),
	`coResident4Name` varchar(64),
	`coResident4Phone` varchar(32),
	`carParkingNumber` varchar(32),
	`motorcycleParkingNumber` varchar(32),
	`bicycleParkingNumber` varchar(32),
	`emergencyContactName` varchar(64),
	`emergencyContactPhone` varchar(32),
	`emergencyContactRelation` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `residents_id` PRIMARY KEY(`id`)
);
