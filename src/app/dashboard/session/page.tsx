// app/dashboard/sessions/page.tsx
import { SessionsList } from '@/components/SessionsList'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getSessions, getSessionStats } from '@/db/utils'
import { Suspense } from 'react'

function SessionsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="m-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

async function SessionsContent() {
  try {
    const sessions = await getSessions()
    // console.log("Session Recived for session page:", sessions)
    // Get stats for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const stats = await getSessionStats(session.id)
        return { session, stats }
      })
    )

    return <SessionsList sessionsWithStats={sessionsWithStats} />
  } catch (error) {
    console.error("Error loading sessions:", error)
    return (
      <div className="text-center py-6">
        <h2 className="text-xl font-semibold text-red-600">Error Loading Sessions</h2>
        <p className="text-gray-600 mt-2">
          There was an error loading the sessions data. Please try again later.
        </p>
      </div>
    )
  }
}

const page = () => {
  return (
    <>
      <SiteHeader title='Sessions'/>
      <div className="flex items-center justify-between container mx-auto pt-6">
        <Button asChild>
          <Link href="/dashboard/session/add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Session
          </Link>
        </Button>
      </div>
      <Suspense fallback={<SessionsPageSkeleton />}>
        <SessionsContent />
      </Suspense>
    </>
  )
}

export default page
