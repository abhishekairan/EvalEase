// lib/utils/adminUtils.ts
import { db } from "@/db";
import { admin, creds } from "@/db/schema";
import { adminDBType } from "@/zod/userSchema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

/**
 * Admin utility functions for database operations
 * This module provides CRUD operations for admin management using Drizzle ORM.
 * All functions are async and return promises that resolve to admin data or operation results.
 */

/**
 * Retrieves admins from the database
 * @param params - Optional parameters object
 * @param params.id - Optional admin ID to filter by
 * @param params.email - Optional email to filter by
 * @returns Promise - Array of admin objects matching the criteria
 */
export async function getAdmins({ id, email }: { id?: number; email?: string } = {}) {
  const baseQuery = db.select().from(admin);
  
  if (id) {
    return await baseQuery.where(eq(admin.id, id));
  } else if (email) {
    return await baseQuery.where(eq(admin.email, email));
  }
  
  return await baseQuery;
}

/**
 * Creates a new admin in the database with credentials
 * @param params - Parameters object
 * @param params.admin - Admin data conforming to adminDBType schema
 * @param params.password - Plain text password to be hashed
 * @returns Promise - Array containing the newly created admin, or empty array if creation failed
 */
export async function createAdmin({ 
  admin: adminData, 
  password 
}: { 
  admin: Omit<adminDBType, 'password'>; 
  password: string 
}) {
  try {
    // Create admin record
    const adminResponse = await db.insert(admin).values(adminData).$returningId();
    
    if (adminResponse.length <= 0) return [];
    
    const adminId = adminResponse[0].id;
    
    // Hash password and create credentials
    const hashedPassword = await hashPassword(password);
    await db.insert(creds).values({
      user: adminId,
      password: hashedPassword
    });
    
    return await getAdmins({ id: adminId });
  } catch (error) {
    console.error('Error creating admin:', error);
    return [];
  }
}

/**
 * Deletes an admin from the database along with credentials
 * @param params - Parameters object
 * @param params.id - Required admin ID to delete
 * @returns Promise - Returns true if deletion was successful
 */
export async function deleteAdmin({ id }: { id: number }) {
  try {
    // Delete credentials first (foreign key constraint)
    await db.delete(creds).where(eq(creds.user, id));
    
    // Delete admin
    await db.delete(admin).where(eq(admin.id, id));
    
    const data = await getAdmins({ id });
    return data.length === 0;
  } catch (error) {
    console.error('Error deleting admin:', error);
    return false;
  }
}

/**
 * Updates an existing admin in the database
 * @param params - Parameters object
 * @param params.admin - Admin data with ID field required
 * @returns Promise - Array containing the updated admin
 */
export async function updateAdmin({ admin: adminData }: { admin: adminDBType }) {
  if (!adminData.id) return [];
  
  try {
    const { password, ...updateData } = adminData;
    await db.update(admin).set(updateData).where(eq(admin.id, adminData.id));
    return await getAdmins({ id: adminData.id });
  } catch (error) {
    console.error('Error updating admin:', error);
    return [];
  }
}

/**
 * Updates admin password
 * @param params - Parameters object
 * @param params.id - Admin ID
 * @param params.newPassword - New plain text password
 * @returns Promise - Returns true if password was updated successfully
 */
export async function updateAdminPassword({ 
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
    console.error('Error updating admin password:', error);
    return false;
  }
}

/**
 * Checks if an admin exists by email
 * @param params - Parameters object
 * @param params.email - Email address to check
 * @returns Promise - Returns true if admin with email exists
 */
export async function adminExists({ email }: { email: string }) {
  const data = await getAdmins({ email });
  return data.length > 0;
}

/**
 * Gets admin credentials for authentication
 * @param params - Parameters object
 * @param params.userid - Admin user ID
 * @returns Promise - Admin credentials object or null
 */
export async function getAdminPassword({ userid }: { userid: number }) {
  try {
    const data = await db.select().from(creds).where(eq(creds.user, userid));
    return data[0] || null;
  } catch (error) {
    console.error('Error getting admin password:', error);
    return null;
  }
}

/**
 * Gets admin by email with credentials for authentication
 * @param params - Parameters object
 * @param params.email - Admin email
 * @returns Promise - Admin with credentials or null
 */
export async function getAdminForAuth({ email }: { email: string }) {
  try {
    const adminData = await getAdmins({ email });
    if (adminData.length === 0) return null;
    
    const admin = adminData[0];
    const credentials = await getAdminPassword({ userid: admin.id });
    
    if (!credentials) return null;
    
    return {
      ...admin,
      password: credentials.password
    };
  } catch (error) {
    console.error('Error getting admin for auth:', error);
    return null;
  }
}
