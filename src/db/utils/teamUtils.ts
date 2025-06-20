import { db } from "@/db";
import { teams, participants, teamMembers } from "@/db/schema";
import { TeamDBType } from "@/zod/teamSchema";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Teams utility functions for database operations
 * 
 * This module provides CRUD operations for team management using Drizzle ORM.
 * Teams have a leader (participant) and can have multiple members through the teamMembers table.
 */

/**
 * Retrieves teams from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional team ID to filter by
 * @param params.leaderId - Optional leader ID to filter teams by leader
 * @param params.teamName - Optional team name to filter by (partial match)
 * @returns Promise<TeamDBType[]> - Array of team objects matching the criteria
 * 
 * @example
 * // Get all teams
 * const allTeams = await getTeams();
 * 
 * // Get specific team by ID
 * const team = await getTeams({ id: 123 });
 * 
 * // Get teams led by specific participant
 * const leaderTeams = await getTeams({ leaderId: 456 });
 */
export async function getTeams({ id, leaderId, teamName }: { id?: number; leaderId?: number; teamName?: string } = {}) {
  const conditions: any[] = []
  const baseQuery = db.select().from(teams);
  
  if (id) {
    conditions.push(eq(teams.id, id));
  } else if (leaderId) {
    conditions.push(eq(teams.leaderId, leaderId));
  } else if (teamName) {
    conditions.push(eq(teams.teamName, teamName));
  }
  
  if(conditions.length>0){
    const data = await baseQuery.where(conditions[0]);
    return data
  }
  const data = await baseQuery;
  return data;
}

/**
 * Creates a new team in the database
 * 
 * @param params - Parameters object
 * @param params.team - Team data conforming to TeamDBType schema
 * @returns Promise<TeamDBType[]> - Array containing the newly created team, or empty array if creation failed
 * 
 * @example
 * const newTeam = {
 *   teamName: "Innovation Squad",
 *   leaderId: 123
 * };
 * const result = await createTeam({ team: newTeam });
 */
export async function createTeam({ team }: { team: TeamDBType }) {
  // Validate that the leader exists and is not already leading another team
  const isValidLeader = await validateTeamLeader({ leaderId: team.leaderId });
  if (!isValidLeader) {
    throw new Error("Invalid leader: participant does not exist or is already leading another team");
  }

  const response = await db.insert(teams).values(team).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getTeams({ id: response[0].id });
}

/**
 * Deletes a team from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required team ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if team still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteTeam({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Team successfully deleted");
 * }
 */
export async function deleteTeam({ id }: { id: number }) {
  // First remove all team members
  await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
  
  // Delete the team
  await db.delete(teams).where(eq(teams.id, id));
  
  const data = await getTeams({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing team in the database
 * 
 * @param params - Parameters object
 * @param params.team - Team data with ID field required for update operation
 * @returns Promise<TeamDBType[]> - Array containing the updated team, or empty array if team.id is missing
 * 
 * @example
 * const updatedTeam = {
 *   id: 123,
 *   teamName: "Updated Team Name",
 *   leaderId: 456
 * };
 * const result = await updateTeam({ team: updatedTeam });
 */
export async function updateTeam({ team }: { team: TeamDBType }) {
  if (!team.id) return [];
  
  // If leaderId is being changed, validate the new leader
  if (team.leaderId) {
    const isValidLeader = await validateTeamLeader({ leaderId: team.leaderId, excludeTeamId: team.id });
    if (!isValidLeader) {
      throw new Error("Invalid leader: participant does not exist or is already leading another team");
    }
  }
  
  await db.update(teams).set({ ...team }).where(eq(teams.id, team.id));
  
  return await getTeams({ id: team.id });
}

/**
 * Retrieves teams with complete data including leader and members information
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional team ID to filter by
 * @param params.leaderId - Optional leader ID to filter teams by leader
 * @returns Promise<TeamDataType[]> - Array of teams with leader and members data
 * 
 * @example
 * // Get all teams with complete data
 * const teamsWithData = await getTeamsWithData();
 * 
 * // Get specific team with complete data
 * const teamWithData = await getTeamsWithData({ id: 123 });
 */
export async function getTeamsWithData({ id, leaderId }: { id?: number; leaderId?: number } = {}) {
  // Build conditions for teams
  const teamConditions = [];
  if (id) teamConditions.push(eq(teams.id, id));
  if (leaderId) teamConditions.push(eq(teams.leaderId, leaderId));

  // Query 1: Get teams with leaders using INNER JOIN
  const teamsQuery = db
    .select({
      id: teams.id,
      teamName: teams.teamName,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      juryid: teams.juryId,
      room: teams.room,
      leaderId: {
        id: participants.id,
        name: participants.name,
        email: participants.email,
        institude: participants.institude,
        phoneNumber: participants.phoneNumber,
        createdAt: participants.createdAt,
        updatedAt: participants.updatedAt
      }
    })
    .from(teams)
    .innerJoin(participants, eq(teams.leaderId, participants.id));

  // Apply conditions using conditional filters array
  if (teamConditions.length === 1) {
    teamsQuery.where(teamConditions[0]);
  } else if (teamConditions.length > 1) {
    teamsQuery.where(and(...teamConditions));
  }

  const teamsData = await teamsQuery;
  
  if (teamsData.length === 0) return [];

  // Query 2: Get all members for these teams using INNER JOIN
  const teamIds = teamsData.map(team => team.id);
  
  const membersData = await db
    .select({
      teamId: teamMembers.teamId,
      member: {
        id: participants.id,
        name: participants.name,
        email: participants.email,
        institude: participants.institude,
        phoneNumber: participants.phoneNumber,
        createdAt: participants.createdAt,
        updatedAt: participants.updatedAt
      }
    })
    .from(teamMembers)
    .innerJoin(participants, eq(teamMembers.memberId, participants.id))
    .where(inArray(teamMembers.teamId, teamIds));

  // Group members by team
  const membersMap = new Map<number, any[]>();
  
  for (const memberRow of membersData) {
    if (!membersMap.has(memberRow.teamId)) {
      membersMap.set(memberRow.teamId, []);
    }
    membersMap.get(memberRow.teamId)!.push(memberRow.member);
  }

  // Combine teams with their members
  return teamsData.map(team => ({
    ...team,
    members: membersMap.get(team.id) || []
  }));
}


/**
 * Validates if a participant can be a team leader
 * 
 * @param params - Parameters object
 * @param params.leaderId - Participant ID to validate as leader
 * @param params.excludeTeamId - Optional team ID to exclude from validation (for updates)
 * @returns Promise<boolean> - Returns true if participant can be a leader, false otherwise
 * 
 * @example
 * const canLead = await validateTeamLeader({ leaderId: 123 });
 * if (!canLead) {
 *   throw new Error("Participant cannot be team leader");
 * }
 */
export async function validateTeamLeader({ leaderId, excludeTeamId }: { leaderId: number; excludeTeamId?: number }) {
  // Check if participant exists
  const participantData = await db.select().from(participants).where(eq(participants.id, leaderId));
  if (participantData.length === 0) return false;
  
  // Check if participant is already leading another team
  const baseQuery = db.select().from(teams);
  
  if (excludeTeamId) {
    // For updates, exclude the current team
    baseQuery.where(and(eq(teams.id, excludeTeamId),eq(teams.leaderId, leaderId)));
  }
  baseQuery.where(eq(teams.leaderId, leaderId))
  
  const existingTeams = await baseQuery;
  if (existingTeams.length > 0 && !excludeTeamId) return false;
  if (existingTeams.length > 1 && excludeTeamId) return false;
  
  return true;
}

/**
 * Checks if a team name already exists
 * 
 * @param params - Parameters object
 * @param params.teamName - Team name to check
 * @param params.excludeTeamId - Optional team ID to exclude from check (for updates)
 * @returns Promise<boolean> - Returns true if team name exists, false otherwise
 * 
 * @example
 * const exists = await teamNameExists({ teamName: "Innovation Squad" });
 * if (exists) {
 *   throw new Error("Team name already exists");
 * }
 */
export async function teamNameExists({ teamName, excludeTeamId }: { teamName: string; excludeTeamId?: number }) {
  const baseQuery = db.select().from(teams);
  
  if (excludeTeamId) {
    // For updates, exclude the current team
    baseQuery.where(and(eq(teams.id, excludeTeamId),eq(teams.teamName, teamName)));
  }
  baseQuery.where(eq(teams.teamName, teamName))
  
  const data = await baseQuery;
  return data.length > 0;
}

/**
 * Gets the team count for analytics
 * 
 * @returns Promise<number> - Total number of teams
 * 
 * @example
 * const totalTeams = await getTeamCount();
 * console.log(`Total teams: ${totalTeams}`);
 */
export async function getTeamCount() {
  const data = await db.select().from(teams);
  return data.length;
}


/**
 * Retrieves a list of teams with only their id and name for dropdown usage
 * 
 * @returns Promise<Array<{id: number, teamName: string}>> - Array of team objects with id and teamName
 * 
 * @example
 * // Get teams for dropdown component
 * const teams = await getTeamsForDropdown();
 * console.log(teams); // [{ id: 1, teamName: 'Alpha Innovators' }, { id: 2, teamName: 'Beta Pioneers' }]
 * 
 * // Usage in React component
 * const teamOptions = teams.map(team => ({
 *   value: team.id,
 *   label: team.teamName
 * }));
 */
export async function getTeamsForDropdown() {
  const data = await db.select({ 
    id: teams.id, 
    teamName: teams.teamName 
  }).from(teams);
  
  return data;
}

export async function getTeamIds(){
  const response =  await db.select({id: teams.id}).from(teams)
  return response.map((t)=>t.id)
}

export async function updateTeamjury({teamid,juryId}:{teamid: number, juryId: number|null}){
  try{
    await db.update(teams).set({juryId: juryId}).where(eq(teams.id,teamid))
    return true
  }catch(err){
    console.error(err)
    return false
  }
}