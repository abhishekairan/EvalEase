import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft, CheckCircle } from "lucide-react"
import { TeamJuryAssignment } from "@/components/TeamJuryAssignment"
import { juryDBType, TeamDataType } from "@/zod"
import { FieldErrors } from "react-hook-form"

interface TeamAssignmentStepProps {
  teams: TeamDataType[]
  selectedJuryMembers: juryDBType[]
  allJuryMembers: juryDBType[]
  teamAssignments: Map<number, number>
  sessionName: string
  isSubmitting: boolean
  errors: FieldErrors
  onAssignmentsChange: (assignments: Map<number, number>) => void
  onJuryAdd: (juryId: number) => void
  onJuryRemove: (juryId: number) => void
  onBack: () => void
}

export function TeamAssignmentStep({
  teams,
  selectedJuryMembers,
  allJuryMembers,
  teamAssignments,
  sessionName,
  isSubmitting,
  errors,
  onAssignmentsChange,
  onJuryAdd,
  onJuryRemove,
  onBack
}: TeamAssignmentStepProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 pt-0 gap-0">
        <CardHeader className="bg-gray-50 p-6">
          <div className="p-2 bg-green-100 rounded-lg text-center gap-2 align-middle mb-2">
        <CardTitle className="flex gap-2 items-center text-center text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Assign Teams to Jury
          </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add jury members using the + button below and assign teams to them for evaluation
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {selectedJuryMembers.length > 0 ? (
            <TeamJuryAssignment
              teams={teams}
              jury={selectedJuryMembers}
              allJury={allJuryMembers}
              onAssignmentsChange={onAssignmentsChange}
              onJuryAdd={onJuryAdd}
              onJuryRemove={onJuryRemove}
              initialAssignments={teamAssignments}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 mb-2">No jury members selected</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Click the + button in the Jury Load Distribution card below to add jury members and start assigning teams
              </p>
              <div className="mt-6">
                <TeamJuryAssignment
                  teams={teams}
                  jury={[]}
                  allJury={allJuryMembers}
                  onAssignmentsChange={onAssignmentsChange}
                  onJuryAdd={onJuryAdd}
                  onJuryRemove={onJuryRemove}
                  initialAssignments={teamAssignments}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {errors.root && (
        <div className="text-sm text-red-500 text-center bg-red-50 p-4 rounded-lg border border-red-200 flex items-center justify-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>{errors.root.message as string}</span>
        </div>
      )}

      {/* Desktop: Final review card */}
      <Card className="hidden lg:block shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Ready to Submit?</h4>
              <div className="space-y-1.5 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span><strong>{sessionName || "Session"}</strong> will be created</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span><strong>{selectedJuryMembers.length}</strong> jury members will be assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span><strong>{teamAssignments.size}</strong> teams will be pre-assigned</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center gap-2 px-6 h-11"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-gray-500 hidden sm:block">
            Step 3 of 3
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedJuryMembers.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-11 shadow-md hover:shadow-lg transition-shadow"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Session...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Create Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
