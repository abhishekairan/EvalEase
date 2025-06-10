import { db } from "../index";
import { teamDataSchema, TeamDBType } from "@/zod";
import { teamMembers, teams, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

/**
 * Retrieves teams from the database with optional filtering
 *
 * @param id - Unique team ID to fetch a specific team
 * @returns Promise<TeamDBType[]> - Array of teams matching the criteria
 */
export async function getTeams(id?: number) {
  if (id) {
    const response = await db.select().from(teams).where(eq(teams.id, id));
    return response;
  }

  const response = await db.select().from(teams);
  return response;
}

/**
 * Retrieves team data with leader information
 * @param id - Team ID to fetch
 * @returns Promise<TeamDataType[]> - Team with populated leader data
 */
export async function getTeamData(id?: number) {
  if (id) {
    const response = await db
      .select({
        id: teams.id,
        teamName: teams.teamName,
        leaderId: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .innerJoin(users, eq(teams.leaderId, users.id))
      .where(eq(teams.id, id));
    return response;
  }
  
  const response = await db
    .select({
      id: teams.id,
      teamName: teams.teamName,
      leaderId: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
    })
    .from(teams)
    .innerJoin(users, eq(teams.leaderId, users.id));
  return response;
}

/**
 * Creates a new team in the database
 *
 * @param team - Team data conforming to TeamDBType schema
 * @returns Promise<TeamDBType[]> - Array containing the created team
 */
export async function insertTeam(team: TeamDBType) {
  const { id } = (await db.insert(teams).values(team).$returningId())[0];
  const teamObj = await getTeams(id);
  return teamObj;
}

/**
 * Deletes a team from the database
 *
 * @param id - ID of the team to delete
 * @returns Promise<TeamDBType[]> - Empty array if deletion was successful
 */
export async function deleteTeam(id: number) {
  await db.delete(teams).where(eq(teams.id, id));
  const team = await getTeams(id);
  return team;
}

/**
 * Updates an existing team in the database
 *
 * @param team - Updated team data with ID included
 * @returns Promise<TeamDBType[]> - Array containing the updated team
 */
export async function updateTeam(team: TeamDBType) {
  await db.update(teams).set({ ...team }).where(eq(teams.id, team.id));
  return await getTeams(team.id);
}


/**
 * Retrieves comprehensive team information including team details and all member information
 * @param teamId - Team ID to fetch complete information for
 * @returns Promise<TeamWithMembersType | null> - Complete team data with members or null if not found
 */
export async function getTeamWithMembers(teamId: number) {
  const teamWithMembersQuery = await db
    .select({
      // Team information
      teamId: teams.id,
      teamName: teams.teamName,
      teamCreatedAt: teams.createdAt,
      teamUpdatedAt: teams.updatedAt,
      
      // Leader information
      leaderId: users.id,
      leaderName: users.name,
      leaderEmail: users.email,
      leaderRole: users.role,
      leaderPhoneNumber: users.phoneNumber,
      leaderCreatedAt: users.createdAt,
      leaderUpdatedAt: users.updatedAt,
      
      // Member information (will be null for the leader row)
      memberId: sql<number | null>`member_users.id`,
      memberName: sql<string | null>`member_users.name`,
      memberEmail: sql<string | null>`member_users.email`,
      memberRole: sql<string | null>`member_users.role`,
      memberJoinedAt: sql<Date | null>`team_members.created_at`,
    })
    .from(teams)
    .innerJoin(users, eq(teams.leaderId, users.id))
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .leftJoin(
      alias(users, 'member_users'), 
      eq(teamMembers.memberId, sql`member_users.id`)
    )
    .where(eq(teams.id, teamId));

  if (teamWithMembersQuery.length === 0) {
    return null;
  }

  // Transform the flat result into a structured object
  const firstRow = teamWithMembersQuery[0];
  
  const teamData = {
    id: firstRow.teamId,
    teamName: firstRow.teamName,
    createdAt: firstRow.teamCreatedAt,
    updatedAt: firstRow.teamUpdatedAt,
    leaderId: {
      id: firstRow.leaderId,
      name: firstRow.leaderName,
      email: firstRow.leaderEmail,
      role: firstRow.leaderRole,
      phoneNumber: firstRow.leaderPhoneNumber,
      createdAt: firstRow.leaderCreatedAt,
      updatedAt: firstRow.leaderUpdatedAt,
    },
    members: [] as Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      joinedAt: Date;
    }>
  };

  // Extract unique members (excluding null entries)
  const uniqueMembers = teamWithMembersQuery
    .filter(row => row.memberId !== null)
    .reduce((acc, row) => {
      const existingMember = acc.find(member => member.id === row.memberId);
      if (!existingMember && row.memberId) {
        acc.push({
          id: row.memberId,
          name: row.memberName!,
          email: row.memberEmail!,
          role: row.memberRole!,
          joinedAt: row.memberJoinedAt!,
        });
      }
      return acc;
    }, [] as Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      joinedAt: Date;
    }>);

  teamData.members = uniqueMembers;
    const result = teamDataSchema.safeParse(teamData)
    if(result.success) return result.data
  return [];
}