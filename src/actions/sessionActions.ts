// actions/sessionActions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createSession, updateJurySession, updateSession, deleteSession, getJuryBySession, getJuryIdsBySession, deleteJurysSession } from "@/db/utils"
import { shuffleTeamsInSession } from "@/db/utils"

interface AddSessionData {
  name: string
  juryIds: number[]
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

    // Revalidate the sessions page
    revalidatePath("/dashboard/sessions")
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
    const result = await updateSession({
      sessionId,
      updates: {
        endedAt: new Date()
      }
    })
    const juries = await getJuryIdsBySession({sessionId: sessionId})
    const response = await deleteJurysSession({juries})
    if(!response) throw new Error("Failed to stop session")
    
    revalidatePath("/dashboard/sessions")
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
