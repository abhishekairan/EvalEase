import { db } from "../index";
import { MarksDBType, MarksDataType } from "@/zod";
import { marks, teams, users } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves marks from the database with optional filtering
 *
 * @param id - Unique mark ID to fetch a specific mark record
 * @param teamId - Team ID to fetch all marks for a specific team
 * @param juryId - Jury ID to fetch all marks given by a specific jury member
 * @returns Promise<MarksDBType[]> - Array of marks matching the criteria
 */
export async function getMarks(id?: number, teamId?: number, juryId?: number) {
  if (id) {
    const response = await db.select().from(marks).where(eq(marks.id, id));
    return response;
  } else if (teamId) {
    const response = await db.select().from(marks).where(eq(marks.teamId, teamId));
    return response;
  } else if (juryId) {
    const response = await db.select().from(marks).where(eq(marks.juryId, juryId));
    return response;
  }

  const response = await db.select().from(marks);
  return response;
}

/**
 * Retrieves marks data with team and jury information
 * @param id - Mark ID to fetch
 * @param teamId - Team ID to fetch all marks
 * @param juryId - Jury ID to fetch all marks given by jury
 * @returns Promise<MarksDataType[]> - Marks with populated team and jury data
 */
export async function getMarksData(id?: number, teamId?: number, juryId?: number) {
  const baseQuery = db
    .select({
      id: marks.id,
      teamId: {
        id: teams.id,
        teamName: teams.teamName,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      },      juryId: {
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      innovationScore: marks.innovationScore,
      presentationScore: marks.presentationScore,
      technicalScore: marks.technicalScore,
      impactScore: marks.impactScore,
      submitted: marks.submitted,
      createdAt: marks.createdAt,
      updatedAt: marks.updatedAt,
    })
    .from(marks)
    .innerJoin(teams, eq(marks.teamId, teams.id))
    .innerJoin(users, eq(marks.juryId, users.id));

  if (id) {
    const response = await baseQuery.where(eq(marks.id, id));
    return response;
  } else if (teamId) {
    const response = await baseQuery.where(eq(marks.teamId, teamId));
    return response;
  } else if (juryId) {
    const response = await baseQuery.where(eq(marks.juryId, juryId));
    return response;
  }
  
  const response = await baseQuery;
  return response;
}

/**
 * Retrieves all marks for a team with detailed scoring breakdown
 * @param teamId - Team ID to fetch marks
 * @returns Promise with marks data and calculated averages
 */
export async function getTeamMarksAnalysis(teamId: number) {
  const marksData = await getMarksData(undefined, teamId);
  
  if (marksData.length === 0) {
    return {
      marks: [],
      averages: null,
      totalJuryEvaluations: 0,
    };
  }
  
  const submittedMarks = marksData.filter(mark => mark.submitted);
  
  if (submittedMarks.length === 0) {
    return {
      marks: marksData,
      averages: null,
      totalJuryEvaluations: marksData.length,
    };
  }
  
  const averages = {
    innovation: submittedMarks.reduce((sum, mark) => sum + mark.innovationScore, 0) / submittedMarks.length,
    presentation: submittedMarks.reduce((sum, mark) => sum + mark.presentationScore, 0) / submittedMarks.length,
    technical: submittedMarks.reduce((sum, mark) => sum + mark.technicalScore, 0) / submittedMarks.length,
    impact: submittedMarks.reduce((sum, mark) => sum + mark.impactScore, 0) / submittedMarks.length,
    overall: 0,
  };
  
  averages.overall = (averages.innovation + averages.presentation + averages.technical + averages.impact) / 4;
  
  return {
    marks: marksData,
    averages,
    totalJuryEvaluations: marksData.length,
    submittedEvaluations: submittedMarks.length,
  };
}

/**
 * Creates a new mark record in the database
 *
 * @param mark - Mark data conforming to MarksDBType schema
 * @returns Promise<MarksDBType[]> - Array containing the created mark
 */
export async function insertMark(mark: MarksDBType) {
  const { id } = (await db.insert(marks).values(mark).$returningId())[0];
  const markObj = await getMarks(id);
  return markObj;
}

/**
 * Deletes a mark record from the database
 *
 * @param id - ID of the mark to delete
 * @returns Promise<MarksDBType[]> - Empty array if deletion was successful
 */
export async function deleteMark(id: number) {
  await db.delete(marks).where(eq(marks.id, id));
  const mark = await getMarks(id);
  return mark;
}

/**
 * Updates an existing mark record in the database
 *
 * @param mark - Updated mark data with ID included
 * @returns Promise<MarksDBType[]> - Array containing the updated mark
 */
export async function updateMark(mark: MarksDBType) {
  await db.update(marks).set({ ...mark }).where(eq(marks.id, mark.id));
  return await getMarks(mark.id);
}
