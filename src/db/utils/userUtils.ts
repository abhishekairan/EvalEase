// lib/db/utils/userUtils.ts
import { db } from "../index";
import { UserDBType } from "@/zod";
import { users } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves users from the database with optional filtering
 * Only pass one parameter at a time for proper filtering
 *
 * @param id - Unique user ID to fetch a specific user
 * @param type - User role filter ('admin', 'jury', or 'student')
 * @param email - Email address to find a specific user
 * @returns Promise<UserDBType[]> - Array of users matching the criteria
 */
export async function getUsers({id,type,email}:{
  id?: number,
  type?: "admin" | "jury" | "student",
  email?: string}
) {
  if (id) {
    const response = await db.select().from(users).where(eq(users.id, id));
    return response;
  } else if (type) {
    const response = await db.select().from(users).where(eq(users.role, type));
    return response;
  } else if (email) {
    const response = await db.select().from(users).where(eq(users.email, email));
    return response;
  }

  const response = await db.select().from(users);
  return response;
}

/**
 * Creates a new user in the database
 *
 * @param user - User data conforming to UserDBType schema
 * @returns Promise<UserDBType[]> - The created user object
 */
export async function insertUser(user: UserDBType) {
  const { id } = (await db.insert(users).values(user).$returningId())[0];
  const userObj = await getUsers({id});
  return userObj;
}

/**
 * Deletes a user from the database
 *
 * @param id - ID of the user to delete
 * @returns Promise<UserDBType[]> - Empty array if deletion was successful
 */
export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
  const user = await getUsers({id});
  return user;
}

/**
 * Updates an existing user in the database
 *
 * @param user - Updated user data with ID included
 * @returns Promise<UserDBType[]> - Array containing the updated user
 */
export async function updateUser(user: UserDBType) {
  await db.update(users).set({ ...user }).where(eq(users.id, user.id));
  return await getUsers({id:user.id});
}
