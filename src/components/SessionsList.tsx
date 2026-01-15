// components/SessionsList.tsx
"use client"

import { SessionCard } from "@/components/sessionCard"
import { 
  startSessionAction, 
  endSessionAction, 
  shuffleStudentsAction,
  deleteSessionAction
} from "@/actions/sessionActions"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SessionsListProps {
  sessionsWithStats: Array<{
    session: {
      id: number
      name: string
      startedAt: Date | null
      endedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }
    stats: {
      totalTeams: number
      totalJury: number
      totalMarks: number
      submittedMarks: number
      averageScore: number
      isActive: boolean
    }
  }>
}

export function SessionsList({ sessionsWithStats }: SessionsListProps) {
  const handleStartSession = async (sessionId: number) => {
    try {
      await startSessionAction(sessionId)
    } catch (error) {
      console.error("Failed to start session:", error)
    }
  }

  const handleEndSession = async (sessionId: number) => {
    try {
      await endSessionAction(sessionId)
    } catch (error) {
      console.error("Failed to end session:", error)
    }
  }

  const handleShuffleStudents = async (sessionId: number) => {
    try {
      await shuffleStudentsAction(sessionId)
    } catch (error) {
      console.error("Failed to shuffle students:", error)
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSessionAction(sessionId)
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  if (sessionsWithStats.length === 0) {
    return (
      <div className="text-center py-16 mx-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No sessions found</h3>
            <p className="text-gray-500 mt-1">Create your first session to get started</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/dashboard/session/add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="m-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessionsWithStats.map(({ session, stats }) => (
          <SessionCard
            key={session.id}
            session={session}
            stats={stats}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onShuffleStudents={handleShuffleStudents}
            onDeleteSession={handleDeleteSession}
          />
        ))}
      </div>
    </div>
  )
}
