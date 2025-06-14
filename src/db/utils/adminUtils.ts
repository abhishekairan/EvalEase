import { db } from "@/db";
import { admin } from "@/db/schema";
import { adminDBType } from "@/zod/userSchema";
import { eq } from "drizzle-orm";

/**
 * Admin utility functions for database operations
 * 
 * This module provides CRUD operations for admin management using Drizzle ORM.
 * All functions are async and return promises that resolve to admin data or operation results.
 */

/**
 * Retrieves admins from the database
 * 
 * @param params - Optional parameters object
 * @param params.id - Optional admin ID to filter by. If provided, returns specific admin; otherwise returns all admins
 * @param params.email - Optional email to filter by. Useful for authentication lookups
 * @returns Promise<adminDBType[]> - Array of admin objects matching the criteria
 * 
 * @example
 * // Get all admins
 * const allAdmins = await getAdmins();
 * 
 * // Get specific admin by ID
 * const admin = await getAdmins({ id: 123 });
 * 
 * // Get admin by email for login
 * const adminByEmail = await getAdmins({ email: "admin@example.com" });
 */
export async function getAdmins({ id, email }: { id?: number; email?: string } = {}) {
  const baseQuery = db.select().from(admin);
  
  if (id) {
    baseQuery.where(eq(admin.id, id));
  } else if (email) {
    baseQuery.where(eq(admin.email, email));
  }
  
  const data = await baseQuery;
  return data;
}

/**
 * Creates a new admin in the database
 * 
 * @param params - Parameters object
 * @param params.admin - Admin data conforming to adminDBType schema
 * @returns Promise<adminDBType[]> - Array containing the newly created admin, or empty array if creation failed
 * 
 * @example
 * const newAdmin = {
 *   name: "John Doe",
 *   email: "john.doe@example.com"
 * };
 * const result = await createAdmin({ admin: newAdmin });
 */
export async function createAdmin({ admin: adminData }: { admin: adminDBType }) {
  const response = await db.insert(admin).values(adminData).$returningId();
  
  if (response.length <= 0) return [];
  
  return await getAdmins({ id: response[0].id });
}

/**
 * Deletes an admin from the database
 * 
 * @param params - Parameters object
 * @param params.id - Required admin ID to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false if admin still exists after deletion attempt
 * 
 * @example
 * const wasDeleted = await deleteAdmin({ id: 123 });
 * if (wasDeleted) {
 *   console.log("Admin successfully deleted");
 * }
 */
export async function deleteAdmin({ id }: { id: number }) {
  await db.delete(admin).where(eq(admin.id, id));
  
  const data = await getAdmins({ id });
  
  if (data.length > 0) return false;
  
  return true;
}

/**
 * Updates an existing admin in the database
 * 
 * @param params - Parameters object
 * @param params.admin - Admin data with ID field required for update operation
 * @returns Promise<adminDBType[]> - Array containing the updated admin, or empty array if admin.id is missing
 * 
 * @example
 * const updatedAdmin = {
 *   id: 123,
 *   name: "Jane Doe",
 *   email: "jane.doe@example.com"
 * };
 * const result = await updateAdmin({ admin: updatedAdmin });
 */
export async function updateAdmin({ admin: adminData }: { admin: adminDBType }) {
  if (!adminData.id) return [];
  
  await db.update(admin).set({ ...adminData }).where(eq(admin.id, adminData.id));
  
  return await getAdmins({ id: adminData.id });
}

/**
 * Checks if an admin exists by email
 * 
 * @param params - Parameters object
 * @param params.email - Email address to check
 * @returns Promise<boolean> - Returns true if admin with email exists, false otherwise
 * 
 * @example
 * const exists = await adminExists({ email: "admin@example.com" });
 * if (exists) {
 *   console.log("Admin already registered");
 * }
 */
export async function adminExists({ email }: { email: string }) {
  const data = await getAdmins({ email });
  return data.length > 0;
}
