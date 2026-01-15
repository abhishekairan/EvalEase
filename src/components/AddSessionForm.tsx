// components/AddSessionForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useState } from "react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { addSessionAction } from "@/actions/sessionActions"
import { juryDBType, TeamDataType } from "@/zod"
import { toast } from "sonner"
import { ProgressSidebar } from "./AddSessionForm/ProgressSidebar"
import { SessionSummaryCard } from "./AddSessionForm/SessionSummaryCard"
import { HeaderStats } from "./AddSessionForm/HeaderStats"
import { SessionDetailsStep } from "./AddSessionForm/SessionDetailsStep"
import { JurySelectionStep } from "./AddSessionForm/JurySelectionStep"
import { TeamAssignmentStep } from "./AddSessionForm/TeamAssignmentStep"


// Zod schema for session validation
const addSessionSchema = z.object({
  name: z
    .string()
    .min(1, "Session name is required")
    .max(255, "Session name must be less than 255 characters"),
  selectedJury: z
    .array(z.number())
    .min(1, "At least one jury member must be selected"),
})

type AddSessionFormValues = z.infer<typeof addSessionSchema>

interface AddSessionFormProps {
  juryMembers: juryDBType[]
  teams: TeamDataType[]
}

export function AddSessionForm({ juryMembers, teams }: AddSessionFormProps) {
  const router = useRouter()
  const [selectedJury, setSelectedJury] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState<"details" | "jury" | "teams">("details")
  const [teamAssignments, setTeamAssignments] = useState<Map<number, number>>(new Map())

  const form = useForm<AddSessionFormValues>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: {
      name: "",
      selectedJury: [],
    },
  })

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    clearErrors,
    watch,
  } = form

  // Watch form fields for reactive updates
  const sessionName = watch("name")

  const handleJurySelection = (juryId: number, checked: boolean) => {
    let newSelection: number[]
    
    if (checked) {
      newSelection = [...selectedJury, juryId]
    } else {
      newSelection = selectedJury.filter(id => id !== juryId)
      
      // Remove team assignments for this jury member
      const updatedAssignments = new Map(teamAssignments)
      for (const [teamId, assignedJuryId] of updatedAssignments.entries()) {
        if (assignedJuryId === juryId) {
          updatedAssignments.delete(teamId)
        }
      }
      setTeamAssignments(updatedAssignments)
    }
    
    setSelectedJury(newSelection)
    form.setValue("selectedJury", newSelection)
    
    if (newSelection.length > 0 && errors.selectedJury) {
      clearErrors("selectedJury")
    }
  }

  const selectAllJury = () => {
    const availableJury = juryMembers
      .filter(jury => jury.session === null)
      .map(jury => jury.id!)
    
    setSelectedJury(availableJury)
    form.setValue("selectedJury", availableJury)
    clearErrors("selectedJury")
  }

  const clearAllJury = () => {
    setSelectedJury([])
    form.setValue("selectedJury", [])
    // Clear all team assignments when clearing jury
    setTeamAssignments(new Map())
  }

  const onSubmit = async (data: AddSessionFormValues) => {
    try {
      clearErrors("root")

      const result = await addSessionAction({
        name: data.name,
        juryIds: data.selectedJury,
        teamAssignments: teamAssignments,
      })

      if (result.success) {
        toast.success("Session created successfully!")
        router.push("/dashboard/session")
        router.refresh()
      }
    } catch (error) {
      console.error("Error creating session:", error)
      setError("root", {
        type: "manual",
        message: "Failed to create session. Please try again.",
      })
      toast.error("Failed to create session")
    }
  }

  const canProceedToJury = () => {
    return sessionName?.trim().length > 0
  }

  const canProceedToTeams = () => {
    return selectedJury.length > 0
  }

  const handleNext = () => {
    if (currentStep === "details" && canProceedToJury()) {
      setCurrentStep("jury")
    } else if (currentStep === "jury" && canProceedToTeams()) {
      setCurrentStep("teams")
    }
  }

  const handleBack = () => {
    if (currentStep === "teams") {
      setCurrentStep("jury")
    } else if (currentStep === "jury") {
      setCurrentStep("details")
    }
  }

  const selectedJuryMembers = juryMembers.filter(j => selectedJury.includes(j.id!))

  // Filter jury members - available vs assigned
  const availableJury = juryMembers.filter(jury => jury.session === null)
  const assignedJury = juryMembers.filter(jury => jury.session !== null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Header Section - Fixed at top with gradient */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Add New Session
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Create a new session with jury and team assignments
                </p>
              </div>
            </div>
            
            {/* Desktop: Quick stats */}
            <HeaderStats 
              sessionName={sessionName}
              selectedJuryCount={selectedJury.length}
              teamsAssignedCount={teamAssignments.size}
            />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Desktop: Split layout | Mobile: Stacked */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10">
              
              {/* Left Sidebar - Progress Steps */}
              <div className="lg:col-span-3 mb-6 lg:mb-0">
                <div className="lg:sticky lg:top-28">
                  <ProgressSidebar 
                    currentStep={currentStep}
                    canProceedToJury={canProceedToJury()}
                    canProceedToTeams={canProceedToTeams()}
                  />

                  {/* Desktop: Session summary card */}
                  <SessionSummaryCard 
                    sessionName={sessionName}
                    selectedJuryCount={selectedJury.length}
                    teamsAssignedCount={teamAssignments.size}
                    totalTeamsCount={teams.length}
                  />
                </div>
              </div>

              {/* Right Content Area - Enhanced */}
              <div className="lg:col-span-9">
                <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as typeof currentStep)}>
                  <TabsList className="hidden">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="jury">Jury</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                  </TabsList>

                  {/* Step 1: Session Details */}
                  <TabsContent value="details">
                    <SessionDetailsStep 
                      control={form.control}
                      isSubmitting={isSubmitting}
                      canProceed={canProceedToJury()}
                      onNext={handleNext}
                    />
                  </TabsContent>

                  {/* Step 2: Jury Selection */}
                  <TabsContent value="jury">
                    <JurySelectionStep 
                      juryMembers={juryMembers}
                      selectedJury={selectedJury}
                      availableJury={availableJury}
                      assignedJury={assignedJury}
                      isSubmitting={isSubmitting}
                      errors={errors}
                      onJurySelection={handleJurySelection}
                      onSelectAll={selectAllJury}
                      onClearAll={clearAllJury}
                      onBack={handleBack}
                      onNext={handleNext}
                      canProceed={canProceedToTeams()}
                    />
                  </TabsContent>

                  {/* Step 3: Team Assignment */}
                  <TabsContent value="teams">
                    <TeamAssignmentStep 
                      teams={teams}
                      selectedJuryMembers={selectedJuryMembers}
                      allJuryMembers={juryMembers}
                      teamAssignments={teamAssignments}
                      sessionName={sessionName}
                      isSubmitting={isSubmitting}
                      errors={errors}
                      onAssignmentsChange={setTeamAssignments}
                      onJuryAdd={(juryId) => handleJurySelection(juryId, true)}
                      onJuryRemove={(juryId) => handleJurySelection(juryId, false)}
                      onBack={handleBack}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
