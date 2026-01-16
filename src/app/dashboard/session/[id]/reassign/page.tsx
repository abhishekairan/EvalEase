// app/dashboard/session/[id]/reassign/page.tsx
import { notFound, redirect } from "next/navigation"
import { getSessionById, getTeamsBySession, getJuryBySession, getParticipants, getTeamMembersWithData } from "@/db/utils"
import { ReassignTeamsForm } from "@/components/ReassignTeamsForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Users2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReassignTeamsPage({ params }: PageProps) {
  const { id } = await params
  const sessionId = parseInt(id)

  if (isNaN(sessionId)) {
    notFound()
  }

  // Fetch session data
  const session = await getSessionById(sessionId)
  
  if (!session) {
    notFound()
  }

  // Don't allow reassignment for ended sessions
  if (session.endedAt) {
    redirect("/dashboard/session")
  }

  // Fetch teams and jury for this session
  const [rawTeams, juryMembers] = await Promise.all([
    getTeamsBySession(sessionId),
    getJuryBySession({ sessionId })
  ])

  // Populate teams with leader and members
  const teams = await Promise.all(
    rawTeams.map(async (team) => {
      const [leader] = await getParticipants({ id: team.leaderId })
      const memberData = await getTeamMembersWithData({ teamId: team.id! })
      const members = memberData.map(m => m.memberId)
      return {
        ...team,
        leaderId: leader,
        members
      }
    })
  )

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/session" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Teams Found</CardTitle>
            <CardDescription>
              There are no teams available for assignment in this session.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!juryMembers || juryMembers.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/session" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Jury Members</CardTitle>
            <CardDescription>
              No jury members are assigned to this session. Please assign jury members before reassigning teams.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Build initial assignments map
  const initialAssignments = new Map<number, number>()
  teams.forEach(team => {
    if (team.juryId) {
      initialAssignments.set(team.id!, team.juryId)
    }
  })

  // Check if session is active
  const isActive = session.startedAt && !session.endedAt

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/session" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Users2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reassign Teams</h1>
                <p className="text-lg text-muted-foreground">{session.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
              {isActive ? "Active Session" : "Inactive Session"}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {teams.length} teams
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {juryMembers.length} jury
            </Badge>
          </div>
        </div>

        {/* Warning for active sessions */}
        {isActive && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">
                    Warning: Active Session
                  </p>
                  <p className="text-sm text-amber-800">
                    This session is currently active. Reassigning teams will not delete existing marks, 
                    but jury members may see different teams assigned to them. Consider the impact before saving changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reassignment Form */}
      <ReassignTeamsForm
        sessionId={sessionId}
        teams={teams}
        juryMembers={juryMembers}
        initialAssignments={initialAssignments}
      />
    </div>
  )
}
