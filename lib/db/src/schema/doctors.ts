import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "rejected"]);

export const doctorProfilesTable = pgTable("doctor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  specialty: varchar("specialty").notNull(),
  hospital: varchar("hospital"),
  bio: text("bio"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DoctorProfile = typeof doctorProfilesTable.$inferSelect;
export type InsertDoctorProfile = typeof doctorProfilesTable.$inferInsert;

export const doctorInvitationsTable = pgTable("doctor_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  doctorId: varchar("doctor_id").notNull(),
  status: invitationStatusEnum("status").notNull().default("pending"),
  patientMessage: text("patient_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DoctorInvitation = typeof doctorInvitationsTable.$inferSelect;
export type InsertDoctorInvitation = typeof doctorInvitationsTable.$inferInsert;

export const doctorPatientMessagesTable = pgTable("doctor_patient_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DoctorPatientMessage = typeof doctorPatientMessagesTable.$inferSelect;
export type InsertDoctorPatientMessage = typeof doctorPatientMessagesTable.$inferInsert;
