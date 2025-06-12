import { db } from "../index";
import { TeamMemberDBType, TeamMemberDataType } from "@/zod";
import { teamMembers, teams, users } from "../schema";
import { eq } from "drizzle-orm";
import { getTeamData } from "./teamUtils";

/**
 * Retrieves team members from the database with optional filtering
 *
 * @param id - Unique team member ID to fetch a specific member
 * @param teamId - Team ID to fetch all members of a specific team
 * @returns Promise<TeamMemberDBType[]> - Array of team members matching the criteria
 */
export async function getTeamMembers(id?: number, teamId?: number) {
  if (id) {
    const response = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return response;
  } else if (teamId) {
    const response = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
    return response;
  }

  const response = await db.select().from(teamMembers);
  return response;
}

/**
 * Retrieves team member data with team and member information
 * @param id - Team member ID to fetch
 * @param teamId - Team ID to fetch all members
 * @returns Promise<TeamMemberDataType[]> - Team members with populated data
 */
export async function getTeamMemberData(id?: number, teamId?: number) {
  const baseQuery = db
    .select({
      id: teamMembers.id,
      teamId: {
        id: teams.id,
        teamName: teams.teamName,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      },
      memberId: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .innerJoin(users, eq(teamMembers.memberId, users.id));

  if (id) {
    const response = await baseQuery.where(eq(teamMembers.id, id));
    return response;
  } else if (teamId) {
    const response = await baseQuery.where(eq(teamMembers.teamId, teamId));
    return response;
  }
  
  const response = await baseQuery;
  return response;
}

/**
 * Retrieves comprehensive team information including all members and their details
 * @param teamId - Team ID to fetch complete information
 * @returns Promise with team data, leader info, and all team members
 */
export async function getCompleteTeamData(teamId: number) {
  const teamData = await getTeamData(teamId);
  const memberData = await getTeamMemberData(undefined, teamId);
  
  if (teamData.length === 0) {
    return null;
  }
  
  return {
    team: teamData[0],
    members: memberData,
    totalMembers: memberData.length + 1, // +1 for the leader
  };
}

/**
 * Adds a new member to a team
 *
 * @param teamMember - Team member data conforming to TeamMemberDBType schema
 * @returns Promise<TeamMemberDBType[]> - Array containing the created team member
 */
export async function insertTeamMember(teamMember: TeamMemberDBType) {
  const { id } = (await db.insert(teamMembers).values(teamMember).$returningId())[0];
  const teamMemberObj = await getTeamMembers(id);
  return teamMemberObj;
}

/**
 * Removes a member from a team
 *
 * @param id - ID of the team member record to delete
 * @returns Promise<TeamMemberDBType[]> - Empty array if deletion was successful
 */
export async function deleteTeamMember(id: number) {
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
  const teamMember = await getTeamMembers(id);
  return teamMember;
}

/**
 * Updates an existing team member record
 *
 * @param teamMember - Updated team member data with ID included
 * @returns Promise<TeamMemberDBType[]> - Array containing the updated team member
 */
export async function updateTeamMember(teamMember: TeamMemberDBType) {
  await db.update(teamMembers).set({ ...teamMember }).where(eq(teamMembers.id, teamMember.id));
  return await getTeamMembers(teamMember.id);
}
