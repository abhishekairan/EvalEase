// lib/utils/juryUtils.ts
import { db } from "@/db";
import { jury, creds } from "@/db/schema";
import { juryDBType } from "@/zod/userSchema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

/**
 * Jury utility functions for database operations
 * This module provides CRUD operations for jury management using Drizzle ORM.
 * All functions are async and return promises that resolve to jury data or operation results.
 */

/**
 * Retrieves jury members from the database
 * @param params - Optional parameters object
 * @param params.id - Optional jury ID to filter by
 * @param params.email - Optional email to filter by
 * @param params.session - Optional session ID to filter by
 * @returns Promise - Array of jury objects matching the criteria
 */
export async function getJury({ 
  id, 
  email, 
  session 
}: { 
  id?: number; 
  email?: string; 
  session?: number 
} = {}) {
  const baseQuery = db.select().from(jury);
  
  if (id) {
    return await baseQuery.where(eq(jury.id, id));
  } else if (email) {
    return await baseQuery.where(eq(jury.email, email));
  } else if (session) {
    return await baseQuery.where(eq(jury.session, session));
  }
  
  return await baseQuery;
}

/**
 * Creates a new jury member in the database with credentials
 * @param params - Parameters object
 * @param params.jury - Jury data conforming to juryDBType schema
 * @param params.password - Plain text password to be hashed
 * @returns Promise - Array containing the newly created jury member
 */
export async function createJury({ 
  jury: juryData, 
  password 
}: { 
  jury: Omit<juryDBType, 'password'>; 
  password: string 
}) {
  try {
    // Create jury record
    const juryResponse = await db.insert(jury).values(juryData).$returningId();
    
    if (juryResponse.length <= 0) return [];
    
    const juryId = juryResponse[0].id;
    
    // Hash password and create credentials
    const hashedPassword = await hashPassword(password);
    await db.insert(creds).values({
      user: juryId,
      password: hashedPassword
    });
    
    return await getJury({ id: juryId });
  } catch (error) {
    console.error('Error creating jury:', error);
    return [];
  }
}

/**
 * Deletes a jury member from the database along with credentials
 * @param params - Parameters object
 * @param params.id - Required jury ID to delete
 * @returns Promise - Returns true if deletion was successful
 */
export async function deleteJury({ id }: { id: number }) {
  try {
    // Delete credentials first (foreign key constraint)
    await db.delete(creds).where(eq(creds.user, id));
    
    // Delete jury member
    await db.delete(jury).where(eq(jury.id, id));
    
    const data = await getJury({ id });
    return data.length === 0;
  } catch (error) {
    console.error('Error deleting jury:', error);
    return false;
  }
}

/**
 * Updates an existing jury member in the database
 * @param params - Parameters object
 * @param params.jury - Jury data with ID field required
 * @returns Promise - Array containing the updated jury member
 */
export async function updateJury({ jury: juryData }: { jury: juryDBType }) {
  if (!juryData.id) return [];
  
  try {
    const { password, ...updateData } = juryData;
    await db.update(jury).set(updateData).where(eq(jury.id, juryData.id));
    return await getJury({ id: juryData.id });
  } catch (error) {
    console.error('Error updating jury:', error);
    return [];
  }
}

/**
 * Updates jury member password
 * @param params - Parameters object
 * @param params.id - Jury ID
 * @param params.newPassword - New plain text password
 * @returns Promise - Returns true if password was updated successfully
 */
export async function updateJuryPassword({ 
  id, 
  newPassword 
}: { 
  id: number; 
  newPassword: string 
}) {
  try {
    const hashedPassword = await hashPassword(newPassword);
    await db.update(creds)
      .set({ password: hashedPassword })
      .where(eq(creds.user, id));
    return true;
  } catch (error) {
    console.error('Error updating jury password:', error);
    return false;
  }
}

/**
 * Checks if a jury member exists by email
 * @param params - Parameters object
 * @param params.email - Email address to check
 * @returns Promise - Returns true if jury member with email exists
 */
export async function juryExists({ email }: { email: string }) {
  const data = await getJury({ email });
  return data.length > 0;
}

/**
 * Gets jury credentials for authentication
 * @param params - Parameters object
 * @param params.userid - Jury user ID
 * @returns Promise - Jury credentials object or null
 */
export async function getJuryPassword({ userid }: { userid: number }) {
  try {
    const data = await db.select().from(creds).where(eq(creds.user, userid));
    return data[0] || null;
  } catch (error) {
    console.error('Error getting jury password:', error);
    return null;
  }
}

/**
 * Gets jury member by email with credentials for authentication
 * @param params - Parameters object
 * @param params.email - Jury email
 * @returns Promise - Jury member with credentials or null
 */
export async function getJuryForAuth({ email }: { email: string }) {
  try {
    const juryData = await getJury({ email });
    if (juryData.length === 0) return null;
    
    const juryMember = juryData[0];
    const credentials = await getJuryPassword({ userid: juryMember.id });
    
    if (!credentials) return null;
    
    return {
      ...juryMember,
      password: credentials.password
    };
  } catch (error) {
    console.error('Error getting jury for auth:', error);
    return null;
  }
}

/**
 * Gets all jury members for a specific session
 * @param params - Parameters object
 * @param params.sessionId - Session ID to filter by
 * @returns Promise - Array of jury members in the session
 */
export async function getJuryBySession({ sessionId }: { sessionId: number }) {
  return await getJury({ session: sessionId });
}

/**
 * Assigns jury member to a session
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @param params.sessionId - Session ID to assign
 * @returns Promise - Returns true if assignment was successful
 */
export async function assignJuryToSession({ 
  juryId, 
  sessionId 
}: { 
  juryId: number; 
  sessionId: number 
}) {
  try {
    await db.update(jury)
      .set({ session: sessionId })
      .where(eq(jury.id, juryId));
    return true;
  } catch (error) {
    console.error('Error assigning jury to session:', error);
    return false;
  }
}

/**
 * Removes jury member from session
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @returns Promise - Returns true if removal was successful
 */
export async function removeJuryFromSession({ juryId }: { juryId: number }) {
  try {
    await db.update(jury)
      .set({ session: null })
      .where(eq(jury.id, juryId));
    return true;
  } catch (error) {
    console.error('Error removing jury from session:', error);
    return false;
  }
}
