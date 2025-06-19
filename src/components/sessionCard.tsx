// components/SessionCard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Play,
  Square,
  Shuffle,
  Users,
  Trophy,
  Clock,
  Calendar,
  CheckCircle,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SessionStats {
  totalTeams: number
  totalJury: number
  totalMarks: number
  submittedMarks: number
  averageScore: number
  isActive: boolean
}

interface SessionCardProps {
  session: {
    id: number
    name: string
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }
  stats: SessionStats
  onStartSession: (sessionId: number) => Promise<void>
  onEndSession: (sessionId: number) => Promise<void>
  onShuffleStudents: (sessionId: number) => Promise<void>
  onDeleteSession: (sessionId: number) => Promise<void>
  isLoading?: boolean
}

export function SessionCard({ 
  session, 
  stats, 
  onStartSession, 
  onEndSession, 
  onShuffleStudents,
  onDeleteSession,
  isLoading = false 
}: SessionCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (action: string, callback: (id: number) => Promise<void>) => {
    setActionLoading(action)
    try {
      await callback(session.id)
    } finally {
      setActionLoading(null)
    }
  }

  const getSessionStatus = () => {
    if (session.startedAt && !session.endedAt) {
      return { status: "active", label: "Active", color: "bg-green-500" }
    } else if (session.endedAt) {
      return { status: "ended", label: "Ended", color: "bg-gray-500" }
    } else {
      return { status: "pending", label: "Pending", color: "bg-yellow-500" }
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const sessionStatus = getSessionStatus()
  const completionRate = stats.totalMarks > 0 ? (stats.submittedMarks / stats.totalMarks) * 100 : 0

  return (
    <Card className={cn(
      "w-full max-w-md transition-all duration-200 hover:shadow-xl border-0",
      "shadow-lg hover:shadow-2xl hover:-translate-y-1",
      stats.isActive && "ring-2 ring-green-500 "
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 truncate">
            {session.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn("text-white text-xs", sessionStatus.color)}
            >
              {sessionStatus.label}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={actionLoading !== null || isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{session.name}"? This action cannot be undone.
                    All marks and jury assignments for this session will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction("delete", onDeleteSession)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          Created: {formatDate(session.createdAt)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <span>Started:</span>
            </div>
            <span className="font-medium">{formatDate(session.startedAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-red-600" />
              <span>Ended:</span>
            </div>
            <span className="font-medium">{formatDate(session.endedAt)}</span>
          </div>
        </div>

        <Separator />

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Teams</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalTeams}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Jury</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalJury}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Submitted</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.submittedMarks}/{stats.totalMarks}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {stats.averageScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span className="font-medium">{completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button
          variant={sessionStatus.status === "active" ? "secondary" : "default"}
          size="sm"
          className="flex-1"
          onClick={() => handleAction("start", onStartSession)}
          disabled={
            sessionStatus.status === "active" || 
            sessionStatus.status === "ended" || 
            actionLoading === "start" ||
            isLoading
          }
        >
          {actionLoading === "start" ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Starting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start
            </div>
          )}
        </Button>

        <Button
          variant={sessionStatus.status === "ended" ? "secondary" : "destructive"}
          size="sm"
          className="flex-1"
          onClick={() => handleAction("end", onEndSession)}
          disabled={
            sessionStatus.status === "ended" || 
            sessionStatus.status === "pending" || 
            actionLoading === "end" ||
            isLoading
          }
        >
          {actionLoading === "end" ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Ending...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              End
            </div>
          )}
        </Button>

        {/* Updated Shuffle Button with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={actionLoading === "shuffle" || isLoading}
            >
              {actionLoading === "shuffle" ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Shuffling...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </div>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Shuffle Team Assignments</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to shuffle team assignments for "{session.name}"?
                </p>
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p><strong>Current Distribution:</strong></p>
                  <p>• {stats.totalTeams} teams</p>
                  <p>• {stats.totalJury} jury members</p>
                  <p>• ~{Math.ceil(stats.totalTeams / Math.max(stats.totalJury, 1))} teams per jury member</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will randomly redistribute all teams among jury members in this session. 
                  Existing marks and evaluations will remain unchanged.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleAction("shuffle", onShuffleStudents)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Shuffle Teams
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
