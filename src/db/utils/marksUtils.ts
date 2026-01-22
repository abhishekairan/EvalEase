import { db } from "@/db";
import { marks, teams, sessions, jury } from "@/db/schema";
import { MarksDBType } from "@/zod/marksSchema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Marks utility functions for database operations
 * 
 * This module provides CRUD operations for marks management using Drizzle ORM.
 * Marks represent scoring data for teams by jury members (participants) in specific sessions.
 * Each mark record contains scores for feasibility, tech implementation, innovation & creativity, and problem relevance.
 */

/**
 * Retrieves marks from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional mark ID to filter by
 * @param params.teamId - Optional team ID to filter marks by team
 * @param params.juryId - Optional jury ID (participant ID) to filter marks by jury member
 * @param params.session - Optional session ID to filter marks by session
 * @param params.submitted - Optional boolean to filter by submission status
 * @returns Promise<MarksDBType[]> - Array of mark objects matching the criteria
 * 
 * @example
 * // Get all marks
 * const allMarks = await getMarks();
 * 
 * // Get marks for specific team
 * const teamMarks = await getMarks({ teamId: 123 });
 * 
 * // Get submitted marks only
 * const submittedMarks = await getMarks({ submitted: true });
 * 
 * // Get marks by jury member for specific session
 * const jurySessionMarks = await getMarks({ juryId: 456, session: 1 });
 */
export async function getMarks({ id, teamId, juryId, session, submitted }: { 
  id?: number; 
  teamId?: number; 
  juryId?: number; 
  session?: number; 
  submitted?: boolean 
} = {}) {
  const query = db.select().from(marks);

  if (id) {
    const data = await query.where(eq(marks.id, id));
    return data;
  } else {
    const conditions = [];

    if (teamId) conditions.push(eq(marks.teamId, teamId));
    if (juryId) conditions.push(eq(marks.juryId, juryId));
    if (session) conditions.push(eq(marks.session, session));
    if (submitted !== undefined) conditions.push(eq(marks.submitted, submitted));

    if (conditions.length === 1) {
      const data = await query.where(conditions[0]);
      return data;
    } else if (conditions.length > 1) {
      const data = await query.where(and(...conditions));
      return data;
    }
  }

  const data = await query;
  return data;
}

/**
 * Creates a new mark record in the database
 * 
 * @param params - Parameters object
 * @param params.mark - Mark data conforming to MarksDBType schema (without id, createdAt, updatedAt)
 * @returns Promise<MarksDBType[]> - Array containing the newly created mark, or empty array if creation failed
 * 
 * @example
 * const newMark = {
 *   teamId: 123,
 *   juryId: 456,
 *   session: 1,
 *   feasibilityScore: 20,
 *   techImplementationScore: 18,
 *   innovationCreativityScore: 22,
 *   problemRelevanceScore: 20,
 *   submitted: false
 * };
 * const result = await createMark({ mark: newMark });
 */
export async function createMark({ mark }: { mark: Omit<MarksDBType, 'id' | 'createdAt' | 'updatedAt'> }) {
  // Validate foreign key relations
  // console.log("Creating mark:", mark);
  const isValid = await validateMarkRelations({ 
    teamId: mark.teamId, 
    juryId: mark.juryId, 
    session: mark.session 
  });
  
  if (!isValid) {
    throw new Error("Invalid mark relations: team, jury participant, or session does not exist");
  }

  // Check if mark already exists for this team-jury-session combination
  const existingMark = await getMarks({ 
    teamId: mark.teamId, 
    juryId: mark.juryId,
    session: mark.session
  });
  
  if (existingMark.length > 0) {
    throw new Error("Mark already exists for this team-jury-session combination");
  }
  const response = await db.insert(marks).values(mark).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getMarks({ id: response[0].id });
}

/**
 * Deletes a mark record from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required mark ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if mark still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteMark({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Mark successfully deleted");
 * }
 */
export async function deleteMark({ id }: { id: number }) {
  await db.delete(marks).where(eq(marks.id, id));
  
  const data = await getMarks({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing mark record in the database
 * 
 * @param params - Parameters object
 * @param params.mark - Mark data with ID field required for update operation
 * @returns Promise<MarksDBType[]> - Array containing the updated mark, or empty array if mark.id is missing
 * 
 * @example
 * const updatedMark = {
 *   id: 123,
 *   teamId: 456,
 *   juryId: 789,
 *   session: 1,
 *   feasibilityScore: 22,
 *   techImplementationScore: 20,
 *   innovationCreativityScore: 24,
 *   problemRelevanceScore: 22,
 *   submitted: true
 * };
 * const result = await updateMark({ mark: updatedMark });
 */
export async function updateMark({ mark }: { mark: MarksDBType }) {
  if (!mark.id) return [];
  
  // Validate foreign key relations if they are being changed
  const isValid = await validateMarkRelations({ 
    teamId: mark.teamId, 
    juryId: mark.juryId, 
    session: mark.session 
  });
  
  if (!isValid) {
    throw new Error("Invalid mark relations: team, jury participant, or session does not exist");
  }
  
  const { id, ...updateData } = mark;
  await db.update(marks).set(updateData).where(eq(marks.id, id));
  
  return await getMarks({ id: mark.id });
}

/**
 * Retrieves marks with complete data including team and jury participant information
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional mark ID to filter by
 * @param params.teamId - Optional team ID to filter by
 * @param params.juryId - Optional jury ID to filter by
 * @param params.session - Optional session ID to filter by
 * @returns Promise<MarksDataType[]> - Array of marks with complete relational data
 * 
 * @example
 * // Get all marks with complete data
 * const marksWithData = await getMarksWithData();
 * 
 * // Get marks for specific team with complete data
 * const teamMarksData = await getMarksWithData({ teamId: 123 });
 */
export async function getMarksWithData({ id, teamId, juryId, session }: {
  id?: number;
  teamId?: number;
  juryId?: number;
  session?: number
} = {}) {
  // Build conditions array first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];
  
  if (id) conditions.push(eq(marks.id, id));
  if (teamId) conditions.push(eq(marks.teamId, teamId));
  if (juryId) conditions.push(eq(marks.juryId, juryId));
  if (session) conditions.push(eq(marks.session, session));

  // Build the complete query with joins
  const baseQuery = db
    .select({
      // Mark fields
      id: marks.id,
      feasibilityScore: marks.feasibilityScore,
      techImplementationScore: marks.techImplementationScore,
      innovationCreativityScore: marks.innovationCreativityScore,
      problemRelevanceScore: marks.problemRelevanceScore,
      submitted: marks.submitted,
      locked: marks.locked,
      createdAt: marks.createdAt,
      updatedAt: marks.updatedAt,
      // Team data
      teamId: {
        id: teams.id,
        teamName: teams.teamName,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        juryId: teams.juryId,
        room: teams.room
      },
      // Jury data
      juryId: {
        id: jury.id,
        name: jury.name,
        email: jury.email,
        phoneNumber: jury.phoneNumber,
        createdAt: jury.createdAt,
        updatedAt: jury.updatedAt,
        role: jury.role
      },
      // Session data
      session: {
        id: sessions.id,
        name: sessions.name,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt
      }
    })
    .from(marks)
    .innerJoin(teams, eq(marks.teamId, teams.id))
    .innerJoin(jury,eq(marks.juryId,jury.id))
    .innerJoin(sessions, eq(marks.session, sessions.id));

  // Apply conditions after all joins are complete
  if (conditions.length === 1) {
    return await baseQuery.where(conditions[0]).orderBy(desc(marks.createdAt));
  } else if (conditions.length > 1) {
    return await baseQuery.where(and(...conditions)).orderBy(desc(marks.createdAt));
  }
  const result = await baseQuery.orderBy(desc(marks.createdAt));
  // console.log("result",result)
  return result;
}


/**
 * Validates if mark relations are valid (team, jury participant, and session exist)
 * 
 * @param params - Parameters object
 * @param params.teamId - Team ID to validate
 * @param params.juryId - Jury participant ID to validate
 * @param params.session - Session ID to validate
 * @returns Promise<boolean> - Returns true if all relations are valid, false otherwise
 * 
 * @example
 * const isValid = await validateMarkRelations({ teamId: 123, juryId: 456, session: 1 });
 * if (!isValid) {
 *   throw new Error("Invalid mark relations");
 * }
 */
export async function validateMarkRelations({ teamId, juryId, session }: { 
  teamId: number; 
  juryId: number; 
  session: number 
}) {
  // Check if team exists
  const teamData = await db.select().from(teams).where(eq(teams.id, teamId));
  // console.log("Team data:", teamData);
  if (teamData.length === 0) return false;
  
  // Check if jury participant exists
  const juryData = await db.select().from(jury).where(eq(jury.id, juryId));
  // console.log("Jury data:", juryData);
  if (juryData.length === 0) return false;
  
  // Check if session exists
  const sessionData = await db.select().from(sessions).where(eq(sessions.id, session));
  // console.log("Session data:", sessionData);
  if (sessionData.length === 0) return false;
  
  return true;
}

/**
 * Submits marks (marks them as final)
 * 
 * @param params - Parameters object
 * @param params.id - Mark ID to submit
 * @returns Promise<MarksDBType[]> - Array containing the submitted mark
 * 
 * @example
 * const submittedMark = await submitMark({ id: 123 });
 * if (submittedMark.length > 0) {
 *   console.log("Mark successfully submitted");
 * }
 */
export async function submitMark({ id }: { id: number }) {
  const markData = await getMarks({ id });
  
  if (markData.length === 0) {
    throw new Error("Mark not found");
  }
  
  const mark = markData[0];
  
  // Validate that all scores are provided (not -1)
  if (mark.feasibilityScore === -1 || mark.techImplementationScore === -1 || 
      mark.innovationCreativityScore === -1 || mark.problemRelevanceScore === -1) {
    throw new Error("All scores must be provided before submission");
  }
  
  await db.update(marks).set({ submitted: true }).where(eq(marks.id, id));
  
  return await getMarks({ id });
}

/**
 * Calculates total score for a mark record
 * 
 * @param params - Parameters object
 * @param params.mark - Mark object to calculate total for
 * @returns number - Total score (sum of all individual scores)
 * 
 * @example
 * const mark = await getMarks({ id: 123 });
 * if (mark.length > 0) {
 *   const total = calculateTotalScore({ mark: mark[0] });
 *   console.log(`Total score: ${total}`);
 * }
 */
export function calculateTotalScore({ mark }: { mark: MarksDBType }) {
  const scores = [
    mark.feasibilityScore,
    mark.techImplementationScore,
    mark.innovationCreativityScore,
    mark.problemRelevanceScore
  ];
  
  // Only count scores that are not -1 (unscored)
  const validScores = scores.filter(score => score !== -1);
  
  return validScores.reduce((total, score) => total + score, 0);
}

/**
 * Gets average scores for a team across all jury members
 * 
 * @param params - Parameters object
 * @param params.teamId - Team ID to calculate averages for
 * @param params.session - Optional session ID to filter by
 * @returns Promise<object> - Object containing average scores
 * 
 * @example
 * const averages = await getTeamAverageScores({ teamId: 123, session: 1 });
 * console.log(`Average feasibility score: ${averages.feasibilityAvg}`);
 */
export async function getTeamAverageScores({ teamId, session }: { teamId: number; session?: number }) {
  const teamMarks = await getMarks({ teamId, session, submitted: true });
  
  if (teamMarks.length === 0) {
    return {
      feasibilityAvg: 0,
      techImplementationAvg: 0,
      innovationCreativityAvg: 0,
      problemRelevanceAvg: 0,
      totalAvg: 0,
      juryCount: 0
    };
  }
  
  const totals = teamMarks.reduce((acc, mark) => {
    acc.feasibility += mark.feasibilityScore !== -1 ? mark.feasibilityScore : 0;
    acc.techImplementation += mark.techImplementationScore !== -1 ? mark.techImplementationScore : 0;
    acc.innovationCreativity += mark.innovationCreativityScore !== -1 ? mark.innovationCreativityScore : 0;
    acc.problemRelevance += mark.problemRelevanceScore !== -1 ? mark.problemRelevanceScore : 0;
    return acc;
  }, { feasibility: 0, techImplementation: 0, innovationCreativity: 0, problemRelevance: 0 });
  
  const count = teamMarks.length;
  
  return {
    feasibilityAvg: totals.feasibility / count,
    techImplementationAvg: totals.techImplementation / count,
    innovationCreativityAvg: totals.innovationCreativity / count,
    problemRelevanceAvg: totals.problemRelevance / count,
    totalAvg: (totals.feasibility + totals.techImplementation + totals.innovationCreativity + totals.problemRelevance) / count,
    juryCount: count
  };
}

/**
 * Gets marks summary for a session
 * 
 * @param params - Parameters object
 * @param params.session - Session ID to get summary for
 * @returns Promise<object> - Object containing session marks summary
 * 
 * @example
 * const summary = await getSessionMarksSummary({ session: 1 });
 * console.log(`Total marks: ${summary.totalMarks}, Submitted: ${summary.submittedMarks}`);
 */
export async function getSessionMarksSummary({ session }: { session: number }) {
  const sessionMarks = await getMarks({ session });
  const submittedMarks = sessionMarks.filter(mark => mark.submitted);
  
  return {
    totalMarks: sessionMarks.length,
    submittedMarks: submittedMarks.length,
    pendingMarks: sessionMarks.length - submittedMarks.length,
    submissionRate: sessionMarks.length > 0 ? (submittedMarks.length / sessionMarks.length) * 100 : 0
  };
}

/**
 * Checks if a jury participant has completed marking for a session
 * 
 * @param params - Parameters object
 * @param params.juryId - Jury participant ID
 * @param params.session - Session ID
 * @returns Promise<boolean> - Returns true if all marks are submitted, false otherwise
 * 
 * @example
 * const isComplete = await isJuryMarkingComplete({ juryId: 456, session: 1 });
 * if (isComplete) {
 *   console.log("Jury participant has completed all marking");
 * }
 */
export async function isJuryMarkingComplete({ juryId, session }: { juryId: number; session: number }) {
  const juryMarks = await getMarks({ juryId, session });
  
  if (juryMarks.length === 0) return false;
  
  return juryMarks.every(mark => mark.submitted);
}

/**
 * Gets all teams that need to be marked by a specific jury participant in a session
 * 
 * @param params - Parameters object
 * @param params.juryId - Jury participant ID
 * @param params.session - Session ID
 * @returns Promise<number[]> - Array of team IDs that need marking
 * 
 * @example
 * const teamsToMark = await getTeamsToMarkByJury({ juryId: 456, session: 1 });
 * console.log(`Teams to mark: ${teamsToMark.length}`);
 */
export async function getTeamsToMarkByJury({ juryId, session }: { juryId: number; session: number }) {
  // Get all teams (you might want to filter by session if teams are session-specific)
  const allTeams = await db.select({ id: teams.id }).from(teams);
  
  // Get teams already marked by this jury in this session
  const markedTeams = await getMarks({ juryId, session });
  const markedTeamIds = markedTeams.map(mark => mark.teamId);
  
  // Return teams that haven't been marked yet
  return allTeams
    .map(team => team.id)
    .filter(teamId => !markedTeamIds.includes(teamId));
}
