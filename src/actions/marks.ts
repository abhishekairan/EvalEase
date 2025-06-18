"use server";

import { createMark } from "@/db/utils";
import { revalidatePath } from "next/cache";

interface MarkData {
  teamId: number;
  juryId: number;
  session: number;
  innovationScore: number;
  presentationScore: number;
  technicalScore: number;
  impactScore: number;
  submitted: boolean;
}

export async function submitMarks(markData: MarkData) {
  try {
    await createMark({ mark: markData });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error submitting marks:", error);
    throw new Error("Failed to submit marks");
  }
}
