"use server";

import { getTeamsWithData } from "@/db/utils";

export async function getTeamsForJury(juryId: number) {

  try {
    // Get all teams with their data
    const allTeams = await getTeamsWithData();

    // Filter teams assigned to this jury and add marking status
    const assignedTeams = allTeams
      .filter(team => team.juryId == juryId)
    // console.log(assignedTeams)
    return assignedTeams;
  } catch (error) {
    console.error("Error fetching teams for jury:", error);
    return [];
  }
}
