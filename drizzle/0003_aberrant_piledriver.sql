CREATE TABLE `achievementUnlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`achievementId` int NOT NULL,
	`clientId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`notified` boolean DEFAULT false,
	CONSTRAINT `achievementUnlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`category` enum('streak','workout','weight','nutrition','engagement','milestone') NOT NULL,
	`criteria` text NOT NULL,
	`points` int DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `activeSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(512) NOT NULL,
	`deviceInfo` varchar(255),
	`ipAddress` varchar(45),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activeSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`summaryType` enum('check_in','program_progression','nutrition_adjustment','weekly_summary') NOT NULL,
	`content` text NOT NULL,
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiSummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`trainerId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientRiskScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`riskLevel` enum('low','medium','high') DEFAULT 'low',
	`missedWorkouts` int DEFAULT 0,
	`missedCheckIns` int DEFAULT 0,
	`messageResponseDays` decimal(4,1),
	`engagementTrend` enum('improving','stable','declining') DEFAULT 'stable',
	`lastCalculatedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `clientRiskScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientRiskScores_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
CREATE TABLE `emailVerificationTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerificationTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerificationTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `foodSubstitutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`primaryFood` varchar(255) NOT NULL,
	`substituteFood` varchar(255) NOT NULL,
	`caloriesMatch` boolean DEFAULT true,
	`proteinMatch` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `foodSubstitutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formTemplateId` int NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`responses` text NOT NULL,
	`status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`trainerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('onboarding','ongoing','legal','screening') NOT NULL,
	`fields` text NOT NULL,
	`isClientFacing` boolean NOT NULL DEFAULT true,
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `formTemplates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `groceryLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`items` text NOT NULL,
	`weekStartDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groceryLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habitEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habitTemplateId` int NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`value` decimal(8,2),
	`completed` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habitEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habitTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`clientId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('steps','water','sleep','supplements','meditation','workout','custom') NOT NULL,
	`unit` varchar(50),
	`dailyTarget` decimal(8,2),
	`icon` varchar(50),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habitTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `localAuth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `localAuth_id` PRIMARY KEY(`id`),
	CONSTRAINT `localAuth_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `localAuth_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trainerId` int,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `pushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyCoachSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`weekStartDate` varchar(10) NOT NULL,
	`activeClients` int DEFAULT 0,
	`atRiskClients` int DEFAULT 0,
	`newLeads` int DEFAULT 0,
	`checkInCompletionPct` decimal(5,2),
	`weeklyRevenue` decimal(10,2),
	`retentionRate` decimal(5,2),
	`aiSummary` text,
	`highlights` text,
	`actions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeklyCoachSummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(384) NOT NULL;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `aiAnalysis` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `proteinTargetG` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `carbsTargetG` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `fatTargetG` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `fiberTargetG` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `waterTargetOz` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentType` varchar(50);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_unlock_clientId` ON `achievementUnlocks` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_unlock_achievementId` ON `achievementUnlocks` (`achievementId`);--> statement-breakpoint
CREATE INDEX `idx_achievement_slug` ON `achievements` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_session_userId` ON `activeSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_session_token` ON `activeSessions` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `idx_ai_clientId` ON `aiSummaries` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_ai_trainerId` ON `aiSummaries` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_audit_userId` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_trainerId` ON `auditLogs` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_risk_clientId` ON `clientRiskScores` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_risk_trainerId` ON `clientRiskScores` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_evt_userId` ON `emailVerificationTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_evt_token` ON `emailVerificationTokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sub_trainerId` ON `foodSubstitutions` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_formSubmission_clientId` ON `formSubmissions` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_formSubmission_trainerId` ON `formSubmissions` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_formSubmission_templateId` ON `formSubmissions` (`formTemplateId`);--> statement-breakpoint
CREATE INDEX `idx_formTemplate_slug` ON `formTemplates` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_grocery_clientId` ON `groceryLists` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_habitEntry_clientId` ON `habitEntries` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_habitEntry_templateId` ON `habitEntries` (`habitTemplateId`);--> statement-breakpoint
CREATE INDEX `idx_habitEntry_date` ON `habitEntries` (`date`);--> statement-breakpoint
CREATE INDEX `idx_habit_trainerId` ON `habitTemplates` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_habit_clientId` ON `habitTemplates` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_localAuth_email` ON `localAuth` (`email`);--> statement-breakpoint
CREATE INDEX `idx_localAuth_userId` ON `localAuth` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_notif_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_notif_trainerId` ON `notifications` (`trainerId`);--> statement-breakpoint
CREATE INDEX `idx_prt_userId` ON `passwordResetTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_prt_token` ON `passwordResetTokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_pushToken_userId` ON `pushTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_weekly_trainerId` ON `weeklyCoachSummaries` (`trainerId`);