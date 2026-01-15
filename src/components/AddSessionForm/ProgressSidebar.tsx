import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, CheckCircle, LucideIcon } from "lucide-react"

interface Step {
  key: string
  label: string
  icon: LucideIcon
  description: string
  color: string
}

interface ProgressSidebarProps {
  currentStep: string
  canProceedToJury: boolean
  canProceedToTeams: boolean
}

export function ProgressSidebar({ currentStep, canProceedToJury, canProceedToTeams }: ProgressSidebarProps) {
  const steps: Step[] = [
    { 
      key: "details", 
      label: "Session Details", 
      icon: Calendar,
      description: "Enter session name",
      color: "blue"
    },
    { 
      key: "jury", 
      label: "Select Jury", 
      icon: Users,
      description: "Choose jury members",
      color: "purple"
    },
    { 
      key: "teams", 
      label: "Assign Teams", 
      icon: CheckCircle,
      description: "Assign teams to jury",
      color: "green"
    },
  ]

  return (
    <>
      {/* Mobile: Horizontal progress indicator */}
      <Card className="lg:hidden mb-6 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.key
              const isCompleted = 
                (step.key === "details" && canProceedToJury) ||
                (step.key === "jury" && canProceedToTeams)

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Desktop: Vertical progress sidebar with enhanced design */}
      <Card className="hidden lg:block shadow-sm border-l-4 py-0 border-l-blue-500">
        <CardHeader className="py-3 bg-gradient-to-br from-blue-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.key
            const isCompleted = 
              (step.key === "details" && canProceedToJury) ||
              (step.key === "jury" && canProceedToTeams)

            return (
              <div key={step.key} className="relative">
                {index < 2 && (
                  <div className={`absolute left-[18px] top-12 w-0.5 h-14 transition-colors duration-300 ${
                    isCompleted ? 'bg-gradient-to-b from-green-500 to-green-400' : 'bg-gray-200'
                  }`} />
                )}
                
                <div className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-gradient-to-r from-blue-50 to-transparent shadow-sm' : ''
                }`}>
                  <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110' : 
                    isCompleted ? 'bg-green-600 text-white shadow-md shadow-green-200' : 
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold transition-colors ${
                      isActive ? 'text-blue-700' : 
                      isCompleted ? 'text-green-700' : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isActive ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                    {isActive && (
                      <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700 bg-blue-50">
                        In Progress
                      </Badge>
                    )}
                    {isCompleted && !isActive && (
                      <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-700 border-green-300">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}
