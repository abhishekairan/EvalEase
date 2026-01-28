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
  isDraft: boolean('is_draft').default(true).notNull(),
  publishedAt: timestamp('published_at'),
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
export const jury = mysqlTable('jury',{
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  role: varchar('role', { length: 255 }).notNull().default('jury'),
  ...timestamps,
})

// Jury-Sessions junction table (many-to-many relationship)
export const jurySessions = mysqlTable('jury_sessions', {
  id: int('id').autoincrement().primaryKey(),
  juryId: int('jury_id').notNull().references(() => jury.id, {onDelete: 'cascade'}),
  sessionId: int('session_id').notNull().references(() => sessions.id, {onDelete: 'cascade'}),
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
  room: varchar('room', {length: 255}),
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
  juryId: int('jury_id').notNull().references(()=> jury.id, {onDelete: 'cascade'}),
  session: int('session').references(() => sessions.id, {onDelete: 'cascade'}).notNull(),
  feasibilityScore: int('feasibility_score').notNull(),
  techImplementationScore: int('tech_implementation_score').notNull(),
  innovationCreativityScore: int('innovation_creativity_score').notNull(),
  problemRelevanceScore: int('problem_relevance_score').notNull(),
  submitted: boolean('submitted').default(false).notNull(),
  locked: boolean('locked').default(false).notNull(),
  ...timestamps,
});
