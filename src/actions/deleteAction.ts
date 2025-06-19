'use server'

import { deleteJury, deleteParticipant, deleteTeam } from "@/db/utils"
import { revalidatePath } from "next/cache"

export async function deleteTeamAction(id: number){
    const response = await deleteTeam({id})
    revalidatePath('/dashboard/teams')
    return response
}
export async function deleteJuryAction(id: number){
    const response = await deleteJury({id})
    revalidatePath('/dashboard/jury')
    return response
}
export async function deleteParticipantAction(id: number){
    const response = await deleteParticipant({id})
    revalidatePath('/dashboard/participants')
    return response
}