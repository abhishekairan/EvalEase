// app/actions/participant-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { addTeamMember, createParticipant } from "@/db/utils";
import { participantsDBSchema } from "@/zod/";
import { teamMemberDBSchema } from "@/zod/teamMemberSchema";

interface AddParticipantData {
  name: string;
  email: string;
  phoneNumber: string;
  teamId?: number | null;
  institude?: string
}

export async function addParticipantAction(data: AddParticipantData) {
  try {
    // Create user data with student role
    const userData = participantsDBSchema.parse({
      name: data.name,
      email: data.email,
      institude: data.institude,
      phoneNumber: data.phoneNumber,
    });

    // Insert user into database
    // console.log(userData)
    const [newUser] = await createParticipant({participant: userData});

    // If team is selected, add user to team members
    if (data.teamId && newUser) {
      const teamMemberData = teamMemberDBSchema.safeParse({
        teamId: data.teamId,
        memberId: newUser.id,
      });
      // console.log(teamMemberData.data)
      if(teamMemberData.success) await addTeamMember({teamMember: teamMemberData.data});
    }

    // Revalidate the page to show updated data
    revalidatePath("/");
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error adding participant:", error);
    throw new Error("Failed to add participant");
  }
}
