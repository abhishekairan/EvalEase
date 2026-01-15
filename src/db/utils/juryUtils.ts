// lib/utils/juryUtils.ts
import { db } from "@/db";
import { jury, creds, jurySessions, sessions } from "@/db/schema";
import { juryDBType } from "@/zod/userSchema";
import { eq, inArray, sql } from "drizzle-orm";
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
 * @param params.role - Optional role to filter by
 * @returns Promise - Array of jury objects matching the criteria
 * @note For session-based filtering, use getJuryBySession instead
 */
export async function getJury({ 
  id, 
  email,
  role
}: { 
  id?: number; 
  email?: string;
  role?: string;
} = {}) {
  const baseQuery = db.select().from(jury);
  
  if (id) {
    return await baseQuery.where(eq(jury.id, id));
  } else if (email) {
    return await baseQuery.where(eq(jury.email, email));
  } else if (role) {
    return await baseQuery.where(eq(jury.role, role));
  }
  
  return await baseQuery;
}

/**
 * Creates a new jury member in the database with credentials
 * @param params - Parameters object
 * @param params.jury - Jury data conforming to juryDBType schema (without password)
 * @param params.password - Plain text password to be hashed and stored in credentials table
 * @returns Promise<juryDBType[]> - Array containing the newly created jury member, or empty array if creation failed
 * 
 * @example
 * const newJury = {
 *   name: "Dr. Smith",
 *   email: "dr.smith@example.com",
 *   session: 1,
 *   phoneNumber: "+1234567890"
 * };
 * const result = await createJury({ 
 *   jury: newJury, 
 *   password: "securePassword123" 
 * });
 */
export async function createJury({ 
  jury: juryData, 
  password 
}: { 
  jury: Omit<juryDBType, 'password'>; 
  password: string 
}) {
  try {
    // Validate password strength
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Create jury record
    const juryResponse = await db.insert(jury).values(juryData).$returningId();
    
    if (juryResponse.length <= 0) {
      throw new Error("Failed to create jury member");
    }
    
    // Hash password and create credentials
    const hashedPassword = await hashPassword(password);
    await db.insert(creds).values({
      email: juryData.email,
      password: hashedPassword,
      role:'jury'
    });
    
    // Return the newly created jury member
    return await getJury({ email:juryData.email });
  } catch (error) {
    console.error('Error creating jury:', error);
    // Clean up jury record if credentials creation failed
    if (error instanceof Error && error.message !== "Failed to create jury member") {
      try {
        // If we have a juryId, it means jury was created but credentials failed
        const juryResponse = await db.insert(jury).values(juryData).$returningId();
        if (juryResponse.length > 0) {
          await db.delete(jury).where(eq(jury.id, juryResponse[0].id));
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    return [];
  }
}


/**
 * Deletes a jury member from the database along with credentials
 * @param params - Parameters object
 * @param params.id - Optional jury ID to delete
 * @param params.email - Optional jury email to delete
 * @returns Promise - Returns true if deletion was successful
 */
export async function deleteJury({ id, email }: { id?: number; email?: string }) {
  try {
    // Validate that at least one parameter is provided
    if (!id && !email) {
      throw new Error('Either id or email must be provided');
    }

    if (id) {
      // Delete by ID
      // First get the jury member to find their email for credentials deletion
      const juryMember = await db.select().from(jury).where(eq(jury.id, id)).limit(1);
      
      if (juryMember.length === 0) {
        return false; // Jury member not found
      }

      const juryEmail = juryMember[0].email;

      // Delete credentials first (foreign key constraint)
      await db.delete(creds).where(eq(creds.email, juryEmail));
      
      // Delete jury member
      await db.delete(jury).where(eq(jury.id, id));
      
      // Verify deletion
      const data = await getJury({ id });
      return data.length === 0;
    } else {
      // Delete by email (original logic)
      // Delete credentials first (foreign key constraint)
      await db.delete(creds).where(eq(creds.email, email!));
      
      // Delete jury member
      await db.delete(jury).where(eq(jury.email, email!));
      
      // Verify deletion
      const data = await getJury({ email });
      return data.length === 0;
    }
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
    // Password is destructured for security but not used in update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...updateData } = juryData;
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
  email, 
  newPassword 
}: { 
  email: string; 
  newPassword: string 
}) {
  try {
    const hashedPassword = await hashPassword(newPassword);
    await db.update(creds)
      .set({ password: hashedPassword })
      .where(eq(creds.email, email));
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
 * @param params.email - Jury user ID
 * @returns Promise - Jury credentials object or null
 */
export async function getJuryPassword({ email }: { email: string }) {
  try {
    const data = await db.select().from(creds).where(eq(creds.email, email));
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
    const credentials = await getJuryPassword({ email: juryMember.email });
    
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
 * Gets all jury members for a specific session using junction table
 * @param params - Parameters object
 * @param params.sessionId - Session ID to filter by
 * @returns Promise - Array of jury members in the session
 */
export async function getJuryBySession({ sessionId }: { sessionId: number }) {
  const result = await db
    .select({
      id: jury.id,
      name: jury.name,
      email: jury.email,
      phoneNumber: jury.phoneNumber,
      role: jury.role,
      createdAt: jury.createdAt,
      updatedAt: jury.updatedAt,
    })
    .from(jurySessions)
    .innerJoin(jury, eq(jurySessions.juryId, jury.id))
    .where(eq(jurySessions.sessionId, sessionId));
  
  return result;
}

/**
 * Gets all jury member IDs for a specific session using junction table
 * @param params - Parameters object
 * @param params.sessionId - Session ID to filter by
 * @returns Promise - Array of jury IDs in the session
 */
export async function getJuryIdsBySession({ sessionId }: { sessionId: number }) {
  const juryIds = await db
    .select({ id: jurySessions.juryId })
    .from(jurySessions)
    .where(eq(jurySessions.sessionId, sessionId));
  
  return juryIds.map((j) => j.id);
}

/**
 * Assigns jury member to a session using junction table
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @param params.sessionId - Session ID to assign (null to remove from all sessions)
 * @returns Promise - Returns true if assignment was successful
 */
export async function assignJuryToSession({ 
  juryId, 
  sessionId 
}: { 
  juryId: number; 
  sessionId: number | null
}) {
  try {
    if (sessionId === null) {
      // Remove jury from all sessions
      await db.delete(jurySessions)
        .where(eq(jurySessions.juryId, juryId));
    } else {
      // Check if assignment already exists
      const existing = await db
        .select()
        .from(jurySessions)
        .where(sql`${jurySessions.juryId} = ${juryId} AND ${jurySessions.sessionId} = ${sessionId}`)
        .limit(1);
      
      if (existing.length === 0) {
        // Add new jury-session relationship
        await db.insert(jurySessions).values({
          juryId,
          sessionId
        });
      }
    }
    return true;
  } catch (error) {
    console.error('Error assigning jury to session:', error);
    return false;
  }
}

/**
 * Removes jury member from all sessions using junction table
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @returns Promise - Returns true if removal was successful
 */
/**
 * Removes a jury member from a specific session
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @param params.sessionId - Session ID to remove jury from
 * @returns Promise - Returns true if removal was successful
 */
export async function removeJuryFromSession({ 
  juryId, 
  sessionId 
}: { 
  juryId: number;
  sessionId?: number;
}) {
  try {
    if (sessionId) {
      // Remove from specific session
      await db.delete(jurySessions)
        .where(
          sql`${jurySessions.juryId} = ${juryId} AND ${jurySessions.sessionId} = ${sessionId}`
        );
    } else {
      // Remove from all sessions
      await db.delete(jurySessions)
        .where(eq(jurySessions.juryId, juryId));
    }
    return true;
  } catch (error) {
    console.error('Error removing jury from session:', error);
    return false;
  }
}

/**
 * Retrieves sessions for a specific jury member with full session details
 * @param params - Parameters object
 * @param params.juryId - Jury member ID
 * @returns Promise - Array of session objects the jury is assigned to
 */
export async function getSessionsForJury({ juryId }: { juryId: number }) {
  try {
    const result = await db
      .select({
        id: sessions.id,
        name: sessions.name,
        startedAt: sessions.startedAt,
        endedAt: sessions.endedAt,
      })
      .from(jurySessions)
      .innerJoin(sessions, eq(jurySessions.sessionId, sessions.id))
      .where(eq(jurySessions.juryId, juryId));
    
    return result;
  } catch (error) {
    console.error('Error fetching sessions for jury:', error);
    return [];
  }
}

/**
 * Retrieves jury members with their assigned sessions
 * @param params - Optional parameters object
 * @param params.id - Optional jury ID to filter by
 * @returns Promise - Array of jury objects with their session details
 */
export async function getJuryWithSessions({ id }: { id?: number } = {}) {
  try {
    const juryList = await getJury({ id });
    
    const juryWithSessions = await Promise.all(
      juryList.map(async (j) => {
        const sessions = await getSessionsForJury({ juryId: j.id! });
        return { ...j, sessions };
      })
    );
    
    return juryWithSessions;
  } catch (error) {
    console.error('Error fetching jury with sessions:', error);
    return [];
  }
}
