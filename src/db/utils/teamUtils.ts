import { db } from "../index";
import { teamDataSchema, TeamDataType, TeamDBType } from "@/zod";
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
          phoneNumber: users.phoneNumber,
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

export async function getTeamDetails(teamId: number): Promise<TeamDataType | null> {
  try {
    // Get the team with leader information
    const teamWithLeader = await db
      .select({
        id: teams.id,
        teamName: teams.teamName,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        leader: {
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(teams)
      .innerJoin(users, eq(teams.leaderId, users.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamWithLeader.length === 0) {
      return null;
    }

    const team = teamWithLeader[0];

    // Get all team members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.memberId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    // Format the response according to TeamDataType
    const teamData: TeamDataType = {
      id: team.id,
      teamName: team.teamName,
      leaderId: team.leader,
      members: members,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    return teamData;
  } catch (error) {
    console.error('Error fetching team details:', error);
    throw new Error('Failed to fetch team details');
  }
}

// Alternative function to get all teams
export async function getAllTeamsDetails(): Promise<TeamDataType[]> {
  try {
    // Get all teams with leader information
    const teamsWithLeaders = await db
      .select({
        id: teams.id,
        teamName: teams.teamName,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        leader: {
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(teams)
      .innerJoin(users, eq(teams.leaderId, users.id));

    // Get all team members for all teams
    const allMembers = await db
      .select({
        teamId: teamMembers.teamId,
        member: {
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.memberId, users.id));

    // Group members by team ID
    const membersByTeam = allMembers.reduce((acc, item) => {
      if (!acc[item.teamId]) {
        acc[item.teamId] = [];
      }
      acc[item.teamId].push(item.member);
      return acc;
    }, {} as Record<number, typeof allMembers[0]['member'][]>);

    // Format the response
    const teamsData: TeamDataType[] = teamsWithLeaders.map(team => ({
      id: team.id,
      teamName: team.teamName,
      leaderId: team.leader,
      members: membersByTeam[team.id] || [],
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return teamsData;
  } catch (error) {
    console.error('Error fetching all teams details:', error);
    throw new Error('Failed to fetch teams details');
  }
}
