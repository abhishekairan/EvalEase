// app/dashboard/session/add/page.tsx
import { SiteHeader } from '@/components/site-header'
import { AddSessionForm } from '@/components/AddSessionForm'
import { getJury } from '@/db/utils'
import React from 'react'

const page = async () => {
  // Fetch all jury members for selection
  const juryMembers = await getJury()

  return (
    <>
      <SiteHeader title='Add New Session'/>
      <div className="container mx-auto pt-10 flex items-center justify-between mb-6">
      <AddSessionForm juryMembers={juryMembers} />
      </div>
    </>
  )
}

export default page
