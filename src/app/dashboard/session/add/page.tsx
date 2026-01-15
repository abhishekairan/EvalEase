// app/dashboard/session/add/page.tsx
import { SiteHeader } from '@/components/site-header'
import { AddSessionForm } from '@/components/AddSessionForm'
import { getJury, getTeamsWithData } from '@/db/utils'
import React from 'react'

const page = async () => {
  // Fetch all jury members and teams with full data for filtering
  const juryMembers = await getJury()
  const teams = await getTeamsWithData()

  return (
    <>
      <SiteHeader title='Add New Session'/>
      <div className="container mx-auto pt-10 flex items-center justify-between mb-6">
      <AddSessionForm juryMembers={juryMembers} teams={teams} />
      </div>
    </>
  )
}

export default page
