import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, ArrowLeft, ArrowRight } from "lucide-react"
import { juryDBType } from "@/zod"
import { FieldErrors } from "react-hook-form"

interface JurySelectionStepProps {
  juryMembers: juryDBType[]
  selectedJury: number[]
  availableJury: juryDBType[]
  assignedJury: juryDBType[]
  isSubmitting: boolean
  errors: FieldErrors
  onJurySelection: (juryId: number, checked: boolean) => void
  onSelectAll: () => void
  onClearAll: () => void
  onBack: () => void
  onNext: () => void
  canProceed: boolean
}

export function JurySelectionStep({
  juryMembers,
  selectedJury,
  availableJury,
  assignedJury,
  isSubmitting,
  errors,
  onJurySelection,
  onSelectAll,
  onClearAll,
  onBack,
  onNext,
  canProceed
}: JurySelectionStepProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                Select Jury Members
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Choose jury members who will evaluate teams in this session
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                disabled={isSubmitting || availableJury.length === 0}
                className="hover:bg-purple-50"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearAll}
                disabled={isSubmitting || selectedJury.length === 0}
                className="hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-medium text-green-700">Available: {availableJury.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium text-blue-700">Selected: {selectedJury.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="font-medium text-gray-700">Assigned: {assignedJury.length}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {errors.selectedJury && (
            <div className="mb-4 text-sm text-red-500 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{errors.selectedJury.message as string}</span>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-12 text-center">Select</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Email</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Phone</TableHead>
                    <TableHead className="w-24 text-center font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {juryMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="h-8 w-8 text-gray-300" />
                          </div>
                          <div>
                            <p className="font-medium">No jury members found</p>
                            <p className="text-sm text-gray-400 mt-1">Add jury members first to create a session</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    juryMembers.map((jury) => {
                      const isAvailable = jury.session === null
                      const isSelected = selectedJury.includes(jury.id!)
                      
                      return (
                        <TableRow 
                          key={jury.id}
                          className={`transition-colors ${
                            isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                          }`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                onJurySelection(jury.id!, checked as boolean)
                              }
                              disabled={!isAvailable || isSubmitting}
                              className={isSelected ? "border-blue-500" : ""}
                            />
                          </TableCell>
                          
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-gray-900">{jury.name}</span>
                              <span className="sm:hidden text-xs text-muted-foreground">
                                {jury.email}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden sm:table-cell text-gray-600">
                            {jury.email}
                          </TableCell>
                          
                          <TableCell className="hidden md:table-cell text-gray-600">
                            {jury.phoneNumber}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <Badge 
                              variant={isAvailable ? "default" : "secondary"}
                              className={isAvailable ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {isAvailable ? "Free" : `Session ${jury.session}`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 px-6 h-11"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Step 2 of 3
          </div>
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 h-11 shadow-sm"
          >
            Next: Assign Teams
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
