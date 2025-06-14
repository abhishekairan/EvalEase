import { db } from "@/db";
import { teamMembers, teams, participants } from "@/db/schema";
import { TeamMemberDBType, TeamMemberDataType } from "@/zod/teamMemberSchema";
import { eq, and } from "drizzle-orm";

/**
 * Team Members utility functions for database operations
 * 
 * This module provides CRUD operations for team member management using Drizzle ORM.
 * Team members represent the many-to-many relationship between teams and participants.
 */

/**
 * Retrieves team members from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional team member ID to filter by
 * @param params.teamId - Optional team ID to filter members by team
 * @param params.memberId - Optional member (participant) ID to filter by
 * @returns Promise<TeamMemberDBType[]> - Array of team member objects matching the criteria
 * 
 * @example
 * // Get all team members
 * const allMembers = await getTeamMembers();
 * 
 * // Get members of specific team
 * const teamMembers = await getTeamMembers({ teamId: 123 });
 * 
 * // Get teams that a participant is member of
 * const memberTeams = await getTeamMembers({ memberId: 456 });
 */
export async function getTeamMembers({ id, teamId, memberId }: { id?: number; teamId?: number; memberId?: number } = {}) {
  const baseQuery = db.select().from(teamMembers);
  
  if (id) {
    baseQuery.where(eq(teamMembers.id, id));
  } else if (teamId) {
    baseQuery.where(eq(teamMembers.teamId, teamId));
  } else if (memberId) {
    baseQuery.where(eq(teamMembers.memberId, memberId));
  }
  
  const data = await baseQuery;
  return data;
}

/**
 * Adds a new member to a team
 * 
 * @param params - Parameters object
 * @param params.teamMember - Team member data conforming to TeamMemberDBType schema
 * @returns Promise<TeamMemberDBType[]> - Array containing the newly created team member, or empty array if creation failed
 * 
 * @example
 * const newMember = {
 *   teamId: 123,
 *   memberId: 456
 * };
 * const result = await addTeamMember({ teamMember: newMember });
 */
export async function addTeamMember({ teamMember }: { teamMember: TeamMemberDBType }) {
  // Validate that both team and participant exist
  const isValid = await validateTeamMemberRelation({ 
    teamId: teamMember.teamId, 
    memberId: teamMember.memberId 
  });
  
  if (!isValid) {
    throw new Error("Invalid team member relation: team or participant does not exist, or member is already in team");
  }

  const response = await db.insert(teamMembers).values(teamMember).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getTeamMembers({ id: response[0].id });
}

/**
 * Removes a member from a team
 * 
 * @param params - Parameters object
 * @param params.id - Required team member ID to remove
 * @returns Promise<boolean> - Returns true if removal was successful, false if team member still exists after removal attempt
 * 
 * @example
 * const wasRemoved = await removeTeamMember({ id: 123 });
 * if (wasRemoved) {
 *   console.log("Team member successfully removed");
 * }
 */
export async function removeTeamMember({ id }: { id: number }) {
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
  
  const data = await getTeamMembers({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Removes a member from a team by team and member IDs
 * 
 * @param params - Parameters object
 * @param params.teamId - Required team ID
 * @param params.memberId - Required member (participant) ID
 * @returns Promise<boolean> - Returns true if removal was successful, false otherwise
 * 
 * @example
 * const wasRemoved = await removeTeamMemberByIds({ teamId: 123, memberId: 456 });
 * if (wasRemoved) {
 *   console.log("Member successfully removed from team");
 * }
 */
export async function removeTeamMemberByIds({ teamId, memberId }: { teamId: number; memberId: number }) {
  await db.delete(teamMembers).where(
    and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.memberId, memberId)
    )
  );
  
  const data = await getTeamMembers({ teamId, memberId });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing team member record
 * 
 * @param params - Parameters object
 * @param params.teamMember - Team member data with ID field required for update operation
 * @returns Promise<TeamMemberDBType[]> - Array containing the updated team member, or empty array if teamMember.id is missing
 * 
 * @example
 * const updatedMember = {
 *   id: 123,
 *   teamId: 456,
 *   memberId: 789
 * };
 * const result = await updateTeamMember({ teamMember: updatedMember });
 */
export async function updateTeamMember({ teamMember }: { teamMember: TeamMemberDBType }) {
  if (!teamMember.id) return [];
  
  // Validate the new relation if teamId or memberId is being changed
  const isValid = await validateTeamMemberRelation({ 
    teamId: teamMember.teamId, 
    memberId: teamMember.memberId,
    excludeId: teamMember.id
  });
  
  if (!isValid) {
    throw new Error("Invalid team member relation: team or participant does not exist, or member is already in team");
  }
  
  await db.update(teamMembers).set({ ...teamMember }).where(eq(teamMembers.id, teamMember.id));
  
  return await getTeamMembers({ id: teamMember.id });
}

/**
 * Retrieves team members with complete data including team and participant information
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional team member ID to filter by
 * @param params.teamId - Optional team ID to filter by
 * @param params.memberId - Optional member ID to filter by
 * @returns Promise<TeamMemberDataType[]> - Array of team members with team and participant data
 * 
 * @example
 * // Get all team members with complete data
 * const membersWithData = await getTeamMembersWithData();
 * 
 * // Get team members for specific team with complete data
 * const teamMembersData = await getTeamMembersWithData({ teamId: 123 });
 */
export async function getTeamMembersWithData({ id, teamId, memberId }: { id?: number; teamId?: number; memberId?: number } = {}) {
  const membersData = await getTeamMembers({ id, teamId, memberId });
  
  const result: TeamMemberDataType[] = [];
  
  for (const member of membersData) {
    // Get team data
    const teamData = await db.select().from(teams).where(eq(teams.id, member.teamId));
    
    // Get participant data
    const participantData = await db.select().from(participants).where(eq(participants.id, member.memberId));
    
    if (teamData.length > 0 && participantData.length > 0) {
      result.push({
        ...member,
        teamId: teamData[0],
        memberId: participantData[0]
      });
    }
  }
  
  return result;
}

/**
 * Validates if a team member relation is valid
 * 
 * @param params - Parameters object
 * @param params.teamId - Team ID to validate
 * @param params.memberId - Member (participant) ID to validate
 * @param params.excludeId - Optional team member ID to exclude from validation (for updates)
 * @returns Promise<boolean> - Returns true if relation is valid, false otherwise
 * 
 * @example
 * const isValid = await validateTeamMemberRelation({ teamId: 123, memberId: 456 });
 * if (!isValid) {
 *   throw new Error("Invalid team member relation");
 * }
 */
export async function validateTeamMemberRelation({ teamId, memberId, excludeId }: { teamId: number; memberId: number; excludeId?: number }) {
  // Check if team exists
  const teamData = await db.select().from(teams).where(eq(teams.id, teamId));
  if (teamData.length === 0) return false;
  
  // Check if participant exists
  const participantData = await db.select().from(participants).where(eq(participants.id, memberId));
  if (participantData.length === 0) return false;
  
  // Check if participant is already a member of this team
  const baseQuery = db.select().from(teamMembers).where(
    and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.memberId, memberId)
    )
  );
  
  const existingMembership = await baseQuery;
  
  // If excluding an ID (for updates), filter it out
  if (excludeId && existingMembership.length > 0) {
    const filteredMembership = existingMembership.filter(m => m.id !== excludeId);
    if (filteredMembership.length > 0) return false;
  } else if (existingMembership.length > 0) {
    return false;
  }
  
  // Check if participant is the leader of this team (leaders shouldn't be members)
  const teamLeaderData = await db.select().from(teams).where(
    and(
      eq(teams.id, teamId),
      eq(teams.leaderId, memberId)
    )
  );
  
  if (teamLeaderData.length > 0) return false;
  
  return true;
}

/**
 * Gets the member count for a specific team
 * 
 * @param params - Parameters object
 * @param params.teamId - Team ID to count members for
 * @returns Promise<number> - Number of members in the team
 * 
 * @example
 * const memberCount = await getTeamMemberCount({ teamId: 123 });
 * console.log(`Team has ${memberCount} members`);
 */
export async function getTeamMemberCount({ teamId }: { teamId: number }) {
  const data = await getTeamMembers({ teamId });
  return data.length;
}

/**
 * Checks if a participant is a member of any team
 * 
 * @param params - Parameters object
 * @param params.memberId - Participant ID to check
 * @returns Promise<boolean> - Returns true if participant is a member of any team, false otherwise
 * 
 * @example
 * const isMember = await isParticipantTeamMember({ memberId: 456 });
 * if (isMember) {
 *   console.log("Participant is already in a team");
 * }
 */
export async function isParticipantTeamMember({ memberId }: { memberId: number }) {
  const data = await getTeamMembers({ memberId });
  return data.length > 0;
}

/**
 * Gets all teams that a participant is a member of
 * 
 * @param params - Parameters object
 * @param params.memberId - Participant ID
 * @returns Promise<TeamMemberDataType[]> - Array of team memberships with complete data
 * 
 * @example
 * const participantTeams = await getParticipantTeams({ memberId: 456 });
 * participantTeams.forEach(team => {
 *   console.log(`Member of team: ${team.teamId.teamName}`);
 * });
 */
export async function getParticipantTeams({ memberId }: { memberId: number }) {
  return await getTeamMembersWithData({ memberId });
}


// ADD caching for teams dropdown (since teams change less frequently)
let teamsCache: { id: number; teamName: string }[] | null = null;
let teamsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getTeamsForDropdownCached() {
  const now = Date.now();
  
  if (teamsCache && (now - teamsCacheTime) < CACHE_DURATION) {
    return teamsCache;
  }
  
  teamsCache = await db.select({
    id: teams.id,
    teamName: teams.teamName
  }).from(teams).orderBy(teams.teamName);
  
  teamsCacheTime = now;
  return teamsCache;
}
