// actions/sessionActions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createSession, updateJurySession, updateSession, deleteSession, getJuryIdsBySession, deleteJurysSession, updateTeamjury, getJuryBySession, getTeamsBySession, saveDraft, publishDraft, deleteDraft, getDraftById, getDrafts } from "@/db/utils"
import { shuffleTeamsInSession } from "@/db/utils"
import { lockAllMarksForSession } from "./marks"
import { TeamDataType, juryDBType } from "@/zod"

interface AddSessionData {
  name: string
  juryIds: number[]
  teamAssignments?: Map<number, number> // teamId -> juryId
}

export async function addSessionAction(data: AddSessionData) {
  try {
    // Create the session
    const [newSession] = await createSession({
      session: {
        name: data.name,
      }
    })

    if (!newSession) {
      throw new Error("Failed to create session")
    }

    // Update jury members to assign them to this session
    await Promise.all(
      data.juryIds.map(juryId => 
        updateJurySession({ juryId, sessionId: newSession.id })
      )
    )

    // Handle team assignments if provided
    if (data.teamAssignments && data.teamAssignments.size > 0) {
      await Promise.all(
        Array.from(data.teamAssignments.entries()).map(([teamId, juryId]) =>
          updateTeamjury({ teamid: teamId, juryId })
        )
      )
    }

    // Revalidate the sessions page
    revalidatePath("/dashboard/sessions")
    revalidatePath("/dashboard/session")
    revalidatePath("/home")

    return { success: true, session: newSession }
  } catch (error) {
    console.error("Error creating session:", error)
    throw new Error("Failed to create session")
  }
}

export async function startSessionAction(sessionId: number) {
  try {
    const result = await updateSession({
      sessionId,
      updates: {
        startedAt: new Date()
      }
    })
    revalidatePath("/dashboard/sessions")
    revalidatePath("/home")
    return { success: true, session: result }
  } catch (error) {
    console.error("Error starting session:", error)
    throw new Error("Failed to start session")
  }
}

export async function endSessionAction(sessionId: number) {
  try {
    // Lock all marks for this session before ending
    const lockResult = await lockAllMarksForSession(sessionId);
    if (!lockResult.success) {
      console.warn("Warning: Failed to lock some marks:", lockResult.message);
      // Continue with ending session even if locking fails
    }

    // Update session with end time
    const result = await updateSession({
      sessionId,
      updates: {
        endedAt: new Date()
      }
    })
    
    // Remove jury members from session
    const juries = await getJuryIdsBySession({sessionId: sessionId})
    const response = await deleteJurysSession({juries})
    if(!response) throw new Error("Failed to stop session")
    
    revalidatePath("/dashboard/sessions")
    revalidatePath("/dashboard/marks")
    revalidatePath("/home")
    return { success: true, session: result }
  } catch (error) {
    console.error("Error ending session:", error)
    throw new Error("Failed to end session")
  }
}

export async function deleteSessionAction(sessionId: number) {
  try {
    const result = await deleteSession(sessionId)
    if (!result) {
      throw new Error("Failed to delete session")
    }
    
    revalidatePath("/dashboard/sessions")
    revalidatePath("/home")
    return { success: true }
  } catch (error) {
    console.error("Error deleting session:", error)
    throw new Error("Failed to delete session")
  }
}

export async function shuffleStudentsAction(sessionId: number) {
  try {
    const result = await shuffleTeamsInSession(sessionId)
    
    if (!result) {
      throw new Error("Failed to shuffle teams")
    }
    
    revalidatePath("/dashboard/sessions")
    revalidatePath("/dashboard/marks") // Also revalidate marks page
    revalidatePath("/home")
    
    return { success: true }
  } catch (error) {
    console.error("Error shuffling students:", error)
    throw new Error("Failed to shuffle students")
  }
}

export async function reassignTeamsForSession(
  sessionId: number,
  teamAssignments: [number, number][] // Array of [teamId, juryId] tuples
) {
  try {
    if (!sessionId) {
      throw new Error("Session ID is required")
    }

    if (!teamAssignments || teamAssignments.length === 0) {
      throw new Error("Team assignments are required")
    }

    // Update team assignments in parallel
    await Promise.all(
      teamAssignments.map(([teamId, juryId]) =>
        updateTeamjury({ teamid: teamId, juryId })
      )
    )

    // Revalidate relevant paths
    revalidatePath("/dashboard/sessions")
    revalidatePath("/dashboard/session")
    revalidatePath("/dashboard/marks")
    revalidatePath("/home")

    return { success: true }
  } catch (error) {
    console.error("Error reassigning teams:", error)
    throw new Error("Failed to reassign teams")
  }
}

// ==================== DRAFT ACTIONS ====================

/**
 * Save a draft session with jury assignments
 * @param sessionId - Existing session ID or null for new draft
 * @param name - Session name
 * @param juryIds - Array of jury member IDs
 * @param teamAssignments - Map of team to jury assignments
 */
export async function saveDraftAction(
  sessionId: number | null,
  name: string,
  juryIds: number[] = [],
  teamAssignments: Map<number, number> = new Map()
) {
  try {
    if (!name || name.trim().length === 0) {
      throw new Error("Session name is required")
    }

    const result = await saveDraft({ sessionId, name })

    if (!result) {
      throw new Error("Failed to save draft")
    }

    const draftId = result.id

    // Save jury assignments if provided
    if (juryIds.length > 0) {
      await Promise.all(
        juryIds.map(juryId =>
          updateJurySession({ juryId, sessionId: draftId })
        )
      )
    }

    // Save team assignments if provided
    if (teamAssignments && teamAssignments.size > 0) {
      await Promise.all(
        Array.from(teamAssignments.entries()).map(([teamId, juryId]) =>
          updateTeamjury({ teamid: teamId, juryId })
        )
      )
    }

    revalidatePath("/dashboard/session")

    return { success: true, draftId }
  } catch (error) {
    console.error("Error saving draft:", error)
    throw new Error("Failed to save draft")
  }
}

/**
 * Publish a draft session (convert to live session)
 * @param draftId - Draft session ID to publish
 * @param juryIds - Array of jury member IDs
 * @param teamAssignments - Map of team to jury assignments
 */
export async function publishDraftAction(
  draftId: number,
  juryIds: number[] = [],
  teamAssignments: Map<number, number> = new Map()
) {
  try {
    if (!draftId) {
      throw new Error("Draft ID is required")
    }

    // Ensure jury and teams are assigned before publishing
    if (juryIds.length > 0) {
      await Promise.all(
        juryIds.map(juryId =>
          updateJurySession({ juryId, sessionId: draftId })
        )
      )
    }

    if (teamAssignments && teamAssignments.size > 0) {
      await Promise.all(
        Array.from(teamAssignments.entries()).map(([teamId, juryId]) =>
          updateTeamjury({ teamid: teamId, juryId })
        )
      )
    }

    const result = await publishDraft(draftId)

    if (!result) {
      throw new Error("Failed to publish draft")
    }

    revalidatePath("/dashboard/session")
    revalidatePath("/dashboard/sessions")

    return { success: true, session: result }
  } catch (error) {
    console.error("Error publishing draft:", error)
    throw new Error("Failed to publish draft")
  }
}

/**
 * Delete a draft session
 * @param draftId - Draft session ID to delete
 */
export async function deleteDraftAction(draftId: number) {
  try {
    if (!draftId) {
      throw new Error("Draft ID is required")
    }

    const result = await deleteDraft(draftId)

    if (!result) {
      throw new Error("Failed to delete draft")
    }

    revalidatePath("/dashboard/session")
    revalidatePath("/dashboard/sessions")

    return { success: true }
  } catch (error) {
    console.error("Error deleting draft:", error)
    throw new Error("Failed to delete draft")
  }
}

/**
 * Get all drafts for the dashboard
 */
export async function getDraftsAction() {
  try {
    const drafts = await getDrafts()
    return { success: true, drafts }
  } catch (error) {
    console.error("Error fetching drafts:", error)
    return { success: false, drafts: [], error: "Failed to fetch drafts" }
  }
}

/**
 * Resume a draft session - get draft data
 * @param draftId - Draft session ID to resume
 */
export async function resumeDraftAction(draftId: number) {
  try {
    if (!draftId) {
      throw new Error("Draft ID is required")
    }

    const draft = await getDraftById(draftId)

    if (!draft) {
      throw new Error("Draft not found")
    }

    return { success: true, draft }
  } catch (error) {
    console.error("Error resuming draft:", error)
    throw new Error("Failed to resume draft")
  }
}
