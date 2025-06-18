"use server";

import { getTeamsWithData } from "@/db/utils";
import { getMarks } from "@/db/utils";

export async function getTeamsForJury(juryId: number, sessionId: number | null) {
  if (!sessionId) {
    return [];
  }

  try {
    // Get all marks for this jury in this session
    const juryMarks = await getMarks({ juryId, session: sessionId });
    const markedTeamIds = juryMarks.map(mark => mark.teamId);

    // Get all teams with their data
    const allTeams = await getTeamsWithData();

    // Filter teams assigned to this jury and add marking status
    const assignedTeams = allTeams
      .filter(team => markedTeamIds.includes(team.id) || 
        // Add logic here to determine which teams are assigned to this jury
        // This depends on your team assignment logic
        true
      )
      .map(team => ({
        ...team,
        isMarked: markedTeamIds.includes(team.id)
      }));

    return assignedTeams;
  } catch (error) {
    console.error("Error fetching teams for jury:", error);
    return [];
  }
}
