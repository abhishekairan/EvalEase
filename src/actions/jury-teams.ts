"use server";

import { db } from "@/db";
import { teams, jurySessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTeamsWithData } from "@/db/utils";

/**
 * Get teams assigned to a jury member for a specific session
 */
export async function getTeamsForJurySession(juryId: number, sessionId: number) {
  try {
    // First, check if the jury is assigned to this session
    const jurySessionAssignment = await db
      .select()
      .from(jurySessions)
      .where(
        and(
          eq(jurySessions.juryId, juryId),
          eq(jurySessions.sessionId, sessionId)
        )
      );

    if (jurySessionAssignment.length === 0) {
      return [];
    }

    // Get all teams with their data
    const allTeams = await getTeamsWithData();

    // Filter teams assigned to this jury
    const assignedTeams = allTeams.filter(
      team => team.juryId === juryId
    );
    
    return assignedTeams;
  } catch (error) {
    console.error("Error fetching teams for jury session:", error);
    return [];
  }
}
