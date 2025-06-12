// lib/db/utils/userUtils.ts
import { db } from "../index";
import { UserDBType } from "@/zod";
import { teamMembers, teams, users } from "../schema";
import { eq, sql } from "drizzle-orm";

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
  if (!user.id) {
    throw new Error("User ID is required for update");
  }
  await db.update(users).set({ ...user }).where(eq(users.id, user.id));
  return await getUsers({id:user.id});
}

/**
 * Retrieves all users with their team information if they belong to a team
 * @returns Promise - Array of users with optional team data
 */
export async function getUsersWithTeamInfo() {
  const response = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      teamId: teams.id,
      teamName: teams.teamName,
    })
    .from(users)
    .where(eq(users.role,'student'))
    .leftJoin(teamMembers, eq(users.id, teamMembers.memberId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id));

  return response;
}



/**
 * Retrieves all users with comprehensive team information (both as members and leaders)
 * @returns Promise - Array of users with team data and leadership status
 */
export async function getUsersWithCompleteTeamInfo() {
  // Get users as team members
  const usersAsMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      teamId: teams.id,
      teamName: teams.teamName,
      isLeader: sql<boolean>`false`.as('isLeader'),
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.memberId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id));

  // Get users as team leaders
  const usersAsLeaders = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      teamId: teams.id,
      teamName: teams.teamName,
      isLeader: sql<boolean>`true`.as('isLeader'),
    })
    .from(users)
    .innerJoin(teams, eq(users.id, teams.leaderId));

  // Combine and deduplicate results
  const allUsers = [...usersAsMembers, ...usersAsLeaders];
  
  // Group by user ID to handle users who might be both leaders and members
  const userMap = new Map();
  
  allUsers.forEach(user => {
    const userId = user.id;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        ...user,
        teams: []
      });
    }
    
    if (user.teamId) {
      const existingUser = userMap.get(userId);
      const teamExists = existingUser.teams.some((team: any) => team.teamId === user.teamId);
      
      if (!teamExists) {
        existingUser.teams.push({
          teamId: user.teamId,
          teamName: user.teamName,
          isLeader: user.isLeader
        });
      }
    }
  });

  return Array.from(userMap.values());
}
