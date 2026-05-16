import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  isDoctor: boolean("is_doctor").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export const casesTable = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  gender: varchar("gender"),
  birthDate: varchar("birth_date"),
  age: integer("age"),
  department: varchar("department"),
  admissionDate: varchar("admission_date"),
  diagnosis: text("diagnosis"),
  medications: text("medications"),
  procedures: text("procedures"),
  hasGeneticTest: boolean("has_genetic_test").default(false),
  admissionType: varchar("admission_type"),
  arrivalType: varchar("arrival_type"),
  deathStatus: boolean("death_status").default(false),
  notes: text("notes"),
  rawConversation: jsonb("raw_conversation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertCase = typeof casesTable.$inferInsert;
export type Case = typeof casesTable.$inferSelect;
