import { relations } from "drizzle-orm/relations";
import { sessions, jurry, users, marks, teams, teamMembers } from "./schema";

export const jurryRelations = relations(jurry, ({one}) => ({
	session: one(sessions, {
		fields: [jurry.session],
		references: [sessions.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	jurries: many(jurry),
	marks: many(marks),
}));

export const marksRelations = relations(marks, ({one}) => ({
	user: one(users, {
		fields: [marks.juryId],
		references: [users.id]
	}),
	session: one(sessions, {
		fields: [marks.session],
		references: [sessions.id]
	}),
	team: one(teams, {
		fields: [marks.teamId],
		references: [teams.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	marks: many(marks),
	teams: many(teams),
	teamMembers: many(teamMembers),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	marks: many(marks),
	user: one(users, {
		fields: [teams.leaderId],
		references: [users.id]
	}),
	teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user: one(users, {
		fields: [teamMembers.memberId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
}));