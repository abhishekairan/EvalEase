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
      return { success: false, message: "Session has ended and marks cannot be modified" };
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
        return { success: false, message: "This mark has been locked and cannot be edited" };
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
    return { success: true, message: "Your evaluation has been saved" };
  } catch (error) {
    console.error("Error submitting marks:", error);
    return { success: false, message: "Unable to save marks" };
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
      return { success: false, message: "Mark not found" };
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
    return { success: true, message: "Mark locked - no further edits allowed" };
  } catch (error) {
    console.error("Error locking mark:", error);
    return { success: false, message: "Unable to lock mark" };
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
      return { success: false, message: "Mark not found" };
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
    return { success: true, message: "Mark unlocked - editing is now allowed" };
  } catch (error) {
    console.error("Error unlocking mark:", error);
    return { success: false, message: "Unable to unlock mark" };
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
    return { success: true, message: "All session marks have been locked" };
  } catch (error) {
    console.error("Error locking session marks:", error);
    return { success: false, message: "Unable to lock marks" };
  }
}

/**
 * Lock all marks for a specific jury in a session
 * Called by jury member to finalize all their evaluations
 * Creates default marks (0) for teams without marks
 */
export async function lockAllMarksForJuryInSession(params: {
  juryId: number;
  sessionId: number;
  teamIds: number[];
}) {
  try {
    // Get existing marks for this jury in this session
    const existingMarks = await getMarks({
      juryId: params.juryId,
      session: params.sessionId,
    });

    // Find teams that don't have marks yet
    const markedTeamIds = new Set(existingMarks.map(m => m.teamId));
    const teamsWithoutMarks = params.teamIds.filter(id => !markedTeamIds.has(id));

    // Create default marks (0) for teams without marks
    for (const teamId of teamsWithoutMarks) {
      await createMark({
        mark: {
          teamId,
          juryId: params.juryId,
          session: params.sessionId,
          innovationScore: 0,
          presentationScore: 0,
          technicalScore: 0,
          impactScore: 0,
          submitted: true,
          locked: true,
        },
      });
    }

    // Lock all marks (existing and new) for this jury in this session
    await db
      .update(marks)
      .set({ locked: true, submitted: true })
      .where(
        and(
          eq(marks.juryId, params.juryId),
          eq(marks.session, params.sessionId)
        )
      );

    const totalLocked = params.teamIds.length;
    const newlyCreated = teamsWithoutMarks.length;

    revalidatePath("/home");
    revalidatePath("/dashboard/marks");
    return { 
      success: true, 
      message: `Successfully submitted ${totalLocked} teams (${newlyCreated} with default marks)`,
      lockedCount: totalLocked,
    };
  } catch (error) {
    console.error("Error locking jury marks:", error);
    return { success: false, message: "Unable to lock marks", lockedCount: 0 };
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

/**
 * Fetch marks status for all teams in a session for a specific jury
 * Returns a map of teamId to {marked: boolean, locked: boolean}
 */
export async function getTeamsMarksStatus(params: {
  juryId: number;
  sessionId: number;
  teamIds: number[];
}) {
  try {
    // Get all marks for this jury in this session
    const allMarks = await getMarks({
      juryId: params.juryId,
      session: params.sessionId,
    });

    // Create a map of teamId to mark status
    const marksStatus: Record<number, { marked: boolean; locked: boolean }> = {};
    
    for (const teamId of params.teamIds) {
      const mark = allMarks.find(m => m.teamId === teamId);
      if (mark) {
        marksStatus[teamId] = {
          marked: true,
          locked: mark.locked || false,
        };
      }
    }

    return {
      success: true,
      marksStatus,
    };
  } catch (error) {
    console.error("Error fetching teams marks status:", error);
    return {
      success: false,
      marksStatus: {},
      message: "Failed to fetch marks status.",
    };
  }
}

