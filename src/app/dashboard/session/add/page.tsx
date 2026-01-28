// app/dashboard/session/add/page.tsx
import { SiteHeader } from '@/components/site-header'
import { AddSessionForm } from '@/components/AddSessionForm'
import { getJury, getTeamsWithData, getDraftById } from '@/db/utils'
import React from 'react'

interface PageProps {
  searchParams: Promise<{ draftId?: string }>
}

const page = async ({ searchParams }: PageProps) => {
  // Fetch all jury members and teams with full data for filtering
  const juryMembers = await getJury()
  const teams = await getTeamsWithData()
  
  // Check if resuming a draft
  const params = await searchParams
  const draftIdParam = params.draftId
  let draftId: number | null = null
  let existingDraft = null
  
  if (draftIdParam) {
    draftId = parseInt(draftIdParam, 10)
    if (!isNaN(draftId)) {
      existingDraft = await getDraftById(draftId)
    }
  }

  return (
    <>
      <SiteHeader title={existingDraft ? 'Resume Draft' : 'Add New Session'}/>
      <div className="container mx-auto pt-10 flex items-center justify-between mb-6">
        <AddSessionForm 
          juryMembers={juryMembers} 
          teams={teams} 
          draftId={draftId}
          existingDraft={existingDraft}
        />
      </div>
    </>
  )
}

export default page
