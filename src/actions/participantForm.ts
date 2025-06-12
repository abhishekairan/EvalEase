// app/actions/participant-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { insertUser, insertTeamMember } from "@/db/utils";
import { userDBSchema } from "@/zod/userSchema";
import { teamMemberDBSchema } from "@/zod/teamMemberSchema";

interface AddParticipantData {
  name: string;
  email: string;
  phoneNumber: string;
  teamId?: number | null;
}

export async function addParticipantAction(data: AddParticipantData) {
  try {
    // Create user data with student role
    const userData = userDBSchema.parse({
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: "student" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert user into database
    // console.log(userData)
    const [newUser] = await insertUser(userData);

    // If team is selected, add user to team members
    if (data.teamId && newUser) {
      const teamMemberData = teamMemberDBSchema.safeParse({
        teamId: data.teamId,
        memberId: newUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // console.log(teamMemberData.data)
      if(teamMemberData.success) await insertTeamMember(teamMemberData.data);
    }

    // Revalidate the page to show updated data
    revalidatePath("/");
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error adding participant:", error);
    throw new Error("Failed to add participant");
  }
}
