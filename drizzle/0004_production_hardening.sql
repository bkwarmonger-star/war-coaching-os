-- Migration: Production Hardening — Phase 1-8
-- Run after 0003_client_auth_and_forms.sql

-- Expand openId for local auth
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(384) NOT NULL;

-- Add email verification to users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerified` boolean NOT NULL DEFAULT false;

-- Add macro targets to clients
ALTER TABLE `clients`
  ADD COLUMN IF NOT EXISTS `proteinTargetG` int,
  ADD COLUMN IF NOT EXISTS `carbsTargetG` int,
  ADD COLUMN IF NOT EXISTS `fatTargetG` int,
  ADD COLUMN IF NOT EXISTS `fiberTargetG` int,
  ADD COLUMN IF NOT EXISTS `waterTargetOz` int;

-- Add read receipts + attachments to messages
ALTER TABLE `messages`
  ADD COLUMN IF NOT EXISTS `readAt` timestamp,
  ADD COLUMN IF NOT EXISTS `attachmentUrl` text,
  ADD COLUMN IF NOT EXISTS `attachmentType` varchar(50),
  ADD COLUMN IF NOT EXISTS `attachmentName` varchar(255);

-- Add AI analysis column to check-ins
ALTER TABLE `checkIns` ADD COLUMN IF NOT EXISTS `aiAnalysis` text;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS `passwordResetTokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `token` varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `prt_token_unique` (`token`)
);
CREATE INDEX IF NOT EXISTS `idx_prt_userId` ON `passwordResetTokens` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_prt_token` ON `passwordResetTokens` (`token`);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS `emailVerificationTokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `token` varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `evt_token_unique` (`token`)
);
CREATE INDEX IF NOT EXISTS `idx_evt_userId` ON `emailVerificationTokens` (`userId`);

-- Active sessions
CREATE TABLE IF NOT EXISTS `activeSessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `sessionToken` varchar(512) NOT NULL,
  `deviceInfo` varchar(255),
  `ipAddress` varchar(45),
  `lastActiveAt` timestamp NOT NULL DEFAULT (now()),
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_session_userId` ON `activeSessions` (`userId`);
-- sessionToken must be unique so session lookups return exactly one row
ALTER TABLE `activeSessions` ADD CONSTRAINT `activeSessions_token_unique` UNIQUE (`sessionToken`(255));

-- Audit logs
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int,
  `trainerId` int,
  `action` varchar(100) NOT NULL,
  `entityType` varchar(50),
  `entityId` int,
  `details` text,
  `ipAddress` varchar(45),
  `userAgent` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_audit_userId` ON `auditLogs` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_audit_trainerId` ON `auditLogs` (`trainerId`);
CREATE INDEX IF NOT EXISTS `idx_audit_action` ON `auditLogs` (`action`);

-- Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `trainerId` int,
  `type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `data` text,
  `isRead` boolean NOT NULL DEFAULT false,
  `readAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_notif_userId` ON `notifications` (`userId`);

-- Push tokens
CREATE TABLE IF NOT EXISTS `pushTokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `token` text NOT NULL,
  `platform` enum('ios','android','web') NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_pushToken_userId` ON `pushTokens` (`userId`);

-- Habit templates
CREATE TABLE IF NOT EXISTS `habitTemplates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `clientId` int,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` enum('steps','water','sleep','supplements','meditation','workout','custom') NOT NULL,
  `unit` varchar(50),
  `dailyTarget` decimal(8,2),
  `icon` varchar(50),
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_habit_trainerId` ON `habitTemplates` (`trainerId`);

-- Habit entries
CREATE TABLE IF NOT EXISTS `habitEntries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `habitTemplateId` int NOT NULL,
  `clientId` int NOT NULL,
  `date` varchar(10) NOT NULL,
  `value` decimal(8,2),
  `completed` boolean NOT NULL DEFAULT false,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_habitEntry_clientId` ON `habitEntries` (`clientId`);
CREATE INDEX IF NOT EXISTS `idx_habitEntry_date` ON `habitEntries` (`date`);

-- Achievements
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(50),
  `category` enum('streak','workout','weight','nutrition','engagement','milestone') NOT NULL,
  `criteria` text NOT NULL,
  `points` int NOT NULL DEFAULT 10,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `achievement_slug_unique` (`slug`)
);

-- Achievement unlocks
CREATE TABLE IF NOT EXISTS `achievementUnlocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `achievementId` int NOT NULL,
  `clientId` int NOT NULL,
  `unlockedAt` timestamp NOT NULL DEFAULT (now()),
  `notified` boolean NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  UNIQUE KEY `au_client_achievement_unique` (`clientId`, `achievementId`)
);
CREATE INDEX IF NOT EXISTS `idx_unlock_clientId` ON `achievementUnlocks` (`clientId`);

-- Client risk scores
CREATE TABLE IF NOT EXISTS `clientRiskScores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `trainerId` int NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
  `missedWorkouts` int DEFAULT 0,
  `missedCheckIns` int DEFAULT 0,
  `messageResponseDays` decimal(4,1),
  `engagementTrend` enum('improving','stable','declining') DEFAULT 'stable',
  `lastCalculatedAt` timestamp NOT NULL DEFAULT (now()),
  `notes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `risk_clientId_unique` (`clientId`)
);
CREATE INDEX IF NOT EXISTS `idx_risk_trainerId` ON `clientRiskScores` (`trainerId`);

-- Food substitutions
CREATE TABLE IF NOT EXISTS `foodSubstitutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `primaryFood` varchar(255) NOT NULL,
  `substituteFood` varchar(255) NOT NULL,
  `caloriesMatch` boolean DEFAULT true,
  `proteinMatch` boolean DEFAULT false,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);

-- Grocery lists
CREATE TABLE IF NOT EXISTS `groceryLists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `programId` int NOT NULL,
  `clientId` int NOT NULL,
  `trainerId` int NOT NULL,
  `items` text NOT NULL,
  `weekStartDate` varchar(10),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_grocery_clientId` ON `groceryLists` (`clientId`);

-- AI summaries
CREATE TABLE IF NOT EXISTS `aiSummaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `trainerId` int NOT NULL,
  `summaryType` enum('check_in','program_progression','nutrition_adjustment','weekly_summary') NOT NULL,
  `content` text NOT NULL,
  `sourceId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
);
CREATE INDEX IF NOT EXISTS `idx_ai_clientId` ON `aiSummaries` (`clientId`);

-- Weekly coach summaries
CREATE TABLE IF NOT EXISTS `weeklyCoachSummaries` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `weekly_trainer_week_unique` (`trainerId`, `weekStartDate`)
);
CREATE INDEX IF NOT EXISTS `idx_weekly_trainerId` ON `weeklyCoachSummaries` (`trainerId`);

-- Seed default achievements
INSERT IGNORE INTO `achievements` (`slug`, `name`, `description`, `icon`, `category`, `criteria`, `points`) VALUES
('first-checkin', 'First Check-In', 'Submitted your first weekly check-in', '📋', 'engagement', '{"type":"checkin_count","threshold":1}', 10),
('week-streak-7', '7-Day Streak', '7 consecutive days of habit tracking', '🔥', 'streak', '{"type":"habit_streak","threshold":7}', 25),
('week-streak-30', '30-Day Streak', '30 consecutive days of habit tracking', '⚡', 'streak', '{"type":"habit_streak","threshold":30}', 100),
('workouts-10', '10 Workouts Complete', 'Completed 10 workouts', '💪', 'workout', '{"type":"workout_count","threshold":10}', 30),
('workouts-50', '50 Workouts Complete', 'Completed 50 workouts', '🏆', 'workout', '{"type":"workout_count","threshold":50}', 150),
('workouts-100', '100 Workouts', '100 workouts completed — elite status', '🥇', 'workout', '{"type":"workout_count","threshold":100}', 500),
('weight-loss-5', '5 lbs Down', 'Lost your first 5 lbs', '📉', 'weight', '{"type":"weight_loss","threshold":5}', 50),
('weight-loss-10', '10 lbs Down', 'Lost 10 lbs from starting weight', '🎯', 'weight', '{"type":"weight_loss","threshold":10}', 100),
('weight-loss-25', '25 lbs Down', 'Dropped 25 lbs — incredible progress', '🌟', 'weight', '{"type":"weight_loss","threshold":25}', 250),
('consistent-checkins', 'Check-In Champion', '8 consecutive weekly check-ins', '✅', 'engagement', '{"type":"checkin_streak","threshold":8}', 80),
('water-goal-7', 'Hydration Week', 'Hit water goal 7 days in a row', '💧', 'nutrition', '{"type":"water_streak","threshold":7}', 20),
('first-form', 'Paperwork Done', 'Completed all required intake forms', '📄', 'milestone', '{"type":"forms_complete","threshold":1}', 15);
