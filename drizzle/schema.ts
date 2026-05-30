import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Trainer profile extending user
 */
export const trainers = mysqlTable(
  "trainers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    bio: text("bio"),
    qualifications: text("qualifications"),
    specialties: text("specialties"), // JSON array
    profileImageUrl: text("profileImageUrl"),
    socialLinks: text("socialLinks"), // JSON object
    monthlyIncomeGoal: decimal("monthlyIncomeGoal", { precision: 10, scale: 2 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_trainer_userId").on(table.userId)]
);

export type Trainer = typeof trainers.$inferSelect;
export type InsertTrainer = typeof trainers.$inferInsert;

/**
 * Client profiles
 */
export const clients = mysqlTable(
  "clients",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    age: int("age"),
    sex: mysqlEnum("sex", ["male", "female", "other"]),
    weight: decimal("weight", { precision: 6, scale: 2 }), // in lbs
    height: decimal("height", { precision: 5, scale: 2 }), // in inches
    fitnessLevel: mysqlEnum("fitnessLevel", ["beginner", "intermediate", "advanced", "elite"]),
    trainingType: mysqlEnum("trainingType", ["in-person", "online", "adaptive"]),
    goals: text("goals"), // JSON array
    injuries: text("injuries"), // JSON array
    allergies: text("allergies"), // JSON array
    dietaryRestrictions: text("dietaryRestrictions"), // JSON array
    dailyCalorieTarget: int("dailyCalorieTarget"),
    profileImageUrl: text("profileImageUrl"),
    status: mysqlEnum("status", ["active", "inactive", "paused"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_client_trainerId").on(table.trainerId)]
);

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Workout programs
 */
export const programs = mysqlTable(
  "programs",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    clientId: int("clientId"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    programType: mysqlEnum("programType", ["exercise", "nutrition", "hybrid"]).notNull(),
    duration: int("duration"), // in weeks
    content: text("content"), // JSON structure
    isTemplate: boolean("isTemplate").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_program_trainerId").on(table.trainerId), index("idx_program_clientId").on(table.clientId)]
);

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Client check-ins
 */
export const checkIns = mysqlTable(
  "checkIns",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    trainerId: int("trainerId").notNull(),
    weight: decimal("weight", { precision: 6, scale: 2 }),
    energyLevel: int("energyLevel"), // 1-10 scale
    notes: text("notes"),
    photoUrls: text("photoUrls"), // JSON array
    trainerFeedback: text("trainerFeedback"),
    status: mysqlEnum("status", ["pending", "reviewed", "responded"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    respondedAt: timestamp("respondedAt"),
  },
  (table) => [index("idx_checkin_clientId").on(table.clientId), index("idx_checkin_trainerId").on(table.trainerId)]
);

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Messages between trainer and clients
 */
export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    clientId: int("clientId").notNull(),
    senderId: int("senderId").notNull(), // trainer or client
    content: text("content").notNull(),
    isRead: boolean("isRead").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_message_trainerId").on(table.trainerId),
    index("idx_message_clientId").on(table.clientId),
    index("idx_message_senderId").on(table.senderId),
  ]
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Scheduled sessions
 */
export const sessions = mysqlTable(
  "sessions",
  {
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
  },
  (table) => [index("idx_session_trainerId").on(table.trainerId), index("idx_session_clientId").on(table.clientId)]
);

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Training packages (pricing)
 */
export const packages = mysqlTable(
  "packages",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    sessions: int("sessions"), // number of sessions
    duration: int("duration"), // in days
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_package_trainerId").on(table.trainerId)]
);

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

/**
 * Client subscriptions to packages
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    packageId: int("packageId").notNull(),
    trainerId: int("trainerId").notNull(),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),
    status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_subscription_clientId").on(table.clientId),
    index("idx_subscription_packageId").on(table.packageId),
    index("idx_subscription_trainerId").on(table.trainerId),
  ]
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Leads for client acquisition
 */
export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    source: varchar("source", { length: 100 }), // referral, social, website, etc.
    status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_lead_trainerId").on(table.trainerId)]
);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Referral tracking
 */
export const referrals = mysqlTable(
  "referrals",
  {
    id: int("id").autoincrement().primaryKey(),
    trainerId: int("trainerId").notNull(),
    referrerClientId: int("referrerClientId"),
    referredClientId: int("referredClientId"),
    referralCode: varchar("referralCode", { length: 50 }).unique(),
    rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => [index("idx_referral_trainerId").on(table.trainerId)]
);

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;