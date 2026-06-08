import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 384 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── TRAINERS ─────────────────────────────────────────────────────────────────
export const trainers = mysqlTable("trainers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  qualifications: text("qualifications"),
  specialties: text("specialties"),
  profileImageUrl: text("profileImageUrl"),
  socialLinks: text("socialLinks"),
  monthlyIncomeGoal: decimal("monthlyIncomeGoal", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_trainer_userId").on(t.userId)]);
export type Trainer = typeof trainers.$inferSelect;
export type InsertTrainer = typeof trainers.$inferInsert;

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  age: int("age"),
  sex: mysqlEnum("sex", ["male", "female", "other"]),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  fitnessLevel: mysqlEnum("fitnessLevel", ["beginner", "intermediate", "advanced", "elite"]),
  trainingType: mysqlEnum("trainingType", ["in-person", "online", "adaptive"]),
  goals: text("goals"),
  injuries: text("injuries"),
  allergies: text("allergies"),
  dietaryRestrictions: text("dietaryRestrictions"),
  dailyCalorieTarget: int("dailyCalorieTarget"),
  // Macro targets (per-client)
  proteinTargetG: int("proteinTargetG"),
  carbsTargetG: int("carbsTargetG"),
  fatTargetG: int("fatTargetG"),
  fiberTargetG: int("fiberTargetG"),
  waterTargetOz: int("waterTargetOz"),
  profileImageUrl: text("profileImageUrl"),
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_client_trainerId").on(t.trainerId)]);
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientId: int("clientId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  programType: mysqlEnum("programType", ["exercise", "nutrition", "hybrid"]).notNull(),
  duration: int("duration"),
  content: text("content"),
  isTemplate: boolean("isTemplate").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_program_trainerId").on(t.trainerId), index("idx_program_clientId").on(t.clientId)]);
export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

// ─── CHECK-INS ────────────────────────────────────────────────────────────────
export const checkIns = mysqlTable("checkIns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  energyLevel: int("energyLevel"),
  notes: text("notes"),
  photoUrls: text("photoUrls"),
  trainerFeedback: text("trainerFeedback"),
  // AI analysis result (stored after AI processes the check-in)
  aiAnalysis: text("aiAnalysis"),
  status: mysqlEnum("status", ["pending", "reviewed", "responded"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
}, (t) => [index("idx_checkin_clientId").on(t.clientId), index("idx_checkin_trainerId").on(t.trainerId)]);
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientId: int("clientId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"), // read receipt
  attachmentUrl: text("attachmentUrl"),
  attachmentType: varchar("attachmentType", { length: 50 }), // image, pdf, document
  attachmentName: varchar("attachmentName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_message_trainerId").on(t.trainerId),
  index("idx_message_clientId").on(t.clientId),
  index("idx_message_senderId").on(t.senderId),
]);
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientId: int("clientId").notNull(),
  sessionType: mysqlEnum("sessionType", ["in-person", "online", "adaptive"]).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_session_trainerId").on(t.trainerId), index("idx_session_clientId").on(t.clientId)]);
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ─── PACKAGES ────────────────────────────────────────────────────────────────
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sessions: int("sessions"),
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_package_trainerId").on(t.trainerId)]);
export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  packageId: int("packageId").notNull(),
  trainerId: int("trainerId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_subscription_clientId").on(t.clientId),
  index("idx_subscription_packageId").on(t.packageId),
  index("idx_subscription_trainerId").on(t.trainerId),
]);
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── LEADS ───────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_lead_trainerId").on(t.trainerId)]);
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── REFERRALS ───────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  referrerClientId: int("referrerClientId"),
  referredClientId: int("referredClientId"),
  referralCode: varchar("referralCode", { length: 50 }).unique(),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (t) => [index("idx_referral_trainerId").on(t.trainerId)]);
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── PROGRESS METRICS ────────────────────────────────────────────────────────
export const progressMetrics = mysqlTable("progressMetrics", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  metricType: mysqlEnum("metricType", ["weight", "measurement", "bloodwork", "body_composition", "photo"]),
  value: decimal("value", { precision: 8, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  notes: text("notes"),
  photoUrls: text("photoUrls"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_metric_clientId").on(t.clientId), index("idx_metric_trainerId").on(t.trainerId)]);
export type ProgressMetric = typeof progressMetrics.$inferSelect;
export type InsertProgressMetric = typeof progressMetrics.$inferInsert;

// ─── BODY COMPOSITION ────────────────────────────────────────────────────────
export const bodyComposition = mysqlTable("bodyComposition", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  bodyFatPercent: decimal("bodyFatPercent", { precision: 5, scale: 2 }),
  hydrationPercent: decimal("hydrationPercent", { precision: 5, scale: 2 }),
  muscleMass: decimal("muscleMass", { precision: 6, scale: 2 }),
  boneMass: decimal("boneMass", { precision: 6, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_composition_clientId").on(t.clientId), index("idx_composition_trainerId").on(t.trainerId)]);
export type BodyComposition = typeof bodyComposition.$inferSelect;
export type InsertBodyComposition = typeof bodyComposition.$inferInsert;

// ─── CONSULTATIONS ───────────────────────────────────────────────────────────
export const consultations = mysqlTable("consultations", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 20 }),
  consultationType: varchar("consultationType", { length: 100 }),
  scheduledTime: timestamp("scheduledTime"),
  status: mysqlEnum("status", ["pending", "scheduled", "completed", "cancelled"]).default("pending"),
  notes: text("notes"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_consultation_trainerId").on(t.trainerId), index("idx_consultation_email").on(t.clientEmail)]);
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

// ─── QUESTIONNAIRES ──────────────────────────────────────────────────────────
export const questionnaires = mysqlTable("questionnaires", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  consultationId: int("consultationId").notNull(),
  questionnaireData: text("questionnaireData"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_questionnaire_trainerId").on(t.trainerId), index("idx_questionnaire_consultationId").on(t.consultationId)]);
export type Questionnaire = typeof questionnaires.$inferSelect;
export type InsertQuestionnaire = typeof questionnaires.$inferInsert;

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  documentType: varchar("documentType", { length: 100 }),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_document_trainerId").on(t.trainerId)]);
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientId: int("clientId"),
  consultationId: int("consultationId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd"),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled"]).default("pending"),
  paymentType: varchar("paymentType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_payment_trainerId").on(t.trainerId), index("idx_payment_clientId").on(t.clientId)]);
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── SERVICES ────────────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  serviceType: varchar("serviceType", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: int("duration"),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_service_trainerId").on(t.trainerId)]);
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── LOCAL AUTH ──────────────────────────────────────────────────────────────
export const localAuth = mysqlTable("localAuth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_localAuth_email").on(t.email), index("idx_localAuth_userId").on(t.userId)]);
export type LocalAuth = typeof localAuth.$inferSelect;
export type InsertLocalAuth = typeof localAuth.$inferInsert;

// ─── PASSWORD RESET TOKENS ────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_prt_userId").on(t.userId), index("idx_prt_token").on(t.token)]);
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// ─── EMAIL VERIFICATION TOKENS ────────────────────────────────────────────────
export const emailVerificationTokens = mysqlTable("emailVerificationTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_evt_userId").on(t.userId), index("idx_evt_token").on(t.token)]);
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

// ─── ACTIVE SESSIONS ─────────────────────────────────────────────────────────
export const activeSessions = mysqlTable("activeSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 512 }).notNull(),
  deviceInfo: varchar("deviceInfo", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_session_userId").on(t.userId), index("idx_session_token").on(t.sessionToken)]);
export type ActiveSession = typeof activeSessions.$inferSelect;

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  trainerId: int("trainerId"),
  action: varchar("action", { length: 100 }).notNull(), // login, logout, password_change, etc.
  entityType: varchar("entityType", { length: 50 }), // client, program, subscription, etc.
  entityId: int("entityId"),
  details: text("details"), // JSON
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_audit_userId").on(t.userId), index("idx_audit_trainerId").on(t.trainerId), index("idx_audit_action").on(t.action)]);
export type AuditLog = typeof auditLogs.$inferSelect;

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trainerId: int("trainerId"),
  type: varchar("type", { length: 100 }).notNull(), // new_message, check_in_reminder, appointment, achievement, etc.
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON payload
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_notif_userId").on(t.userId), index("idx_notif_trainerId").on(t.trainerId)]);
export type Notification = typeof notifications.$inferSelect;

// ─── PUSH TOKENS ─────────────────────────────────────────────────────────────
export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("idx_pushToken_userId").on(t.userId)]);
export type PushToken = typeof pushTokens.$inferSelect;

// ─── HABIT TEMPLATES ─────────────────────────────────────────────────────────
export const habitTemplates = mysqlTable("habitTemplates", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  clientId: int("clientId"), // null = trainer-wide template
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["steps", "water", "sleep", "supplements", "meditation", "workout", "custom"]).notNull(),
  unit: varchar("unit", { length: 50 }), // steps, oz, hours, etc.
  dailyTarget: decimal("dailyTarget", { precision: 8, scale: 2 }),
  icon: varchar("icon", { length: 50 }), // emoji or icon name
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_habit_trainerId").on(t.trainerId), index("idx_habit_clientId").on(t.clientId)]);
export type HabitTemplate = typeof habitTemplates.$inferSelect;
export type InsertHabitTemplate = typeof habitTemplates.$inferInsert;

// ─── HABIT ENTRIES ───────────────────────────────────────────────────────────
export const habitEntries = mysqlTable("habitEntries", {
  id: int("id").autoincrement().primaryKey(),
  habitTemplateId: int("habitTemplateId").notNull(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  value: decimal("value", { precision: 8, scale: 2 }), // actual value logged
  completed: boolean("completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_habitEntry_clientId").on(t.clientId),
  index("idx_habitEntry_templateId").on(t.habitTemplateId),
  index("idx_habitEntry_date").on(t.date),
]);
export type HabitEntry = typeof habitEntries.$inferSelect;
export type InsertHabitEntry = typeof habitEntries.$inferInsert;

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  category: mysqlEnum("category", ["streak", "workout", "weight", "nutrition", "engagement", "milestone"]).notNull(),
  criteria: text("criteria").notNull(), // JSON: { type, threshold, unit }
  points: int("points").default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_achievement_slug").on(t.slug)]);
export type Achievement = typeof achievements.$inferSelect;

// ─── ACHIEVEMENT UNLOCKS ─────────────────────────────────────────────────────
export const achievementUnlocks = mysqlTable("achievementUnlocks", {
  id: int("id").autoincrement().primaryKey(),
  achievementId: int("achievementId").notNull(),
  clientId: int("clientId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  notified: boolean("notified").default(false),
}, (t) => [
  index("idx_unlock_clientId").on(t.clientId),
  index("idx_unlock_achievementId").on(t.achievementId),
]);
export type AchievementUnlock = typeof achievementUnlocks.$inferSelect;

// ─── CLIENT RISK SCORES ──────────────────────────────────────────────────────
export const clientRiskScores = mysqlTable("clientRiskScores", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().unique(),
  trainerId: int("trainerId").notNull(),
  score: int("score").notNull().default(0), // 0-100, higher = higher risk
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low"),
  // Component scores
  missedWorkouts: int("missedWorkouts").default(0),
  missedCheckIns: int("missedCheckIns").default(0),
  messageResponseDays: decimal("messageResponseDays", { precision: 4, scale: 1 }),
  engagementTrend: mysqlEnum("engagementTrend", ["improving", "stable", "declining"]).default("stable"),
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().notNull(),
  notes: text("notes"),
}, (t) => [index("idx_risk_clientId").on(t.clientId), index("idx_risk_trainerId").on(t.trainerId)]);
export type ClientRiskScore = typeof clientRiskScores.$inferSelect;

// ─── FOOD SUBSTITUTIONS ──────────────────────────────────────────────────────
export const foodSubstitutions = mysqlTable("foodSubstitutions", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  primaryFood: varchar("primaryFood", { length: 255 }).notNull(),
  substituteFood: varchar("substituteFood", { length: 255 }).notNull(),
  caloriesMatch: boolean("caloriesMatch").default(true),
  proteinMatch: boolean("proteinMatch").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_sub_trainerId").on(t.trainerId)]);
export type FoodSubstitution = typeof foodSubstitutions.$inferSelect;

// ─── GROCERY LISTS ───────────────────────────────────────────────────────────
export const groceryLists = mysqlTable("groceryLists", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  items: text("items").notNull(), // JSON: [{name, quantity, category}]
  weekStartDate: varchar("weekStartDate", { length: 10 }), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_grocery_clientId").on(t.clientId)]);
export type GroceryList = typeof groceryLists.$inferSelect;

// ─── AI SUMMARIES ────────────────────────────────────────────────────────────
export const aiSummaries = mysqlTable("aiSummaries", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  summaryType: mysqlEnum("summaryType", ["check_in", "program_progression", "nutrition_adjustment", "weekly_summary"]).notNull(),
  content: text("content").notNull(), // JSON: {summary, concerns, recommendations}
  sourceId: int("sourceId"), // check_in id or program id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_ai_clientId").on(t.clientId), index("idx_ai_trainerId").on(t.trainerId)]);
export type AiSummary = typeof aiSummaries.$inferSelect;

// ─── WEEKLY COACH SUMMARIES ──────────────────────────────────────────────────
export const weeklyCoachSummaries = mysqlTable("weeklyCoachSummaries", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  weekStartDate: varchar("weekStartDate", { length: 10 }).notNull(), // YYYY-MM-DD (Monday)
  // Metrics snapshot
  activeClients: int("activeClients").default(0),
  atRiskClients: int("atRiskClients").default(0),
  newLeads: int("newLeads").default(0),
  checkInCompletionPct: decimal("checkInCompletionPct", { precision: 5, scale: 2 }),
  weeklyRevenue: decimal("weeklyRevenue", { precision: 10, scale: 2 }),
  retentionRate: decimal("retentionRate", { precision: 5, scale: 2 }),
  // AI narrative
  aiSummary: text("aiSummary"),
  highlights: text("highlights"), // JSON array of strings
  actions: text("actions"),       // JSON array of recommended actions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_weekly_trainerId").on(t.trainerId)]);
export type WeeklyCoachSummary = typeof weeklyCoachSummaries.$inferSelect;

// ─── FORM TEMPLATES ──────────────────────────────────────────────────────────
export const formTemplates = mysqlTable("formTemplates", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["onboarding", "ongoing", "legal", "screening"]).notNull(),
  fields: text("fields").notNull(),
  isClientFacing: boolean("isClientFacing").default(true).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("idx_formTemplate_slug").on(t.slug)]);
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;

// ─── FORM SUBMISSIONS ────────────────────────────────────────────────────────
export const formSubmissions = mysqlTable("formSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  formTemplateId: int("formTemplateId").notNull(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  responses: text("responses").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  trainerNotes: text("trainerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_formSubmission_clientId").on(t.clientId),
  index("idx_formSubmission_trainerId").on(t.trainerId),
  index("idx_formSubmission_templateId").on(t.formTemplateId),
]);
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;
