import { db } from "@/db";
import { sessions } from "@/db/schema";
import { sessionDBType } from "@/zod/sessionSchema";
import { eq } from "drizzle-orm";

/**
 * Session utility functions for database operations
 * 
 * This module provides CRUD operations for session management using Drizzle ORM.
 * All functions are async and return promises that resolve to session data or operation results.
 */

/**
 * Retrieves sessions from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional session ID to filter by. If provided, returns specific session; otherwise returns all sessions
 * @returns Promise<sessionDBType[]> - Array of session objects matching the criteria
 * 
 * @example
 * // Get all sessions
 * const allSessions = await getSessions();
 * 
 * // Get specific session by ID
 * const session = await getSessions({ id: 123 });
 */
export async function getSessions({ id }: { id?: number } = {}) {
  const baseQuery = db.select().from(sessions);
  
  if (id) baseQuery.where(eq(sessions.id, id));
  
  const data = await baseQuery;
  
  return data;
}

/**
 * Creates a new session in the database
 * 
 * @param params - Parameters object
 * @param params.session - Session data conforming to sessionDBType schema
 * @returns Promise<sessionDBType[]> - Array containing the newly created session, or empty array if creation failed
 * 
 * @example
 * const newSession = {
 *   name: "User Session",
 *   userId: 456,
 *   // ... other session properties
 * };
 * const result = await createSession({ session: newSession });
 */
export async function createSession({ session }: { session: sessionDBType }) {
  const response = await db.insert(sessions).values(session).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getSessions({ id: response[0].id });
}

/**
 * Deletes a session from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required session ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if session still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteSession({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Session successfully deleted");
 * }
 */
export async function deleteSession({ id }: { id: number }) {
  const response = await db.delete(sessions).where(eq(sessions.id, id));
  
  const data = await getSessions({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing session in the database
 * 
 * @param params - Parameters object
 * @param params.session - Session data with ID field required for update operation
 * @returns Promise<sessionDBType[]> - Array containing the updated session, or empty array if session.id is missing
 * 
 * @example
 * const updatedSession = {
 *   id: 123,
 *   name: "Updated Session Name",
 *   // ... other session properties
 * };
 * const result = await updateSession({ session: updatedSession });
 */
export async function updateSession({ session }: { session: sessionDBType }) {
  if (!session.id) return [];
  
  const response = await db.update(sessions).set({ ...session }).where(eq(sessions.id, session.id));
  
  return await getSessions({ id: session.id });
}
