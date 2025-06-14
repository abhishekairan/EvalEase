import { db } from "@/db";
import { jury, sessions } from "@/db/schema";
import { juryDBType } from "@/zod/userSchema";
import { eq } from "drizzle-orm";

/**
 * Jury utility functions for database operations
 * 
 * This module provides CRUD operations for jury management using Drizzle ORM.
 * Jury members are associated with specific sessions and have unique email addresses.
 */

/**
 * Retrieves jury members from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional jury ID to filter by
 * @param params.email - Optional email to filter by
 * @param params.session - Optional session ID to filter jury members by session
 * @returns Promise<juryDBType[]> - Array of jury objects matching the criteria
 * 
 * @example
 * // Get all jury members
 * const allJury = await getJury();
 * 
 * // Get specific jury member by ID
 * const juryMember = await getJury({ id: 123 });
 * 
 * // Get jury members for a specific session
 * const sessionJury = await getJury({ session: 456 });
 */
export async function getJury({ id, email, session }: { id?: number; email?: string; session?: number } = {}) {

  const conditions: any[] = []
  const baseQuery = db.select().from(jury);
  
  if (id) {
    conditions.push(eq(jury.id, id));
  } else if (email) {
    conditions.push(eq(jury.email, email));
  } else if (session) {
    conditions.push(eq(jury.session, session));
  }
  if(conditions.length>0){
    const data = await baseQuery.where(conditions[0]);
    return data;
  }
  const data = await baseQuery;
  return data;
}

/**
 * Creates a new jury member in the database
 * 
 * @param params - Parameters object
 * @param params.jury - Jury data conforming to juryDBType schema
 * @returns Promise<juryDBType[]> - Array containing the newly created jury member, or empty array if creation failed
 * 
 * @example
 * const newJury = {
 *   name: "Dr. Smith",
 *   email: "dr.smith@example.com",
 *   session: 1,
 *   phoneNumber: "+1234567890"
 * };
 * const result = await createJury({ jury: newJury });
 */
export async function createJury({ jury: juryData }: { jury: juryDBType }) {
  const response = await db.insert(jury).values(juryData).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getJury({ id: response[0].id });
}

/**
 * Deletes a jury member from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required jury ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if jury member still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteJury({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Jury member successfully deleted");
 * }
 */
export async function deleteJury({ id }: { id: number }) {
  await db.delete(jury).where(eq(jury.id, id));
  
  const data = await getJury({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing jury member in the database
 * 
 * @param params - Parameters object
 * @param params.jury - Jury data with ID field required for update operation
 * @returns Promise<juryDBType[]> - Array containing the updated jury member, or empty array if jury.id is missing
 * 
 * @example
 * const updatedJury = {
 *   id: 123,
 *   name: "Dr. Jane Smith",
 *   email: "dr.jane.smith@example.com",
 *   session: 2,
 *   phoneNumber: "+1234567890"
 * };
 * const result = await updateJury({ jury: updatedJury });
 */
export async function updateJury({ jury: juryData }: { jury: juryDBType }) {
  if (!juryData.id) return [];
  
  await db.update(jury).set({ ...juryData }).where(eq(jury.id, juryData.id));
  
  return await getJury({ id: juryData.id });
}

/**
 * Checks if a jury member exists by email
 * 
 * @param params - Parameters object
 * @param params.email - Email address to check
 * @returns Promise<boolean> - Returns true if jury member with email exists, false otherwise
 * 
 * @example
 * const exists = await juryExists({ email: "jury@example.com" });
 */
export async function juryExists({ email }: { email: string }) {
  const data = await getJury({ email });
  return data.length > 0;
}

/**
 * Validates if a session exists before assigning jury member
 * 
 * @param params - Parameters object
 * @param params.sessionId - Session ID to validate
 * @returns Promise<boolean> - Returns true if session exists, false otherwise
 * 
 * @example
 * const isValidSession = await validateJurySession({ sessionId: 1 });
 * if (!isValidSession) {
 *   throw new Error("Invalid session ID");
 * }
 */
export async function validateJurySession({ sessionId }: { sessionId: number }) {
  const sessionData = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  return sessionData.length > 0;
}
