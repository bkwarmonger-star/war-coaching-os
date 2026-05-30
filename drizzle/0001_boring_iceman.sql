CREATE TABLE `checkIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`weight` decimal(6,2),
	`energyLevel` int,
	`notes` text,
	`photoUrls` text,
	`trainerFeedback` text,
	`status` enum('pending','reviewed','responded') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `checkIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`age` int,
	`sex` enum('male','female','other'),
	`weight` decimal(6,2),
	`height` decimal(5,2),
	`fitnessLevel` enum('beginner','intermediate','advanced','elite'),
	`trainingType` enum('in-person','online','adaptive'),
	`goals` text,
	`injuries` text,
	`allergies` text,
	`dietaryRestrictions` text,
	`dailyCalorieTarget` int,
	`profileImageUrl` text,
	`status` enum('active','inactive','paused') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`source` varchar(100),
	`status` enum('new','contacted','qualified','converted','lost') DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`sessions` int,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`programType` enum('exercise','nutrition','hybrid') NOT NULL,
	`duration` int,
	`content` text,
	`isTemplate` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`referrerClientId` int,
	`referredClientId` int,
	`referralCode` varchar(50),
	`rewardAmount` decimal(10,2),
	`status` enum('pending','completed','expired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientId` int NOT NULL,
	`sessionType` enum('in-person','online','adaptive') NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`notes` text,
	`status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`packageId` int NOT NULL,
	`trainerId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('active','expired','cancelled') DEFAULT 'active',
	`totalAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`qualifications` text,
	`specialties` text,
	`profileImageUrl` text,
	`socialLinks` text,
	`monthlyIncomeGoal` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainers_id` PRIMARY KEY(`id`),
	CONSTRAINT `trainers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `idx_checkin_clientId` ON `checkIns` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_checkin_trainerId` ON `checkIns` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_client_trainerId` ON `clients` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_lead_trainerId` ON `leads` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_message_trainerId` ON `messages` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_message_clientId` ON `messages` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_message_senderId` ON `messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `idx_package_trainerId` ON `packages` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_program_trainerId` ON `programs` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_program_clientId` ON `programs` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_referral_trainerId` ON `referrals` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_session_trainerId` ON `sessions` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_session_clientId` ON `sessions` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_subscription_clientId` ON `subscriptions` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_subscription_packageId` ON `subscriptions` (`packageId`);--> statement-breakpoint
CREATE INDEX `idx_subscription_trainerId` ON `subscriptions` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_trainer_userId` ON `trainers` (`userId`);