import { db } from "./index";
import { MarksDBType, TeamDBType, TeamMemberDBType, UserDBType } from "@/zod";
import { teams, users, teamMembers, marks } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves users from the database with optional filtering
 * Only pass one parameter at a time for proper filtering
 * 
 * @param id - Unique user ID to fetch a specific user
 * @param type - User role filter ('admin', 'jury', or 'student')
 * @param email - Email address to find a specific user
 * @returns Promise<User[]> - Array of users matching the criteria
 * 
 * @example
 * // Get all users
 * const allUsers = await getUsers();
 * 
 * // Get user by ID
 * const user = await getUsers(1);
 * 
 * // Get all jury members
 * const juryMembers = await getUsers(undefined, 'jury');
 * 
 * // Get user by email
 * const user = await getUsers(undefined, undefined, 'user@example.com');
 */
export async function getUsers(
  id?: number,
  type?: "admin" | "jury" | "student",
  email?: string
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
 * @returns Promise<User> - The created user object
 * 
 * @example
 * const newUser = await insertUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'student'
 * });
 */
export async function insertUser(user: UserDBType) {
  const { id } = (await db.insert(users).values(user).$returningId())[0];
  const userObj = await getUsers(id);
  return userObj
}

/**
 * Deletes a user from the database
 * 
 * @param id - ID of the user to delete
 * @returns Promise<User[]> - Empty array if deletion was successful
 * 
 * @example
 * await deleteUser(1);
 */
export async function deleteUser(id: number){
  await db.delete(users).where(eq(users.id,id))
  const user = await getUsers(id)
  return user
}

/**
 * Updates an existing user in the database
 * 
 * @param user - Updated user data with ID included
 * @returns Promise<User[]> - Array containing the updated user
 * 
 * @example
 * const updatedUser = await updateUser({
 *   id: 1,
 *   name: 'John Smith',
 *   email: 'johnsmith@example.com',
 *   role: 'jury'
 * });
 */
export async function updateUser(user: UserDBType){
  await db.update(users).set({...user}).where(eq(users.id,user.id))
  return await getUsers(user.id)
}

// ================================
// TEAMS CRUD OPERATIONS
// ================================

/**
 * Retrieves teams from the database with optional filtering
 * 
 * @param id - Unique team ID to fetch a specific team
 * @returns Promise<Team[]> - Array of teams matching the criteria
 * 
 * @example
 * // Get all teams
 * const allTeams = await getTeams();
 * 
 * // Get specific team
 * const team = await getTeams(1);
 */
export async function getTeams(id?: number) {
  if (id) {
    const response = await db.select().from(teams).where(eq(teams.id, id));
    return response;
  }
  const response = await db.select().from(teams);
  return response;
}

/**
 * Creates a new team in the database
 * 
 * @param team - Team data conforming to TeamDBType schema
 * @returns Promise<Team[]> - Array containing the created team
 * 
 * @example
 * const newTeam = await insertTeam({
 *   teamName: 'Innovation Squad',
 *   leaderId: 5
 * });
 */
export async function insertTeam(team: TeamDBType) {
  const { id } = (await db.insert(teams).values(team).$returningId())[0];
  const teamObj = await getTeams(id);
  return teamObj;
}

/**
 * Deletes a team from the database
 * 
 * @param id - ID of the team to delete
 * @returns Promise<Team[]> - Empty array if deletion was successful
 * 
 * @example
 * await deleteTeam(1);
 */
export async function deleteTeam(id: number) {
  await db.delete(teams).where(eq(teams.id, id));
  const team = await getTeams(id);
  return team;
}

/**
 * Updates an existing team in the database
 * 
 * @param team - Updated team data with ID included
 * @returns Promise<Team[]> - Array containing the updated team
 * 
 * @example
 * const updatedTeam = await updateTeam({
 *   id: 1,
 *   teamName: 'Updated Team Name',
 *   leaderId: 3
 * });
 */
export async function updateTeam(team: TeamDBType) {
  await db.update(teams).set({...team}).where(eq(teams.id, team.id));
  return await getTeams(team.id);
}

// ================================
// TEAM MEMBERS CRUD OPERATIONS
// ================================

/**
 * Retrieves team members from the database with optional filtering
 * 
 * @param id - Unique team member ID to fetch a specific member
 * @param teamId - Team ID to fetch all members of a specific team
 * @returns Promise<TeamMember[]> - Array of team members matching the criteria
 * 
 * @example
 * // Get all team members
 * const allMembers = await getTeamMembers();
 * 
 * // Get specific team member
 * const member = await getTeamMembers(1);
 * 
 * // Get all members of a team
 * const teamMembers = await getTeamMembers(undefined, 5);
 */
export async function getTeamMembers(id?: number, teamId?: number) {
  if (id) {
    const response = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return response;
  } else if (teamId) {
    const response = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
    return response;
  }
  const response = await db.select().from(teamMembers);
  return response;
}

/**
 * Adds a new member to a team
 * 
 * @param teamMember - Team member data conforming to TeamMemberDBType schema
 * @returns Promise<TeamMember[]> - Array containing the created team member
 * 
 * @example
 * const newMember = await insertTeamMember({
 *   teamId: 1,
 *   memberId: 3
 * });
 */
export async function insertTeamMember(teamMember: TeamMemberDBType) {
  const { id } = (await db.insert(teamMembers).values(teamMember).$returningId())[0];
  const teamMemberObj = await getTeamMembers(id);
  return teamMemberObj;
}

/**
 * Removes a member from a team
 * 
 * @param id - ID of the team member record to delete
 * @returns Promise<TeamMember[]> - Empty array if deletion was successful
 * 
 * @example
 * await deleteTeamMember(1);
 */
export async function deleteTeamMember(id: number) {
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
  const teamMember = await getTeamMembers(id);
  return teamMember;
}

/**
 * Updates an existing team member record
 * 
 * @param teamMember - Updated team member data with ID included
 * @returns Promise<TeamMember[]> - Array containing the updated team member
 * 
 * @example
 * const updatedMember = await updateTeamMember({
 *   id: 1,
 *   teamId: 2,
 *   memberId: 4
 * });
 */
export async function updateTeamMember(teamMember: TeamMemberDBType) {
  await db.update(teamMembers).set({...teamMember}).where(eq(teamMembers.id, teamMember.id));
  return await getTeamMembers(teamMember.id);
}

// ================================
// MARKS CRUD OPERATIONS
// ================================

/**
 * Retrieves marks from the database with optional filtering
 * 
 * @param id - Unique mark ID to fetch a specific mark record
 * @param teamId - Team ID to fetch all marks for a specific team
 * @param juryId - Jury ID to fetch all marks given by a specific jury member
 * @returns Promise<Mark[]> - Array of marks matching the criteria
 * 
 * @example
 * // Get all marks
 * const allMarks = await getMarks();
 * 
 * // Get specific mark
 * const mark = await getMarks(1);
 * 
 * // Get all marks for a team
 * const teamMarks = await getMarks(undefined, 5);
 * 
 * // Get all marks by a jury member
 * const juryMarks = await getMarks(undefined, undefined, 3);
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
 * Creates a new mark record in the database
 * 
 * @param mark - Mark data conforming to MarksDBType schema
 * @returns Promise<Mark[]> - Array containing the created mark
 * 
 * @example
 * const newMark = await insertMark({
 *   teamId: 1,
 *   juryId: 2,
 *   innovationScore: 85,
 *   presentationScore: 90,
 *   technicalScore: 88,
 *   impactScore: 92,
 *   submitted: true
 * });
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
 * @returns Promise<Mark[]> - Empty array if deletion was successful
 * 
 * @example
 * await deleteMark(1);
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
 * @returns Promise<Mark[]> - Array containing the updated mark
 * 
 * @example
 * const updatedMark = await updateMark({
 *   id: 1,
 *   teamId: 1,
 *   juryId: 2,
 *   innovationScore: 90,
 *   presentationScore: 95,
 *   technicalScore: 92,
 *   impactScore: 88,
 *   submitted: true
 * });
 */
export async function updateMark(mark: MarksDBType) {
  await db.update(marks).set({...mark}).where(eq(marks.id, mark.id));
  return await getMarks(mark.id);
}
