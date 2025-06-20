import { db } from "@/db";
import { participants, teams, teamMembers } from "@/db/schema";
import { participantsDBType } from "@/zod/userSchema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Participants utility functions for database operations
 * 
 * This module provides CRUD operations for participant management using Drizzle ORM.
 * Participants can be associated with teams and have unique email addresses.
 */

/**
 * Retrieves participants from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional participant ID to filter by
 * @param params.email - Optional email to filter by
 * @param params.institude - Optional institute name to filter by
 * @returns Promise<participantsDBType[]> - Array of participant objects matching the criteria
 * 
 * @example
 * // Get all participants
 * const allParticipants = await getParticipants();
 * 
 * // Get specific participant by ID
 * const participant = await getParticipants({ id: 123 });
 * 
 * // Get participants from specific institute
 * const instituteParticipants = await getParticipants({ institude: "MIT" });
 */
export async function getParticipants({ id, email, institude }: { id?: number; email?: string; institude?: string } = {}) {
  const baseQuery = db.select().from(participants);
  
  if (id) {
    baseQuery.where(eq(participants.id, id));
  } else if (email) {
    baseQuery.where(eq(participants.email, email));
  } else if (institude) {
    baseQuery.where(eq(participants.institude, institude));
  }
  
  const data = await baseQuery;
  return data;
}

/**
 * Creates a new participant in the database
 * 
 * @param params - Parameters object
 * @param params.participant - Participant data conforming to participantsDBType schema
 * @returns Promise<participantsDBType[]> - Array containing the newly created participant, or empty array if creation failed
 * 
 * @example
 * const newParticipant = {
 *   name: "Alice Johnson",
 *   email: "alice@example.com",
 *   institude: "Stanford University",
 *   phoneNumber: "+1234567890"
 * };
 * const result = await createParticipant({ participant: newParticipant });
 */
export async function createParticipant({ participant }: { participant: participantsDBType }) {
  const response = await db.insert(participants).values(participant).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getParticipants({ id: response[0].id });
}

/**
 * Deletes a participant from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required participant ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if participant still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteParticipant({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Participant successfully deleted");
 * }
 */
export async function deleteParticipant({ id }: { id: number }) {
  // First remove from any teams
  await db.delete(teamMembers).where(eq(teamMembers.memberId, id));
  
  // Delete participant
  await db.delete(participants).where(eq(participants.id, id));
  
  const data = await getParticipants({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing participant in the database
 * 
 * @param params - Parameters object
 * @param params.participant - Participant data with ID field required for update operation
 * @returns Promise<participantsDBType[]> - Array containing the updated participant, or empty array if participant.id is missing
 * 
 * @example
 * const updatedParticipant = {
 *   id: 123,
 *   name: "Alice Smith",
 *   email: "alice.smith@example.com",
 *   institude: "MIT",
 *   phoneNumber: "+1234567890"
 * };
 * const result = await updateParticipant({ participant: updatedParticipant });
 */
export async function updateParticipant({ participant }: { participant: participantsDBType }) {
  if (!participant.id) return [];
  
  await db.update(participants).set({ ...participant }).where(eq(participants.id, participant.id));
  
  return await getParticipants({ id: participant.id });
}

/**
 * Checks if a participant exists by email
 * 
 * @param params - Parameters object
 * @param params.email - Email address to check
 * @returns Promise<boolean> - Returns true if participant with email exists, false otherwise
 * 
 * @example
 * const exists = await participantExists({ email: "participant@example.com" });
 */
export async function participantExists({ email }: { email: string }) {
  const data = await getParticipants({ email });
  return data.length > 0;
}

/**
 * Retrieves participants with their team information
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional participant ID to filter by
 * @param params.teamId - Optional team ID to filter participants by team
 * @returns Promise<participantsWithTeamType[]> - Array of participants with team data
 * 
 * @example
 * // Get all participants with team info
 * const participantsWithTeams = await getParticipantsWithTeam();
 * 
 * // Get participants from specific team
 * const teamParticipants = await getParticipantsWithTeam({ teamId: 456 });
 */
export async function getParticipantsWithTeam({ 
  id, 
  teamId, 
  offset = 0 
}: { 
  id?: number; 
  teamId?: number; 
  limit?: number; 
  offset?: number; 
} = {}) {
  // Build conditions array for proper filtering
  const conditions = [];
  if (id) conditions.push(eq(participants.id, id));
  if (teamId) conditions.push(eq(teams.id, teamId));

  // Use INNER JOINs for better performance when you need team data
  const baseQuery = db
    .select({
      id: participants.id,
      name: participants.name,
      email: participants.email,
      institude: participants.institude,
      phoneNumber: participants.phoneNumber,
      createdAt: participants.createdAt,
      updatedAt: participants.updatedAt,
      teamId: teams.id,
      teamName: teams.teamName,
      teamLeaderId: teams.leaderId,
      teamCreatedAt: teams.createdAt,
    })
    .from(participants)
    .innerJoin(teamMembers, eq(participants.id, teamMembers.memberId)) // INNER JOIN - only participants with teams
    .innerJoin(teams, eq(teamMembers.teamId, teams.id)) // INNER JOIN - ensures team data exists
    .orderBy(participants.createdAt)
    .offset(offset);

  // Apply conditions properly
  if (conditions.length === 1) {
    baseQuery.where(conditions[0]);
  } else if (conditions.length > 1) {
    baseQuery.where(and(...conditions));
  }

  return await baseQuery;
}


/**
 * Validates if a participant can be added to a team (exists and not already in another team)
 * 
 * @param params - Parameters object
 * @param params.participantId - Participant ID to validate
 * @returns Promise<boolean> - Returns true if participant can join a team, false otherwise
 * 
 * @example
 * const canJoinTeam = await validateParticipantForTeam({ participantId: 123 });
 * if (!canJoinTeam) {
 *   throw new Error("Participant cannot join team");
 * }
 */
export async function validateParticipantForTeam({ participantId }: { participantId: number }) {
  // Single query to check both existence and team membership
  const result = await db
    .select({
      participantExists: sql<boolean>`${participants.id} IS NOT NULL`,
      hasTeam: sql<boolean>`${teamMembers.memberId} IS NOT NULL`
    })
    .from(participants)
    .leftJoin(teamMembers, eq(participants.id, teamMembers.memberId))
    .where(eq(participants.id, participantId))
    .limit(1);

  if (result.length === 0) return false; // Participant doesn't exist
  return result[0].participantExists && !result[0].hasTeam; // Exists but not in a team
}
/**
 * Gets team members for a specific participant (if they are a team leader)
 * 
 * @param params - Parameters object
 * @param params.leaderId - Leader participant ID
 * @returns Promise<participantsDBType[]> - Array of team members
 * 
 * @example
 * const teamMembers = await getTeamMembersByLeader({ leaderId: 123 });
 */// REPLACE the current getTeamMembersByLeader function:
export async function getTeamMembersByLeader({ leaderId }: { leaderId: number }) {
  // Single optimized query instead of multiple sequential queries
  const members = await db
    .select({
      id: participants.id,
      name: participants.name,
      email: participants.email,
      institude: participants.institude,
      phoneNumber: participants.phoneNumber,
      createdAt: participants.createdAt,
      updatedAt: participants.updatedAt,
    })
    .from(participants)
    .innerJoin(teamMembers, eq(participants.id, teamMembers.memberId))
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teams.leaderId, leaderId));

  return members;
}


/**
 * Retrieves a list of participants with only their id and name for dropdown usage
 * 
 * @returns Promise<Array<{id: number, name: string}>> - Array of participants objects with id and name
 * 
 * @example
 * // Get participants for dropdown component
 * const participants = await getParticipantsForDropdown();
 * console.log(participants); // [{ id: 1, name: 'Alpha Innovators' }, { id: 2, Name: 'Beta Pioneers' }]
 * 
 * // Usage in React component
 * const participantsOptions = participants.map(participants => ({
 *   value: participants.id,
 *   label: participants.name
 * }));
 */
export async function getParticipantsForDropdown() {
  const data = await db.select({ 
    id: participants.id, 
    name: participants.name 
  }).from(participants);
  
  return data;
}


// ADD caching for participants dropdown
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let participantsCache: { id: number; name: string }[] | null = null;
let participantsCacheTime = 0;

export async function getParticipantsForDropdownCached() {
  const now = Date.now();
  
  if (participantsCache && (now - participantsCacheTime) < CACHE_DURATION) {
    return participantsCache;
  }
  
  participantsCache = await db.select({
    id: participants.id,
    name: participants.name
  }).from(participants).orderBy(participants.name);
  
  participantsCacheTime = now;
  return participantsCache;
}

// ADD this new function for paginated results
export async function getParticipantsWithTeamPaginated(
  page: number = 1, 
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;
  
  // Use Promise.all to run count and data queries in parallel
  const [data, totalCount] = await Promise.all([
    getParticipantsWithTeam({ limit: pageSize, offset }),
    db.select({ count: sql<number>`count(*)` }).from(participants)
  ]);

  return {
    participants: data,
    totalCount: totalCount[0].count,
    currentPage: page,
    totalPages: Math.ceil(totalCount[0].count / pageSize),
    hasNextPage: page * pageSize < totalCount[0].count,
    hasPreviousPage: page > 1
  };
}
