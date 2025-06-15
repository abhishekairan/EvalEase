"use server";

import { revalidatePath } from "next/cache";
import { createJury } from "@/db/utils";
import { juryDBSchema } from "@/zod/userSchema";

interface AddJuryData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  session?: number | null;
}

export async function addJuryAction(data: AddJuryData) {
  try {
    // Separate password from jury data
    const { password, ...juryInfo } = data;

    // Create jury data without password
    const juryData = juryDBSchema.omit({ password: true }).parse({
      name: juryInfo.name,
      email: juryInfo.email,
      phoneNumber: juryInfo.phoneNumber,
      session: juryInfo.session,
    });

    // Insert jury with password handling
    const [newJury] = await createJury({ 
      jury: juryData, 
      password: password 
    });

    // Revalidate the page to show updated data
    revalidatePath("/dashboard/jury");

    return { success: true, jury: newJury };
  } catch (error) {
    console.error("Error adding jury:", error);
    throw new Error("Failed to add jury");
  }
}
