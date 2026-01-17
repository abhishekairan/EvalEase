// actions/teamForm.ts

"use server";

import { z } from "zod";
import { teamDBSchema } from "@/zod/teamSchema";
import { revalidatePath } from "next/cache";
import { addTeamMember, createTeam } from "@/db/utils";

// Define the schema for the form data
const addTeamSchema = teamDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  member1Id: z.number().optional().nullable(),
  member2Id: z.number().optional().nullable(),
  member3Id: z.number().optional().nullable(),
});

type AddTeamFormData = z.infer<typeof addTeamSchema>;

export async function addTeamAction(data: AddTeamFormData) {
  try {
    // Validate the form data
    const validatedData = addTeamSchema.parse(data);

    // Create the team data for insertion
    const teamData = {
      teamName: validatedData.teamName,
      leaderId: validatedData.leaderId,
      juryId: validatedData.juryId || null,
      room: validatedData.room || null,
    };

    // Insert the team into the database
    const createdTeam = await createTeam({team: teamData});
    
    if (!createdTeam || createdTeam.length === 0) {
      throw new Error("Failed to create team");
    }

    const teamId = createdTeam[0].id;

    // Add team members if they are selected
    const memberIds = [
      validatedData.member1Id,
      validatedData.member2Id,
      validatedData.member3Id,
    ].filter((id): id is number => id !== null && id !== undefined);

    // Insert each member into the teamMembers table
    for (const memberId of memberIds) {
      await addTeamMember({teamMember: {
        teamId,
        memberId,
      }});
    }

    // Revalidate the path to refresh the data
    revalidatePath("/dashboard/teams");
    
    return { success: true, teamId };
  } catch (error) {
    console.error("Error in addTeamAction:", error);
    
    // Return error message for user-friendly display
    const errorMessage = error instanceof Error ? error.message : "Failed to add team";
    return { success: false, error: errorMessage };
  }
}
