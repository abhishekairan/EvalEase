import { 
  mysqlTable,
  int,
  varchar,
  timestamp,
  boolean
} from 'drizzle-orm/mysql-core';

export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
};

// Session table
export const sessions = mysqlTable('sessions',{
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name',{length:255}).notNull(),
  startedAt: timestamp('startedAt'),
  endedAt: timestamp('endedAt'),
  ...timestamps,
})

// Admin table
export const admin = mysqlTable('admin',{
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  ...timestamps,
})

// Jury table
export const jury = mysqlTable('jurry',{
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  session: int('session').references(() => sessions.id, {onDelete: 'set null'}),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  ...timestamps,
})


// Participants table
export const participants = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  institude: varchar('institude',{length: 255}).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  ...timestamps,
});

// Credentials Table
export const creds = mysqlTable('creds',{
  id: int().autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 255 }).notNull().notNull(),
  password: varchar('password',{length:512}).notNull(),
})

// Teams table
export const teams = mysqlTable('teams', {
  id: int('id').autoincrement().primaryKey(),
  teamName: varchar('team_name', { length: 255 }).notNull(),
  leaderId: int('leader_id').notNull().references(()=> participants.id, {onDelete: 'cascade'}),
  juryId: int('juryid').references(()=>jury.id, {onDelete: 'set null'}),
  ...timestamps,
});

// Team members table
export const teamMembers = mysqlTable('team_members', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id').notNull().references(()=> teams.id, {onDelete: 'cascade'}),
  memberId: int('member_id').notNull().references(()=> participants.id, {onDelete: 'cascade'}),
  ...timestamps,
});

// Marks table
export const marks = mysqlTable('marks', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id').notNull().references(()=> teams.id, {onDelete: 'cascade'}),
  juryId: int('jury_id').notNull().references(()=> participants.id, {onDelete: 'cascade'}),
  session: int('session').references(() => sessions.id, {onDelete: 'cascade'}).notNull(),
  innovationScore: int('innovation_score').notNull(),
  presentationScore: int('presentation_score').notNull(),
  technicalScore: int('technical_score').notNull(),
  impactScore: int('impact_score').notNull(),
  submitted: boolean('submitted').default(false).notNull(),
  ...timestamps,
});
