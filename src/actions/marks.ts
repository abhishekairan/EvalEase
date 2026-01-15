"use server";

import { createMark, getSessionById, getMarks, updateMark } from "@/db/utils";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { marks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface MarkData {
  teamId: number;
  juryId: number;
  session: number;
  innovationScore: number;
  presentationScore: number;
  technicalScore: number;
  impactScore: number;
  submitted: boolean;
  locked?: boolean;
}

/**
 * Submit or update marks for a team
 * Supports both creating new marks and updating existing marks
 * Does not remove team from jury (allows editing)
 */
export async function submitMarks(markData: MarkData) {
  try {
    // Check if session has ended
    const sessionData = await getSessionById(markData.session);
    if(sessionData?.endedAt) {
      revalidatePath("/home");
      return { success: false, message: "Session has ended. Cannot submit marks." };
    }

    // Check if mark already exists
    const existingMarks = await getMarks({ 
      teamId: markData.teamId, 
      juryId: markData.juryId,
      session: markData.session
    });

    if (existingMarks.length > 0) {
      // Update existing mark
      const existingMark = existingMarks[0];
      
      // Check if mark is locked
      if (existingMark.locked) {
        return { success: false, message: "Mark is locked and cannot be edited." };
      }

      // Update the mark
      await updateMark({ 
        mark: {
          ...existingMark,
          innovationScore: markData.innovationScore,
          presentationScore: markData.presentationScore,
          technicalScore: markData.technicalScore,
          impactScore: markData.impactScore,
          submitted: markData.submitted,
        }
      });
    } else {
      // Create new mark
      await createMark({ mark: { ...markData, locked: false } });
    }

    // Do NOT remove team from jury (allows re-editing)
    // await updateTeamjury({teamid: markData.teamId, juryId: null})
    
    revalidatePath("/home");
    revalidatePath("/dashboard/marks");
    revalidatePath("/dashboard/sessions");
    return { success: true, message: "Marks saved successfully." };
  } catch (error) {
    console.error("Error submitting marks:", error);
    return { success: false, message: "Failed to submit marks." };
  }
}

/**
 * Lock marks to prevent further editing
 * Can be called by jury member to voluntarily lock their marks
 */
export async function lockMarks(params: { markId: number }) {
  try {
    const existingMarks = await getMarks({ id: params.markId });
    
    if (existingMarks.length === 0) {
      return { success: false, message: "Mark not found." };
    }

    const mark = existingMarks[0];
    
    await updateMark({ 
      mark: {
        ...mark,
        locked: true,
      }
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/marks");
    return { success: true, message: "Mark locked successfully." };
  } catch (error) {
    console.error("Error locking mark:", error);
    return { success: false, message: "Failed to lock mark." };
  }
}

/**
 * Unlock marks (admin only)
 * Allows admin to unlock marks for corrections
 */
export async function unlockMarks(params: { markId: number }) {
  try {
    const existingMarks = await getMarks({ id: params.markId });
    
    if (existingMarks.length === 0) {
      return { success: false, message: "Mark not found." };
    }

    const mark = existingMarks[0];
    
    await updateMark({ 
      mark: {
        ...mark,
        locked: false,
      }
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/marks");
    return { success: true, message: "Mark unlocked successfully." };
  } catch (error) {
    console.error("Error unlocking mark:", error);
    return { success: false, message: "Failed to unlock mark." };
  }
}

/**
 * Lock all marks for a session
 * Called when session ends
 */
export async function lockAllMarksForSession(sessionId: number) {
  try {
    await db
      .update(marks)
      .set({ locked: true })
      .where(eq(marks.session, sessionId));

    revalidatePath("/dashboard/marks");
    revalidatePath("/dashboard/sessions");
    return { success: true, message: "All marks locked for session." };
  } catch (error) {
    console.error("Error locking session marks:", error);
    return { success: false, message: "Failed to lock marks." };
  }
}

/**
 * Fetch existing mark for a team by a jury in a session
 * Server action for client components to use
 */
export async function getExistingMark(params: {
  teamId: number;
  juryId: number;
  sessionId: number;
}) {
  try {
    const marks = await getMarks({
      teamId: params.teamId,
      juryId: params.juryId,
      session: params.sessionId,
    });

    return {
      success: true,
      mark: marks.length > 0 ? marks[0] : null,
    };
  } catch (error) {
    console.error("Error fetching existing mark:", error);
    return {
      success: false,
      mark: null,
      message: "Failed to fetch existing mark.",
    };
  }
}

