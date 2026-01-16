// components/ReassignTeamsForm.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Save, X } from "lucide-react"
import { TeamJuryAssignment } from "@/components/TeamJuryAssignment"
import { TeamDataType, juryDBType } from "@/zod"
import { reassignTeamsForSession } from "@/actions/sessionActions"
import { toast } from "@/lib/toast";

interface ReassignTeamsFormProps {
  sessionId: number
  teams: TeamDataType[]
  juryMembers: juryDBType[]
  initialAssignments: Map<number, number>
}

export function ReassignTeamsForm({
  sessionId,
  teams,
  juryMembers,
  initialAssignments,
}: ReassignTeamsFormProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Map<number, number>>(
    new Map(initialAssignments)
  )
  const [isSaving, setIsSaving] = useState(false)

  // Reset assignments when initial data changes
  useEffect(() => {
    setAssignments(new Map(initialAssignments))
  }, [initialAssignments])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert Map to array of tuples for the server action
      const assignmentArray = Array.from(assignments.entries())
      await reassignTeamsForSession(sessionId, assignmentArray)
      toast.success("Team assignments updated", {
        description: "Changes have been saved successfully"
      })
      router.push("/dashboard/session")
      router.refresh()
    } catch (error) {
      console.error("Failed to save assignments:", error)
      toast.error("Failed to update assignments", {
        description: "Please try again or contact support"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/session")
  }

  const hasChanges = () => {
    if (assignments.size !== initialAssignments.size) return true
    
    for (const [teamId, juryId] of assignments.entries()) {
      if (initialAssignments.get(teamId) !== juryId) return true
    }
    return false
  }

  return (
    <div className="space-y-6">
      {/* Team Assignment Component */}
      <Card>
        <CardContent className="pt-6">
          <TeamJuryAssignment
            teams={teams}
            jury={juryMembers}
            onAssignmentsChange={setAssignments}
            initialAssignments={initialAssignments}
          />
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Card className="sticky bottom-4 shadow-lg border-2">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasChanges() ? (
                <span className="text-amber-600 font-medium">
                  You have unsaved changes
                </span>
              ) : (
                <span>No changes made</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges() || isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
