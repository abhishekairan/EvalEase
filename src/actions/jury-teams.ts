"use server";

import { getTeamsWithData } from "@/db/utils";

/**
 * Get teams assigned to a jury member for a specific session
 */
export async function getTeamsForJurySession(juryId: number, sessionId: number) {
  try {
    // Get all teams with their data
    const allTeams = await getTeamsWithData();

    // Filter teams assigned to this jury in this session
    const assignedTeams = allTeams.filter(
      team => team.juryId === juryId && team.session === sessionId
    );
    
    return assignedTeams;
  } catch (error) {
    console.error("Error fetching teams for jury session:", error);
    return [];
  }
}
