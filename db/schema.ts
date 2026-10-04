import { pgTable, text, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

// "Report Staff" submissions from students.
export const staffReports = pgTable("staff_reports", {
  id: text().primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull().default(""),
  className: text("class_name").notNull().default(""),
  staff: text().notNull(),
  issue: text().notNull(),
  status: text().notNull().default("Open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("staff_reports_student_idx").on(t.studentId)]);

// "Report Student" complaints from students.
export const studentReports = pgTable("student_reports", {
  id: text().primaryKey(),
  fromStudentId: text("from_student_id").notNull(),
  fromStudentName: text("from_student_name").notNull().default(""),
  againstStudentName: text("against_student_name").notNull(),
  againstClassName: text("against_class_name").notNull().default(""),
  againstRoll: text("against_roll").notNull().default(""),
  againstSection: text("against_section").notNull().default(""),
  issue: text().notNull(),
  status: text().notNull().default("Open"),
  date: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("student_reports_from_idx").on(t.fromStudentId)]);

// Weekly teacher ratings — one per student per week.
export const teacherRatings = pgTable("teacher_ratings", {
  id: text().primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull().default(""),
  teacher: text().notNull(),
  week: text().notNull(),
  month: text().notNull(),
  score: integer().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("teacher_ratings_student_week_idx").on(t.studentId, t.week)]);

// Everyday attendance — one record per student per date.
export const attendance = pgTable("attendance", {
  id: text().primaryKey(),
  studentId: text("student_id").notNull(),
  date: text().notNull(),
  studentName: text("student_name").notNull().default(""),
  className: text("class_name").notNull().default(""),
  section: text().notNull().default(""),
  roll: text().notNull().default(""),
  status: text().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("attendance_student_date_idx").on(t.studentId, t.date)]);

// Monthly fees — one record per student per month, toggled Paid/Due by admin.
export const payments = pgTable("payments", {
  id: text().primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull().default(""),
  className: text("class_name").notNull().default(""),
  month: text().notNull(),
  amount: integer().notNull().default(0),
  dueDate: text("due_date").notNull(),
  status: text().notNull().default("Due"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("payments_student_month_idx").on(t.studentId, t.month)]);

// Browser Web Push subscriptions (self-hosted, VAPID).
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text().primaryKey(),
  p256dh: text().notNull(),
  auth: text().notNull(),
  role: text(),
  studentId: text("student_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Small key/value store for server config (e.g. generated VAPID keys).
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});
