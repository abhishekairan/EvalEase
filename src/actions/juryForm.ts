"use server";

import { revalidatePath } from "next/cache";
import { createJury, updateJurySession, removeJuryFromSession, getSessionsForJury, updateJuryPassword } from "@/db/utils";
import { juryDBSchema } from "@/zod/userSchema";

interface AddJuryData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: string;
  sessionIds?: number[]; // Support multiple sessions
}

export async function addJuryAction(data: AddJuryData) {
  try {
    // Separate password and sessionIds from jury data
    const { password, sessionIds, ...juryInfo } = data;

    // Create jury data without password and sessionIds
    const juryData = juryDBSchema.omit({ password: true, session: true }).parse({
      name: juryInfo.name,
      email: juryInfo.email,
      phoneNumber: juryInfo.phoneNumber,
      role: juryInfo.role || "jury",
    });

    // Insert jury with password handling
    const [newJury] = await createJury({ 
      jury: juryData, 
      password: password 
    });

    // Assign jury to multiple sessions if provided
    if (sessionIds && sessionIds.length > 0 && newJury.id) {
      await Promise.all(
        sessionIds.map(sessionId => 
          updateJurySession({ juryId: newJury.id!, sessionId })
        )
      );
    }

    // Revalidate the page to show updated data
    revalidatePath("/dashboard/jury");
    revalidatePath("/dashboard/session");

    return { success: true, jury: newJury };
  } catch (error) {
    console.error("Error adding jury:", error);
    throw new Error("Failed to add jury");
  }
}

/**
 * Updates session assignments for an existing jury member
 * Removes old assignments and adds new ones
 */
export async function updateJurySessionsAction({
  juryId,
  sessionIds,
}: {
  juryId: number;
  sessionIds: number[];
}) {
  try {
    // Get current sessions
    const currentSessions = await getSessionsForJury({ juryId });
    const currentSessionIds = currentSessions.map((s) => s.id);

    // Find sessions to add and remove
    const sessionsToAdd = sessionIds.filter((id) => !currentSessionIds.includes(id));
    const sessionsToRemove = currentSessionIds.filter((id) => !sessionIds.includes(id));

    // Remove sessions that are no longer assigned
    if (sessionsToRemove.length > 0) {
      await Promise.all(
        sessionsToRemove.map((sessionId) =>
          removeJuryFromSession({ juryId, sessionId })
        )
      );
    }

    // Add new sessions
    if (sessionsToAdd.length > 0) {
      await Promise.all(
        sessionsToAdd.map((sessionId) =>
          updateJurySession({ juryId, sessionId })
        )
      );
    }

    // Revalidate paths
    revalidatePath("/dashboard/jury");
    revalidatePath("/dashboard/session");

    return { success: true };
  } catch (error) {
    console.error("Error updating jury sessions:", error);
    throw new Error("Failed to update jury sessions");
  }
}

/**
 * Reset password for a jury member
 */
export async function resetJuryPasswordAction({
  juryId,
  email,
  newPassword,
}: {
  juryId: number;
  email: string;
  newPassword: string;
}) {
  try {
    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" };
    }

    const result = await updateJuryPassword({ email, newPassword });

    if (result) {
      revalidatePath("/dashboard/jury");
      return { success: true, message: "Password reset successfully" };
    } else {
      return { success: false, message: "Failed to reset password" };
    }
  } catch (error) {
    console.error("Error resetting jury password:", error);
    return { success: false, message: "Failed to reset password" };
  }
}
