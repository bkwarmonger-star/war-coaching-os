CREATE TABLE `bodyComposition` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`weight` decimal(6,2),
	`height` decimal(5,2),
	`bmi` decimal(5,2),
	`bodyFatPercent` decimal(5,2),
	`hydrationPercent` decimal(5,2),
	`muscleMass` decimal(6,2),
	`boneMass` decimal(6,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bodyComposition_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientPhone` varchar(20),
	`consultationType` varchar(100),
	`scheduledTime` timestamp,
	`status` enum('pending','scheduled','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`stripePaymentIntentId` varchar(255),
	`amount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`documentType` varchar(100),
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientId` int,
	`consultationId` int,
	`stripePaymentIntentId` varchar(255),
	`stripeCustomerId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'usd',
	`status` enum('pending','succeeded','failed','cancelled') DEFAULT 'pending',
	`paymentType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `progressMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`metricType` enum('weight','measurement','bloodwork','body_composition','photo'),
	`value` decimal(8,2),
	`unit` varchar(50),
	`notes` text,
	`photoUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progressMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`consultationId` int NOT NULL,
	`questionnaireData` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questionnaires_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`serviceType` varchar(100),
	`price` decimal(10,2) NOT NULL,
	`duration` int,
	`stripePriceId` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_composition_clientId` ON `bodyComposition` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_composition_trainerId` ON `bodyComposition` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_consultation_trainerId` ON `consultations` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_consultation_email` ON `consultations` (`clientEmail`);--> statement-breakpoint
CREATE INDEX `idx_document_trainerId` ON `documents` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_payment_trainerId` ON `payments` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_payment_clientId` ON `payments` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_metric_clientId` ON `progressMetrics` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_metric_trainerId` ON `progressMetrics` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_questionnaire_trainerId` ON `questionnaires` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_questionnaire_consultationId` ON `questionnaires` (`consultationId`);--> statement-breakpoint
CREATE INDEX `idx_service_trainerId` ON `services` (`trainerId`);