// db/sessionUtils.ts
import { db } from "@/db"
import { sessions, jury, teams, marks } from "@/db/schema"
import { eq, count, avg, sql, inArray } from "drizzle-orm"
import { getJuryIdsBySession } from "./juryUtils"
import { getTeamIds } from "./teamUtils"

export async function getSessions() {
  try {
    const result = await db.select().from(sessions).orderBy(sessions.createdAt)
    return result
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return []
  }
}

export async function getSessionById(id: number) {
  try {
    const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

// Add this function to db/sessionUtils.ts
export async function getSessionStats(sessionId: number) {
  try {
    // Get total jury assigned to this session
    const juryCount = await db
      .select({ count: count() })
      .from(jury)
      .where(eq(jury.session, sessionId))

    // Get total teams (all teams participate in all sessions)
    const teamCount = await db
      .select({ count: count() })
      .from(teams)

    // Get marks statistics for this session
    const marksStats = await db
      .select({
        totalMarks: count(),
        submittedMarks: sql<number>`SUM(CASE WHEN ${marks.submitted} = 1 THEN 1 ELSE 0 END)`,
        averageScore: avg(sql<number>`${marks.innovationScore} + ${marks.presentationScore} + ${marks.technicalScore} + ${marks.impactScore}`)
      })
      .from(marks)
      .where(eq(marks.session, sessionId))

    // Check if session is currently active
    const sessionInfo = await getSessionById(sessionId)
    const isActive = sessionInfo?.startedAt && !sessionInfo?.endedAt

    return {
      totalTeams: teamCount[0]?.count || 0,
      totalJury: juryCount[0]?.count || 0,
      totalMarks: marksStats[0]?.totalMarks || 0,
      submittedMarks: marksStats[0]?.submittedMarks || 0,
      averageScore: Number(marksStats[0]?.averageScore) || 0,
      isActive: !!isActive
    }
  } catch (error) {
    console.error("Error fetching detailed session stats:", error)
    return {
      totalTeams: 0,
      totalJury: 0,
      totalMarks: 0,
      submittedMarks: 0,
      averageScore: 0,
      isActive: false
    }
  }
}


export async function createSession({ session }: { session: { name: string } }) {
  try {
    const result = await db.insert(sessions).values({
      name: session.name,
    }).$returningId()

    if (result.length > 0) {
      return await db.select().from(sessions).where(eq(sessions.id, result[0].id))
    }
    
    return []
  } catch (error) {
    console.error("Error creating session:", error)
    return []
  }
}

export async function updateSession({ 
  sessionId, 
  updates 
}: { 
  sessionId: number
  updates: Partial<{
    name: string
    startedAt: Date | null
    endedAt: Date | null
  }>
}) {
  try {
    await db
      .update(sessions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(sessions.id, sessionId))

    return await getSessionById(sessionId)
  } catch (error) {
    console.error("Error updating session:", error)
    return null
  }
}

export async function deleteSession(sessionId: number) {
  try {
    // First, unassign jury members from this session
    await db
      .update(jury)
      .set({ session: null })
      .where(eq(jury.session, sessionId))

    // Delete marks for this session
    await db
      .delete(marks)
      .where(eq(marks.session, sessionId))

    // Finally, delete the session
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))

    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    return false
  }
}


// Delete jury session
export async function deleteJurysSession({juries}:{juries: number[]}){
  try{
    await db.update(jury).set({session: null}).where(inArray(jury.session,juries))
    return true
  }catch(err){
    console.log(err)
    return false
  }
}

export async function updateJurySession({ juryId, sessionId }: { juryId: number; sessionId: number }) {
  try {
    return await db
      .update(jury)
      .set({ session: sessionId })
      .where(eq(jury.id, juryId))
  } catch (error) {
    console.error("Error updating jury session:", error)
    return null
  }
}

export async function getSessionsForDropdown() {
  const data = await db.select({ 
    id: sessions.id, 
    name: sessions.name 
  }).from(sessions);
  
  return data;
}

/**
 * Shuffles team assignments among jury members in a session
 * @param sessionId - The session ID to shuffle teams for
 * @returns Promise<boolean> - Success status of the shuffle operation
 */
export async function shuffleTeamsInSession(sessionId: number): Promise<boolean> {
  try {
    // Get all jury members in this session
    const juryMembers = await getJuryIdsBySession({sessionId})

    if (juryMembers.length === 0) {
      throw new Error("No jury members found in this session")
    }

    // Get all teams (assuming all teams participate in all sessions)
    const allTeams = await getTeamIds()

    if (allTeams.length === 0) {
      throw new Error("No teams found to shuffle")
    }
    // Create shuffled assignments
    const shuffledAssignments = createShuffledAssignments(
      allTeams,
      juryMembers
    )
    // console.log(shuffledAssignments) // => { '1': [ 8, 5, 2, 4 ], '2': [ 1, 6, 10 ], '7': [ 3, 7, 9 ] }
    const queries = []
    for(const [value, ids] of Object.entries(shuffledAssignments)){
      queries.push(db.update(teams)
        .set({ juryId: Number(value) })
        .where(inArray(teams.id, ids)))
    }
    await Promise.all(queries);

    return true
  } catch (error) {
    console.error("Error shuffling teams:", error)
    return false
  }
}

/**
 * Creates shuffled team-jury assignments with balanced distribution
 * @param teamIds - Array of team IDs
 * @param juryIds - Array of jury IDs
 * @returns Record<number, number[]> - Key-value pairs mapping jury IDs to arrays of team IDs
 */
function createShuffledAssignments(teamIds: number[], juryIds: number[]): Record<number, number[]> {
  const assignments: Record<number, number[]> = {}
  
  // Initialize empty arrays for each jury member
  juryIds.forEach(juryId => {
    assignments[juryId] = []
  })
  
  // Shuffle teams randomly
  const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5)
  
  // Calculate base teams per jury and remainder
  const teamsPerJury = Math.floor(shuffledTeams.length / juryIds.length)
  const remainder = shuffledTeams.length % juryIds.length
  
  let teamIndex = 0
  
  // Distribute teams among jury members
  for (let juryIndex = 0; juryIndex < juryIds.length; juryIndex++) {
    const juryId = juryIds[juryIndex]
    
    // Calculate how many teams this jury member should get
    const teamsForThisJury = teamsPerJury + (juryIndex < remainder ? 1 : 0)
    
    // Assign teams to this jury member
    for (let i = 0; i < teamsForThisJury && teamIndex < shuffledTeams.length; i++) {
      assignments[juryId].push(shuffledTeams[teamIndex])
      teamIndex++
    }
  }
  
  return assignments
}



/**
 * Gets current team distribution for a session
 * @param sessionId - The session ID
 * @returns Promise<Array> - Current team-jury assignments
 */
export async function getTeamDistribution(sessionId: number) {
  try {
    const distribution = await db
      .select({
        teamId: marks.teamId,
        juryId: marks.juryId,
        teamName: teams.teamName,
        juryName: jury.name
      })
      .from(marks)
      .innerJoin(teams, eq(marks.teamId, teams.id))
      .innerJoin(jury, eq(marks.juryId, jury.id))
      .where(eq(marks.session, sessionId))

    return distribution
  } catch (error) {
    console.error("Error getting team distribution:", error)
    return []
  }
}
