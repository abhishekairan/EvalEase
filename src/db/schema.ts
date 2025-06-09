import { 
  mysqlTable,
  int,
  varchar,
  timestamp,
  boolean
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  role: varchar('role', { length: 10 }).notNull().$type<'admin' | 'jury' | 'student'>(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Teams table
export const teams = mysqlTable('teams', {
  id: int('id').autoincrement().primaryKey(),
  teamName: varchar('team_name', { length: 255 }).notNull(),
  leaderId: int('leader_id').notNull().references(()=> users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Team members table
export const teamMembers = mysqlTable('team_members', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id').notNull().references(()=> teams.id),
  memberId: int('member_id').notNull().references(()=> users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Marks table
export const marks = mysqlTable('marks', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id').notNull().references(()=> teams.id),
  juryId: int('jury_id').notNull().references(()=> users.id),
  innovationScore: int('innovation_score').notNull(),
  presentationScore: int('presentation_score').notNull(),
  technicalScore: int('technical_score').notNull(),
  impactScore: int('impact_score').notNull(),
  submitted: boolean('submitted').default(false).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
