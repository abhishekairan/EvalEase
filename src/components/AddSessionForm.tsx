// components/AddSessionForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useState, useRef, useCallback, useEffect } from "react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { addSessionAction, saveDraftAction, publishDraftAction } from "@/actions/sessionActions"
import { juryDBType, TeamDataType, sessionDBType } from "@/zod"
import { toast } from "@/lib/toast";
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

// Draft state snapshot for autosave
interface DraftSnapshot {
  name: string
  selectedJury: number[]
  teamAssignments: Map<number, number>
  timestamp: Date
}

interface AddSessionFormProps {
  juryMembers: juryDBType[]
  teams: TeamDataType[]
  draftId?: number | null
  existingDraft?: sessionDBType | null
}

export function AddSessionForm({ 
  juryMembers, 
  teams, 
  draftId = null,
  existingDraft = null 
}: AddSessionFormProps) {
  const router = useRouter()
  const [selectedJury, setSelectedJury] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState<"details" | "jury" | "teams">("details")
  const [teamAssignments, setTeamAssignments] = useState<Map<number, number>>(new Map())
  
  // Draft management state
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(draftId)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [draftSnapshots, setDraftSnapshots] = useState<DraftSnapshot[]>([])
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm<AddSessionFormValues>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: {
      name: existingDraft?.name || "",
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

  // Save draft snapshot to array (memory)
  const saveDraftSnapshot = useCallback(() => {
    const snapshot: DraftSnapshot = {
      name: sessionName || "",
      selectedJury: [...selectedJury],
      teamAssignments: new Map(teamAssignments),
      timestamp: new Date()
    }
    setDraftSnapshots(prev => [...prev, snapshot])
  }, [sessionName, selectedJury, teamAssignments])

  // Debounced draft save to database
  const saveDraftToDatabase = useCallback(async () => {
    if (!sessionName || sessionName.trim().length === 0) return

    setIsDraftSaving(true)
    try {
      const result = await saveDraftAction(
        currentDraftId,
        sessionName,
        selectedJury,
        teamAssignments
      )
      
      if (result.success && result.draftId) {
        setCurrentDraftId(result.draftId)
        setLastSavedAt(new Date())
        // Clear snapshots after successful DB save
        setDraftSnapshots([])
      }
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsDraftSaving(false)
    }
  }, [currentDraftId, sessionName, selectedJury, teamAssignments])

  // Setup autosave with debounce (5 seconds) during jury assignment step
  useEffect(() => {
    if (currentStep !== "jury" || !sessionName || sessionName.trim().length === 0) return

    // Save snapshot to array immediately
    saveDraftSnapshot()

    // Clear existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current)
    }

    // Set new timeout for debounced DB save (5 seconds)
    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraftToDatabase()
    }, 5000)

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current)
      }
    }
  }, [selectedJury, currentStep, sessionName, saveDraftSnapshot, saveDraftToDatabase])

  // Setup autosave with debounce (5 seconds) during team assignment step
  useEffect(() => {
    if (currentStep !== "teams" || !sessionName || sessionName.trim().length === 0) return

    // Save snapshot to array immediately
    saveDraftSnapshot()

    // Clear existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current)
    }

    // Set new timeout for debounced DB save (5 seconds)
    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraftToDatabase()
    }, 5000)

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current)
      }
    }
  }, [teamAssignments, currentStep, sessionName, saveDraftSnapshot, saveDraftToDatabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current)
      }
    }
  }, [])

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
    const allJuryIds = juryMembers.map(jury => jury.id!)
    
    setSelectedJury(allJuryIds)
    form.setValue("selectedJury", allJuryIds)
    clearErrors("selectedJury")
  }

  const clearAllJury = () => {
    setSelectedJury([])
    form.setValue("selectedJury", [])
    // Clear all team assignments when clearing jury
    setTeamAssignments(new Map())
  }

  // Manual save draft handler
  const handleSaveDraft = async () => {
    if (!sessionName || sessionName.trim().length === 0) {
      toast.error("Cannot save draft", {
        description: "Please enter a session name first"
      })
      return
    }

    setIsDraftSaving(true)
    try {
      const result = await saveDraftAction(
        currentDraftId,
        sessionName,
        selectedJury,
        teamAssignments
      )

      if (result.success && result.draftId) {
        setCurrentDraftId(result.draftId)
        setLastSavedAt(new Date())
        setDraftSnapshots([])
        toast.success("Draft saved", {
          description: "Your session draft has been saved"
        })
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft", {
        description: "Please try again"
      })
    } finally {
      setIsDraftSaving(false)
    }
  }

  const onSubmit = async (data: AddSessionFormValues) => {
    try {
      clearErrors("root")

      // If editing a draft, publish it instead of creating new
      if (currentDraftId) {
        const result = await publishDraftAction(
          currentDraftId,
          data.selectedJury,
          teamAssignments
        )

        if (result.success) {
          toast.success("Session published", {
            description: `${data.name} has been published`
          })
          router.push("/dashboard/session")
          router.refresh()
        }
        return
      }

      // Create new session (non-draft flow)
      const result = await addSessionAction({
        name: data.name,
        juryIds: data.selectedJury,
        teamAssignments: teamAssignments,
      })

      if (result.success) {
        toast.success("Session created", {
          description: `${data.name} has been added to the system`
        })
        router.push("/dashboard/session")
        router.refresh()
      }
    } catch (error) {
      console.error("Error creating session:", error)
      setError("root", {
        type: "manual",
        message: "Failed to create session. Please try again.",
      })
      toast.error("Failed to create session", {
        description: "Please check your input and try again"
      })
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

  // All jury members are available for assignment (can be in multiple sessions)
  const availableJury = juryMembers
  const assignedJury: typeof juryMembers = []

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  {currentDraftId ? "Resume Draft" : "Add New Session"}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {isDraftSaving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving draft...
                    </span>
                  ) : lastSavedAt ? (
                    `Last saved: ${lastSavedAt.toLocaleTimeString()}`
                  ) : (
                    "Create a new session with jury and team assignments"
                  )}
                </p>
              </div>
            </div>
            
            {/* Desktop: Quick stats + Save Draft button */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isDraftSaving || !sessionName}
                className="flex items-center gap-2"
              >
                {isDraftSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Save Draft</span>
              </Button>
              <HeaderStats 
                sessionName={sessionName}
                selectedJuryCount={selectedJury.length}
                teamsAssignedCount={teamAssignments.size}
              />
            </div>
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
