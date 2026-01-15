import { Calendar, Users, CheckCircle } from "lucide-react"

interface HeaderStatsProps {
  sessionName: string
  selectedJuryCount: number
  teamsAssignedCount: number
}

export function HeaderStats({ sessionName, selectedJuryCount, teamsAssignedCount }: HeaderStatsProps) {
  return (
    <div className="hidden xl:flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-900">{sessionName || "Unnamed"}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
        <Users className="h-4 w-4 text-purple-600" />
        <span className="font-medium text-purple-900">{selectedJuryCount} Jury</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="font-medium text-green-900">{teamsAssignedCount} Assigned</span>
      </div>
    </div>
  )
}
