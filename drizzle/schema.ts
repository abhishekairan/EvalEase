import { mysqlTable, mysqlSchema, AnyMySqlColumn, unique, int, varchar, timestamp, foreignKey } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const admin = mysqlTable("admin", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("admin_email_unique").on(table.email),
]);

export const creds = mysqlTable("creds", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 512 }).notNull(),
},
(table) => [
	unique("creds_email_unique").on(table.email),
]);

export const jurry = mysqlTable("jurry", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	session: int().default('NULL').references(() => sessions.id),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("jurry_email_unique").on(table.email),
]);

export const marks = mysqlTable("marks", {
	id: int().autoincrement().notNull(),
	teamId: int("team_id").notNull().references(() => teams.id),
	juryId: int("jury_id").notNull().references(() => users.id),
	session: int().notNull().references(() => sessions.id),
	innovationScore: int("innovation_score").notNull(),
	presentationScore: int("presentation_score").notNull(),
	technicalScore: int("technical_score").notNull(),
	impactScore: int("impact_score").notNull(),
	submitted: tinyint().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const sessions = mysqlTable("sessions", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	startedAt: timestamp({ mode: 'string' }).default('NULL'),
	endedAt: timestamp({ mode: 'string' }).default('NULL'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const teams = mysqlTable("teams", {
	id: int().autoincrement().notNull(),
	teamName: varchar("team_name", { length: 255 }).notNull(),
	leaderId: int("leader_id").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const teamMembers = mysqlTable("team_members", {
	id: int().autoincrement().notNull(),
	teamId: int("team_id").notNull().references(() => teams.id),
	memberId: int("member_id").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	institude: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("users_email_unique").on(table.email),
]);
