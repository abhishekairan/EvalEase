import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SessionSummaryCardProps {
  sessionName: string
  selectedJuryCount: number
  teamsAssignedCount: number
  totalTeamsCount: number
}

export function SessionSummaryCard({ 
  sessionName, 
  selectedJuryCount, 
  teamsAssignedCount, 
  totalTeamsCount 
}: SessionSummaryCardProps) {
  return (
    <Card className="hidden lg:block mt-4 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">Session Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-gray-600">Session Name</span>
          <span className="font-medium text-right max-w-[150px] truncate">
            {sessionName || <span className="text-gray-400">Not set</span>}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-gray-600">Jury Members</span>
          <Badge variant={selectedJuryCount > 0 ? "default" : "secondary"}>
            {selectedJuryCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-600">Teams Assigned</span>
          <Badge variant={teamsAssignedCount > 0 ? "default" : "secondary"}>
            {teamsAssignedCount} / {totalTeamsCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
